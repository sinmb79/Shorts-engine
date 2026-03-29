// src/adapters/upload/youtube-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class YoutubeUploadAdapter implements UploadAdapter {
  name = "youtube";
  platform: Platform = "youtube_shorts";

  async isAvailable(): Promise<boolean> {
    return (
      Boolean(process.env["YOUTUBE_CLIENT_ID"]) &&
      Boolean(process.env["YOUTUBE_REFRESH_TOKEN"])
    );
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "youtube", dry_run: true },
      };
    }

    const clientId = process.env["YOUTUBE_CLIENT_ID"];
    const refreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];
    if (!clientId || !refreshToken) {
      return {
        status: "error",
        error: "YOUTUBE_CLIENT_ID or YOUTUBE_REFRESH_TOKEN is not set in environment",
        metadata: { adapter: "youtube" },
      };
    }

    // YouTube Data API v3 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    //
    // Step 1: access token 갱신
    // const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams({
    //     client_id: clientId,
    //     refresh_token: refreshToken,
    //     grant_type: "refresh_token",
    //   }),
    // });
    // const { access_token } = await tokenRes.json() as { access_token: string };
    //
    // Step 2: 영상 업로드 (멀티파트)
    // const videoData = await readFile(_request.video_path);
    // const metadata = JSON.stringify({
    //   snippet: {
    //     title: _request.title,
    //     description: `${_request.description}\n${_request.hashtags.join(" ")}`,
    //     tags: _request.hashtags.map((h) => h.replace("#", "")),
    //   },
    //   status: { privacyStatus: "public" },
    // });
    // const boundary = "boundary_" + Date.now();
    // const body = Buffer.concat([
    //   Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
    //   videoData,
    //   Buffer.from(`\r\n--${boundary}--`),
    // ]);
    // const uploadRes = await fetch(
    //   "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${access_token}`,
    //       "Content-Type": `multipart/related; boundary=${boundary}`,
    //     },
    //     body,
    //   },
    // );
    // const data = await uploadRes.json() as { id: string };
    // return {
    //   status: "success",
    //   post_id: data.id,
    //   post_url: `https://www.youtube.com/shorts/${data.id}`,
    //   metadata: { adapter: "youtube" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "youtube",
        note: "Add YOUTUBE_CLIENT_ID and YOUTUBE_REFRESH_TOKEN to .env and uncomment the fetch calls above",
      },
    };
  }
}
