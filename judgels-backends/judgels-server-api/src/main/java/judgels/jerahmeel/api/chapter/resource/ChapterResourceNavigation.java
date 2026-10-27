package judgels.jerahmeel.api.chapter.resource;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.util.Optional;
import org.immutables.value.Value;

@Value.Immutable
@JsonDeserialize(as = ImmutableChapterResourceNavigation.class)
public interface ChapterResourceNavigation {
    Optional<ChapterResource> getCurrent();
    Optional<ChapterResource> getPrevious();
    Optional<ChapterResource> getNext();

    class Builder extends ImmutableChapterResourceNavigation.Builder {}
}
