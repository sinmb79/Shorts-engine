import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class LocalUploadAdapter implements UploadAdapter {
  name = "local";
  platform: Platform = "youtube_shorts";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async upload(
    request: UploadRequest,
    _options: UploadOptions,
  ): Promise<UploadResult> {
    return {
      status: "dry_run",
      metadata: {
        adapter: "local",
        platform: request.platform,
        video_path: request.video_path,
        title: request.title,
      },
    };
  }
}
