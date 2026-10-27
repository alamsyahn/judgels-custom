package judgels.jerahmeel.chapter.resource;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import judgels.jerahmeel.api.chapter.resource.ChapterResource;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Section;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Type;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceNavigation;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceReference;
import judgels.jerahmeel.persistence.ChapterDao;
import judgels.jerahmeel.persistence.ChapterLessonDao;
import judgels.jerahmeel.persistence.ChapterLessonModel;
import judgels.jerahmeel.persistence.ChapterLessonModel_;
import judgels.jerahmeel.persistence.ChapterModel;
import judgels.jerahmeel.persistence.ChapterProblemDao;
import judgels.jerahmeel.persistence.ChapterProblemModel;
import judgels.jerahmeel.persistence.ChapterProblemModel_;
import judgels.persistence.api.OrderDir;

public class ChapterResourceStore {
    private final ChapterLessonDao lessonDao;
    private final ChapterProblemDao problemDao;
    private final ChapterDao chapterDao;
    private final ObjectMapper mapper;

    @Inject
    public ChapterResourceStore(
            ChapterLessonDao lessonDao, ChapterProblemDao problemDao, ChapterDao chapterDao, ObjectMapper mapper) {
        this.lessonDao = lessonDao;
        this.problemDao = problemDao;
        this.chapterDao = chapterDao;
        this.mapper = mapper;
    }

    public List<ChapterResource> getResources(String chapterJid) {
        Map<String, ChapterResource> available = getAvailableResources(chapterJid);
        ChapterModel chapter = chapterDao.findByJid(chapterJid);
        List<ChapterResourceData> layout = readLayout(chapter.resourceLayout);
        List<ChapterResource> ordered = new ArrayList<>();
        for (ChapterResourceData item : layout) {
            ChapterResource resource = available.remove(key(item));
            if (resource != null) {
                ordered.add(new ChapterResource.Builder().from(resource).section(item.getSection()).build());
            }
        }
        // Newly added items remain visible; stale references never remove chapter content.
        ordered.addAll(available.values());

        List<ChapterResource> result = new ArrayList<>();
        for (Section section : Section.values()) {
            int index = 0;
            for (ChapterResource item : ordered) {
                if (item.getSection() == section) {
                    result.add(new ChapterResource.Builder().from(item).displayAlias(toAlias(index++)).build());
                }
            }
        }
        return List.copyOf(result);
    }

    public void setResources(String chapterJid, List<ChapterResourceData> data) {
        checkArgument(data != null, "Chapter resource layout is required");
        Map<String, ChapterResource> available = getAvailableResources(chapterJid);
        Set<String> seen = new HashSet<>();
        checkArgument(data.size() == available.size(), "Include every current chapter item exactly once. Reload and retry.");
        for (ChapterResourceData item : data) {
            checkArgument(item != null, "Chapter resource must not be null");
            checkArgument(available.containsKey(key(item)), "Resource does not belong to this chapter");
            checkArgument(seen.add(key(item)), "Duplicate chapter resource");
        }

        // Only presentation metadata is updated. No lesson, problem, alias, or submission is modified.
        ChapterModel chapter = chapterDao.findByJid(chapterJid);
        try {
            chapter.resourceLayout = mapper.writeValueAsString(data);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot serialize chapter resource layout", e);
        }
        chapterDao.update(chapter);
    }

    public ChapterResourceNavigation getNavigation(String chapterJid, String path) {
        List<ChapterResource> resources = getResources(chapterJid);
        for (int i = 0; i < resources.size(); i++) {
            if (resources.get(i).getPath().equals(path)) {
                return new ChapterResourceNavigation.Builder()
                        .current(resources.get(i))
                        .previous(i > 0 ? Optional.of(resources.get(i - 1)) : Optional.empty())
                        .next(i + 1 < resources.size() ? Optional.of(resources.get(i + 1)) : Optional.empty())
                        .build();
            }
        }
        return new ChapterResourceNavigation.Builder().build();
    }

    public List<Optional<String>> getPreviousAndNextResourcePathsForLesson(String chapterJid, String lessonAlias) {
        return getPaths(getNavigation(chapterJid, "/lessons/" + lessonAlias));
    }

    public List<Optional<String>> getPreviousAndNextResourcePathsForProblem(String chapterJid, String problemAlias) {
        return getPaths(getNavigation(chapterJid, "/problems/" + problemAlias));
    }

    private static List<Optional<String>> getPaths(ChapterResourceNavigation navigation) {
        return List.of(
                navigation.getPrevious().map(ChapterResource::getPath),
                navigation.getNext().map(ChapterResource::getPath));
    }

    private Map<String, ChapterResource> getAvailableResources(String chapterJid) {
        Map<String, ChapterResource> resources = new LinkedHashMap<>();
        for (ChapterLessonModel model : lessonDao.selectByChapterJid(chapterJid)
                .orderBy(ChapterLessonModel_.ALIAS, OrderDir.ASC).all()) {
            ChapterResource resource = new ChapterResource.Builder()
                    .type(Type.LESSON).resourceJid(model.lessonJid).section(Section.MAIN)
                    .alias(model.alias).displayAlias(model.alias).path("/lessons/" + model.alias).build();
            resources.put(key(resource), resource);
        }
        for (ChapterProblemModel model : problemDao.selectByChapterJid(chapterJid)
                .orderBy(ChapterProblemModel_.ALIAS, OrderDir.ASC).all()) {
            ChapterResource resource = new ChapterResource.Builder()
                    .type(Type.PROBLEM).resourceJid(model.problemJid).section(Section.MAIN)
                    .alias(model.alias).displayAlias(model.alias).path("/problems/" + model.alias).build();
            resources.put(key(resource), resource);
        }
        return resources;
    }

    private List<ChapterResourceData> readLayout(String json) {
        if (json == null) {
            return List.of();
        }
        try {
            return mapper.readValue(json, new TypeReference<List<ChapterResourceData>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read chapter resource layout", e);
        }
    }

    private static String key(ChapterResourceReference resource) {
        return resource.getType() + ":" + resource.getResourceJid();
    }

    private static String toAlias(int index) {
        StringBuilder alias = new StringBuilder();
        for (int n = index + 1; n > 0; n = (n - 1) / 26) {
            alias.insert(0, (char) ('A' + (n - 1) % 26));
        }
        return alias.toString();
    }
}
