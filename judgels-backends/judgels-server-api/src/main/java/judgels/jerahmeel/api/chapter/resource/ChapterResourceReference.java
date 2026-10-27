package judgels.jerahmeel.api.chapter.resource;

import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Section;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData.Type;

public interface ChapterResourceReference {
    Type getType();
    String getResourceJid();
    Section getSection();
}
