package judgels.jerahmeel.api.chapter.resource;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonDeserialize(as = ImmutableChapterResource.class)
public interface ChapterResource extends ChapterResourceReference {
    String getAlias();
    String getDisplayAlias();
    String getPath();

    class Builder extends ImmutableChapterResource.Builder {}
}
