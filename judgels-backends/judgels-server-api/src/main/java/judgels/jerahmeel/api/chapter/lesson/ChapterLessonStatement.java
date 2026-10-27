package judgels.jerahmeel.api.chapter.lesson;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.util.Optional;
import java.util.Set;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceNavigation;
import judgels.sandalphon.api.lesson.LessonStatement;
import org.immutables.value.Value;

@Value.Immutable
@JsonDeserialize(as = ImmutableChapterLessonStatement.class)
public interface ChapterLessonStatement {
    String getDefaultLanguage();
    Set<String> getLanguages();
    ChapterLesson getLesson();
    LessonStatement getStatement();
    Optional<String> getPreviousResourcePath();
    Optional<String> getNextResourcePath();
    Optional<ChapterResourceNavigation> getNavigation();

    class Builder extends ImmutableChapterLessonStatement.Builder {}
}
