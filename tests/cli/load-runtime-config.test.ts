import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { loadRuntimeConfig } from "../../src/cli/load-runtime-config.js";

function createRequest(): EngineRequest {
  return {
    version: "0.1",
    intent: {
      topic: "AI meeting note tool",
      subject: "young professional using laptop",
      goal: "make a short-form explainer clip",
      emotion: "curiosity and satisfaction",
      platform: "youtube_shorts",
      theme: "explainer",
      duration_sec: 20,
    },
    constraints: {
      language: "en",
      budget_tier: "low",
      quality_tier: "balanced",
      visual_consistency_required: true,
      content_policy_safe: true,
    },
    style: {
      hook_type: "curiosity",
      pacing_profile: "fast_cut",
      caption_style: "tiktok_viral",
      camera_language: "simple_push_in",
    },
    backend: {
      preferred_engine: "local",
      allow_fallback: true,
    },
    output: {
      type: "video_prompt",
    },
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeConfigSet(
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

test("loadRuntimeConfig selects the nearest ancestor config root", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-config-"));
  const projectRoot = path.join(tempDir, "project");
  const nestedRoot = path.join(projectRoot, "packages", "feature");
  const requestDir = path.join(nestedRoot, "requests");
  const requestPath = path.join(requestDir, "request.json");

  try {
    await writeConfigSet(projectRoot, {
      userProfile: {
        budget: {
          daily_cost_limit_usd: 0.25,
          prefer_free_first: true,
        },
      },
    });
    await writeConfigSet(nestedRoot, {
      userProfile: {
        budget: {
          daily_cost_limit_usd: 1.5,
          prefer_free_first: false,
        },
      },
    });
    await writeJson(requestPath, createRequest());

    const loaded = await loadRuntimeConfig(requestPath, createRequest());

    assert.equal(loaded.config_root, nestedRoot);
    assert.equal(loaded.resolved_config.daily_cost_limit_usd, 1.5);
    assert.equal(loaded.resolved_config.prefer_free_first, false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("loadRuntimeConfig throws a Korean error when a required config file is missing", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-config-"));
  const requestPath = path.join(tempDir, "requests", "request.json");

  try {
    await writeConfigSet(tempDir);
    await rm(path.join(tempDir, "config", "user-profile.json"), { force: true });
    await writeJson(requestPath, createRequest());

    await assert.rejects(
      () => loadRuntimeConfig(requestPath, createRequest()),
      /필수 설정 파일이 없습니다: config\/user-profile\.json/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("loadRuntimeConfig throws a Korean error when config JSON is invalid", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-config-"));
  const requestPath = path.join(tempDir, "requests", "request.json");

  try {
    await writeConfigSet(tempDir);
    await writeFile(
      path.join(tempDir, "config", "engine.json"),
      "{ invalid json\n",
      "utf8",
    );
    await writeJson(requestPath, createRequest());

    await assert.rejects(
      () => loadRuntimeConfig(requestPath, createRequest()),
      /설정 파일 JSON 형식이 올바르지 않습니다: config\/engine\.json/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("loadRuntimeConfig throws a Korean error when config shape is invalid", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-config-"));
  const requestPath = path.join(tempDir, "requests", "request.json");

  try {
    await writeConfigSet(tempDir, {
      promptStyles: {
        default: "invalid",
      },
    });
    await writeJson(requestPath, createRequest());

    await assert.rejects(
      () => loadRuntimeConfig(requestPath, createRequest()),
      /설정 파일 형식이 올바르지 않습니다: config\/prompt-styles\.json/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
