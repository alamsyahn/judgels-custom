package judgels.jerahmeel.stats;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.util.Collections;
import java.util.List;
import org.immutables.value.Value;

@Value.Immutable
@JsonDeserialize(as = ImmutableStatsConfiguration.class)
public interface StatsConfiguration {
    StatsConfiguration DEFAULT = new Builder().build();

    @Value.Default
    default boolean getEnabled() {
        return false;
    }

    @Value.Default
    default List<String> getExcludedTopScorerUsernames() {
        return Collections.emptyList();
    }

    class Builder extends ImmutableStatsConfiguration.Builder {}
}
