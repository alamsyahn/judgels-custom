package judgels.jerahmeel;

import feign.Headers;
import feign.Param;
import feign.RequestLine;
import java.util.List;
import judgels.jerahmeel.api.chapter.Chapter;
import judgels.jerahmeel.api.chapter.ChapterCreateData;
import judgels.jerahmeel.api.chapter.ChapterUpdateData;
import judgels.jerahmeel.api.chapter.ChaptersResponse;
import judgels.jerahmeel.api.chapter.resource.ChapterResource;
import judgels.jerahmeel.api.chapter.resource.ChapterResourceData;

public interface ChapterClient {
    @RequestLine("GET /api/v2/chapters/{chapterJid}/resources")
    @Headers("Authorization: Bearer {token}")
    List<ChapterResource> getResources(@Param("token") String token, @Param("chapterJid") String chapterJid);

    @RequestLine("PUT /api/v2/chapters/{chapterJid}/resources")
    @Headers({"Authorization: Bearer {token}", "Content-Type: application/json"})
    void setResources(
            @Param("token") String token, @Param("chapterJid") String chapterJid, List<ChapterResourceData> data);

    @RequestLine("GET /api/v2/chapters")
    @Headers("Authorization: Bearer {token}")
    ChaptersResponse getChapters(@Param("token") String token);

    @RequestLine("POST /api/v2/chapters")
    @Headers({"Authorization: Bearer {token}", "Content-Type: application/json"})
    Chapter createChapter(@Param("token") String token, ChapterCreateData data);

    @RequestLine("POST /api/v2/chapters/{chapterJid}")
    @Headers({"Authorization: Bearer {token}", "Content-Type: application/json"})
    Chapter updateChapter(
            @Param("token") String token,
            @Param("chapterJid") String chapterJid,
            ChapterUpdateData data);
}
