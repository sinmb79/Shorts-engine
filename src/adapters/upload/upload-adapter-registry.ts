import type { Platform } from "../../domain/contracts.js";
import type { UploadAdapter } from "./upload-adapter.js";
import { InstagramUploadAdapter } from "./instagram-upload-adapter.js";
import { LocalUploadAdapter } from "./local-upload-adapter.js";
import { TiktokUploadAdapter } from "./tiktok-upload-adapter.js";
import { YoutubeUploadAdapter } from "./youtube-upload-adapter.js";

export const UPLOAD_ADAPTER_REGISTRY: Record<string, UploadAdapter> = {
  local: new LocalUploadAdapter(),
  youtube: new YoutubeUploadAdapter(),
  tiktok: new TiktokUploadAdapter(),
  instagram: new InstagramUploadAdapter(),
};

const local = UPLOAD_ADAPTER_REGISTRY["local"]!;

export async function resolveUploadAdapter(
  platform: Platform,
): Promise<UploadAdapter> {
  switch (platform) {
    case "youtube_shorts": {
      const youtube = UPLOAD_ADAPTER_REGISTRY["youtube"]!;
      return (await youtube.isAvailable()) ? youtube : local;
    }

    case "tiktok": {
      const tiktok = UPLOAD_ADAPTER_REGISTRY["tiktok"]!;
      return (await tiktok.isAvailable()) ? tiktok : local;
    }

    case "instagram_reels": {
      const instagram = UPLOAD_ADAPTER_REGISTRY["instagram"]!;
      return (await instagram.isAvailable()) ? instagram : local;
    }

    default:
      return local;
  }
}
