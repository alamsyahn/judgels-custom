package judgels.jerahmeel.api.chapter.problem;

import java.util.Optional;
import java.util.Set;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceNavigation;

public interface ChapterProblemWorksheet {
    String getDefaultLanguage();
    Set<String> getLanguages();
    ChapterProblem getProblem();
    Optional<String> getPreviousResourcePath();
    Optional<String> getNextResourcePath();
    Optional<ChapterResourceNavigation> getNavigation();
}
