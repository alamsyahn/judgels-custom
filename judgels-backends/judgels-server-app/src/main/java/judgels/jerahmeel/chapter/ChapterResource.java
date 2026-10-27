package judgels.jerahmeel.chapter;

import static jakarta.ws.rs.core.HttpHeaders.AUTHORIZATION;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static judgels.service.ServiceUtils.checkAllowed;
import static judgels.service.ServiceUtils.checkFound;

import io.dropwizard.hibernate.UnitOfWork;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import java.util.List;
import java.util.Optional;
import judgels.jerahmeel.api.chapter.Chapter;
import judgels.jerahmeel.api.chapter.ChapterCreateData;
import judgels.jerahmeel.api.chapter.ChapterUpdateData;
import judgels.jerahmeel.api.chapter.ChaptersResponse;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData;
import judgels.jerahmeel.chapter.resource.ChapterResourceStore;
import judgels.jerahmeel.role.RoleChecker;
import judgels.service.actor.ActorChecker;
import judgels.service.api.actor.AuthHeader;

@Path("/api/v2/chapters")
public class ChapterResource {
    @Inject protected ActorChecker actorChecker;
    @Inject protected RoleChecker roleChecker;
    @Inject protected ChapterStore chapterStore;
    @Inject protected ChapterResourceStore resourceStore;

    @Inject public ChapterResource() {}

    @GET
    @Produces(APPLICATION_JSON)
    @UnitOfWork(readOnly = true)
    public ChaptersResponse getChapters(@HeaderParam(AUTHORIZATION) AuthHeader authHeader) {
        String actorJid = actorChecker.check(authHeader);
        checkAllowed(roleChecker.isAdmin(actorJid));

        List<Chapter> chapters = chapterStore.getChapters();
        return new ChaptersResponse.Builder()
                .data(chapters)
                .build();
    }

    @POST
    @Consumes(APPLICATION_JSON)
    @Produces(APPLICATION_JSON)
    @UnitOfWork
    public Chapter createChapter(
            @HeaderParam(AUTHORIZATION) AuthHeader authHeader,
            ChapterCreateData data) {

        String actorJid = actorChecker.check(authHeader);
        checkAllowed(roleChecker.isAdmin(actorJid));

        return chapterStore.createChapter(data);
    }

    @GET
    @Path("/{chapterJid}/resources")
    @Produces(APPLICATION_JSON)
    @UnitOfWork(readOnly = true)
    public List<judgels.jerahmeel.api.chapter.resource.ChapterResource> getResources(
            @HeaderParam(AUTHORIZATION) Optional<AuthHeader> authHeader,
            @PathParam("chapterJid") String chapterJid) {
        actorChecker.check(authHeader);
        checkFound(chapterStore.getChapterByJid(chapterJid));
        return resourceStore.getResources(chapterJid);
    }

    @PUT
    @Path("/{chapterJid}/resources")
    @Consumes(APPLICATION_JSON)
    @UnitOfWork
    public void setResources(
            @HeaderParam(AUTHORIZATION) AuthHeader authHeader,
            @PathParam("chapterJid") String chapterJid,
            List<ChapterResourceData> data) {
        String actorJid = actorChecker.check(authHeader);
        checkAllowed(roleChecker.isAdmin(actorJid));
        checkFound(chapterStore.getChapterByJid(chapterJid));
        resourceStore.setResources(chapterJid, data);
    }

    @POST
    @Path("/{chapterJid}")
    @Consumes(APPLICATION_JSON)
    @Produces(APPLICATION_JSON)
    @UnitOfWork
    public Chapter updateChapter(
            @HeaderParam(AUTHORIZATION) AuthHeader authHeader,
            @PathParam("chapterJid") String chapterJid,
            ChapterUpdateData data) {

        String actorJid = actorChecker.check(authHeader);
        checkFound(chapterStore.getChapterByJid(chapterJid));
        checkAllowed(roleChecker.isAdmin(actorJid));

        return chapterStore.updateChapter(chapterJid, data);
    }
}
