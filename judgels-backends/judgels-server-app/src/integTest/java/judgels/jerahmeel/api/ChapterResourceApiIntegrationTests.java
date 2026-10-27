package judgels.jerahmeel.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.List;
import judgels.JudgelsObjectMappers;
import judgels.jerahmeel.api.chapter.ChapterCreateData;
import judgels.jerahmeel.api.chapter.lesson.ChapterLessonData;
import judgels.jerahmeel.api.chapter.problem.ChapterProblemData;
import judgels.jerahmeel.api.chapter.resource.ChapterResource;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Section;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Type;
import judgels.sandalphon.api.problem.ProblemType;
import org.junit.jupiter.api.Test;

class ChapterResourceApiIntegrationTests extends BaseJerahmeelApiIntegrationTests {
    @Test
    void mixed_resources_challenges_and_existing_content_are_preserved() throws IOException {
        String chapterJid = chapterClient.createChapter(adminToken, new ChapterCreateData.Builder()
                .name("Mixed chapter").build()).getJid();
        chapterLessonClient.setLessons(adminToken, chapterJid, List.of(
                new ChapterLessonData.Builder().alias("A").slug(LESSON_1_SLUG).build(),
                new ChapterLessonData.Builder().alias("B").slug(LESSON_2_SLUG).build()));
        chapterProblemClient.setProblems(adminToken, chapterJid, List.of(
                new ChapterProblemData.Builder().alias("A").slug(PROBLEM_1_SLUG).type(ProblemType.PROGRAMMING).build(),
                new ChapterProblemData.Builder().alias("B").slug(PROBLEM_2_SLUG).type(ProblemType.PROGRAMMING).build(),
                new ChapterProblemData.Builder().alias("C").slug(PROBLEM_3_SLUG).type(ProblemType.BUNDLE).build()));

        var lessonsBefore = chapterLessonClient.getLessons(userToken, chapterJid).getData();
        var problemsBefore = chapterProblemClient.getProblems(userToken, chapterJid).getData();
        var original = chapterClient.getResources(userToken, chapterJid);
        assertThat(original).extracting(ChapterResource::getPath)
                .containsExactly("/lessons/A", "/lessons/B", "/problems/A", "/problems/B", "/problems/C");
        assertThat(original).extracting(ChapterResource::getSection).containsOnly(Section.MAIN);

        var layout = List.of(
                item(Type.LESSON, lesson1.getJid(), Section.MAIN),
                item(Type.PROBLEM, problem1.getJid(), Section.MAIN),
                item(Type.LESSON, lesson2.getJid(), Section.CHALLENGE),
                item(Type.PROBLEM, problem2.getJid(), Section.CHALLENGE),
                item(Type.PROBLEM, problem3.getJid(), Section.CHALLENGE));
        chapterClient.setResources(adminToken, chapterJid, layout);
        var resources = chapterClient.getResources(userToken, chapterJid);
        assertThat(resources).extracting(ChapterResource::getPath)
                .containsExactly("/lessons/A", "/problems/A", "/lessons/B", "/problems/B", "/problems/C");
        assertThat(resources).extracting(ChapterResource::getDisplayAlias).containsExactly("A", "B", "A", "B", "C");
        assertThat(resources).extracting(ChapterResource::getSection)
                .containsExactly(Section.MAIN, Section.MAIN, Section.CHALLENGE, Section.CHALLENGE, Section.CHALLENGE);

        var problem = getWorksheet(chapterJid, "A");
        assertThat(problem.path("nextResourcePath").asText()).isEqualTo("/lessons/B");
        assertThat(problem.path("navigation").path("next").path("section").asText()).isEqualTo("CHALLENGE");
        var challengeLesson = chapterLessonClient.getLessonStatement(userToken, chapterJid, "B");
        assertThat(challengeLesson.getPreviousResourcePath()).contains("/problems/A");
        assertThat(challengeLesson.getNextResourcePath()).contains("/problems/B");
        var challengeProblem = getWorksheet(chapterJid, "B");
        assertThat(challengeProblem.path("navigation").path("current").path("section").asText()).isEqualTo("CHALLENGE");
        assertThat(challengeProblem.path("nextResourcePath").asText()).isEqualTo("/problems/C");
        var bundleChallenge = getWorksheet(chapterJid, "C");
        assertThat(bundleChallenge.path("problem").path("type").asText()).isEqualTo("BUNDLE");
        assertThat(bundleChallenge.path("navigation").path("current").path("section").asText()).isEqualTo("CHALLENGE");
        assertThat(bundleChallenge.path("navigation").path("current").path("displayAlias").asText()).isEqualTo("C");

        assertForbidden(() -> chapterClient.setResources(userToken, chapterJid, layout));
        assertBadRequest(() -> chapterClient.setResources(adminToken, chapterJid, List.of()));
        assertBadRequest(() -> chapterClient.setResources(adminToken, chapterJid,
                List.of(layout.get(0), layout.get(0), layout.get(2), layout.get(3), layout.get(4))));
        assertBadRequest(() -> chapterClient.setResources(adminToken, chapterJid,
                List.of(layout.get(0), item(Type.PROBLEM, "foreign-problem", Section.MAIN), layout.get(2), layout.get(3), layout.get(4))));
        assertThat(chapterClient.getResources(userToken, chapterJid)).isEqualTo(resources);
        assertThat(chapterLessonClient.getLessons(userToken, chapterJid).getData()).isEqualTo(lessonsBefore);
        assertThat(chapterProblemClient.getProblems(userToken, chapterJid).getData()).isEqualTo(problemsBefore);

        // Adding content through the existing editor cannot silently hide it from the new layout.
        chapterLessonClient.setLessons(adminToken, chapterJid, List.of(
                new ChapterLessonData.Builder().alias("A").slug(LESSON_1_SLUG).build(),
                new ChapterLessonData.Builder().alias("B").slug(LESSON_2_SLUG).build(),
                new ChapterLessonData.Builder().alias("C").slug(LESSON_3_SLUG).build()));
        assertThat(chapterClient.getResources(userToken, chapterJid)).extracting(ChapterResource::getPath)
                .containsExactly("/lessons/A", "/problems/A", "/lessons/C", "/lessons/B", "/problems/B", "/problems/C");
        assertBadRequest(() -> chapterClient.setResources(adminToken, chapterJid, layout));
    }

    private static JsonNode getWorksheet(String chapterJid, String alias) throws IOException {
        String json = webTarget.path("/api/v2/chapters/" + chapterJid + "/problems/" + alias + "/worksheet")
                .request().header("Authorization", "Bearer " + userToken).get(String.class);
        return JudgelsObjectMappers.OBJECT_MAPPER.readTree(json);
    }

    private static ChapterResourceData item(Type type, String jid, Section section) {
        return new ChapterResourceData.Builder().type(type).resourceJid(jid).section(section).build();
    }
}
