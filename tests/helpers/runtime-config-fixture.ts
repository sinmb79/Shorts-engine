import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeRuntimeConfigSet(
  rootDir: string,
  overrides?: {
    engine?: Record<string, unknown>;
    shorts?: Record<string, unknown>;
    promptStyles?: Record<string, unknown>;
    userProfile?: Record<string, unknown>;
  },
): Promise<void> {
  await writeJson(path.join(rootDir, "config", "engine.json"), {
    tts: {
      provider: "openai",
      options: {
        openai: {
          api_key_env: "OPENAI_API_KEY",
        },
      },
    },
    video_generation: {
      provider: "smart_router",
      defaults: {
        language: "ko",
        platform: "youtube_shorts",
        caption_template: "tiktok_viral",
      },
      options: {
        smart_router: {
          daily_cost_limit_usd: 0.5,
          prefer_free_first: true,
          fallback: "ffmpeg_slides",
        },
        ffmpeg_slides: {
          resolution: "1080x1920",
          fps: 30,
        },
      },
    },
    ...overrides?.engine,
  });

  await writeJson(path.join(rootDir, "config", "shorts-config.json"), {
    enabled: true,
    schedule: {
      frequency: "daily",
      times: ["10:30"],
      max_per_day: 1,
    },
    input_dirs: {
      images: "input/images/",
      videos: "input/videos/",
      scripts: "input/scripts/",
      audio: "input/audio/",
    },
    assets: {
      characters: {},
      corner_character_map: {},
      character_overlay: {
        enabled: true,
      },
    },
    ...overrides?.shorts,
  });

  await writeJson(path.join(rootDir, "config", "prompt-styles.json"), {
    corners: {
      default_corner: {
        caption_template: "tiktok_viral",
        color_palette: ["#FFFFFF", "#000000"],
        video_style: "clean professional",
        motion_preference: ["ken_burns_in"],
        tone: "neutral",
      },
    },
    default: {
      caption_template: "tiktok_viral",
      color_palette: ["#FFFFFF", "#000000"],
      video_style: "clean professional",
      motion_preference: ["ken_burns_in"],
      tone: "neutral",
    },
    ...overrides?.promptStyles,
  });

  await writeJson(path.join(rootDir, "config", "user-profile.json"), {
    budget: {
      daily_cost_limit_usd: 0.75,
      prefer_free_first: false,
    },
    defaults: {
      language: "ko",
      platform: "instagram_reels",
      tts_engine: "elevenlabs",
    },
    created_at: null,
    ...overrides?.userProfile,
  });
}
