// src/adapters/upload/instagram-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class InstagramUploadAdapter implements UploadAdapter {
  name = "instagram";
  platform: Platform = "instagram_reels";

  async isAvailable(): Promise<boolean> {
    return (
      Boolean(process.env["INSTAGRAM_ACCESS_TOKEN"]) &&
      Boolean(process.env["INSTAGRAM_ACCOUNT_ID"])
    );
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "instagram", dry_run: true },
      };
    }

    const accessToken = process.env["INSTAGRAM_ACCESS_TOKEN"];
    const accountId = process.env["INSTAGRAM_ACCOUNT_ID"];
    if (!accessToken || !accountId) {
      return {
        status: "error",
        error: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID is not set in environment",
        metadata: { adapter: "instagram" },
      };
    }

    // Instagram Graph API Reels 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    // 주의: Instagram API는 공개 URL의 영상만 업로드 가능합니다 (로컬 파일 직접 업로드 불가).
    //
    // Step 1: 미디어 컨테이너 생성
    // const createRes = await fetch(
    //   `https://graph.facebook.com/v19.0/${accountId}/media`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       media_type: "REELS",
    //       video_url: "https://your-public-cdn.com/video.mp4",  // 공개 URL 필요
    //       caption: `${_request.description}\n${_request.hashtags.join(" ")}`,
    //       access_token: accessToken,
    //     }),
    //   },
    // );
    // const { id: containerId } = await createRes.json() as { id: string };
    //
    // Step 2: 게시
    // const publishRes = await fetch(
    //   `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    //   },
    // );
    // const { id: postId } = await publishRes.json() as { id: string };
    // return {
    //   status: "success",
    //   post_id: postId,
    //   post_url: `https://www.instagram.com/reel/${postId}/`,
    //   metadata: { adapter: "instagram" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "instagram",
        note: "Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to .env and uncomment the fetch calls above",
      },
    };
  }
}
