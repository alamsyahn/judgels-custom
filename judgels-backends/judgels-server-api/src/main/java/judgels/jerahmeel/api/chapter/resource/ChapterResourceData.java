package judgels.jerahmeel.api.chapter.resource;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonDeserialize(as = ImmutableChapterResourceData.class)
public interface ChapterResourceData extends ChapterResourceReference {
    enum Type {
        LESSON,
        PROBLEM
    }

    enum Section {
        MAIN,
        CHALLENGE
    }

    class Builder extends ImmutableChapterResourceData.Builder {}
}
