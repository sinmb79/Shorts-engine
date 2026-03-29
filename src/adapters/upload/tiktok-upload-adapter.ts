// src/adapters/upload/tiktok-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class TiktokUploadAdapter implements UploadAdapter {
  name = "tiktok";
  platform: Platform = "tiktok";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["TIKTOK_ACCESS_TOKEN"]);
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "tiktok", dry_run: true },
      };
    }

    const accessToken = process.env["TIKTOK_ACCESS_TOKEN"];
    if (!accessToken) {
      return {
        status: "error",
        error: "TIKTOK_ACCESS_TOKEN is not set in environment",
        metadata: { adapter: "tiktok" },
      };
    }

    // TikTok Content Posting API 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    //
    // Step 1: 업로드 초기화
    // const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${accessToken}`,
    //     "Content-Type": "application/json; charset=UTF-8",
    //   },
    //   body: JSON.stringify({
    //     post_info: {
    //       title: _request.title,
    //       privacy_level: "PUBLIC_TO_EVERYONE",
    //       disable_duet: false,
    //       disable_comment: false,
    //       disable_stitch: false,
    //     },
    //     source_info: { source: "FILE_UPLOAD", video_size: 0 },
    //   }),
    // });
    // const { data: { publish_id, upload_url } } = await initRes.json() as {
    //   data: { publish_id: string; upload_url: string }
    // };
    //
    // Step 2: 영상 파일 업로드
    // const videoData = await readFile(_request.video_path);
    // await fetch(upload_url, {
    //   method: "PUT",
    //   headers: { "Content-Type": "video/mp4", "Content-Range": `bytes 0-${videoData.length - 1}/${videoData.length}` },
    //   body: videoData,
    // });
    // return {
    //   status: "success",
    //   post_id: publish_id,
    //   post_url: `https://www.tiktok.com/@me/video/${publish_id}`,
    //   metadata: { adapter: "tiktok" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "tiktok",
        note: "Add TIKTOK_ACCESS_TOKEN to .env and uncomment the fetch calls above",
      },
    };
  }
}
