import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import {
  resolveConfig,
  type EngineConfig,
  type UserProfile,
} from "../../src/config/config-resolver.js";

function createRequest(overrides?: Partial<EngineRequest>): EngineRequest {
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
      ...overrides?.intent,
    },
    constraints: {
      language: "en",
      budget_tier: "low",
      quality_tier: "balanced",
      visual_consistency_required: true,
      content_policy_safe: true,
      ...overrides?.constraints,
    },
    style: {
      hook_type: "curiosity",
      pacing_profile: "fast_cut",
      caption_style: "tiktok_viral",
      camera_language: "simple_push_in",
      ...overrides?.style,
    },
    backend: {
      preferred_engine: "local",
      allow_fallback: true,
      ...overrides?.backend,
    },
    output: {
      type: "video_prompt",
      ...overrides?.output,
    },
    ...(overrides?.learning_history ? { learning_history: overrides.learning_history } : {}),
    ...(overrides?.novel_project ? { novel_project: overrides.novel_project } : {}),
  };
}

function createEngineConfig(): EngineConfig {
  return {
    tts: {
      provider: "openai",
      options: {
        openai: {
          api_key_env: "OPENAI_API_KEY",
          model: "tts-1-hd",
        },
      },
    },
    video_generation: {
      provider: "smart_router",
      defaults: {
        language: "ko",
        platform: "instagram_reels",
        caption_template: "brand_4thpath",
      },
      options: {
        smart_router: {
          fallback: "ffmpeg_slides",
          daily_cost_limit_usd: 0.5,
          prefer_free_first: true,
        },
        ffmpeg_slides: {
          fps: 30,
          resolution: "1080x1920",
        },
      },
    },
  };
}

test("resolveConfig prioritizes request values over profile and engine defaults", () => {
  const request = createRequest({
    constraints: {
      language: "ja",
      budget_tier: "high",
      quality_tier: "premium",
      visual_consistency_required: true,
      content_policy_safe: true,
    },
    intent: {
      platform: "tiktok",
      topic: "AI meeting note tool",
      subject: "young professional using laptop",
      goal: "make a short-form explainer clip",
      emotion: "curiosity and satisfaction",
      theme: "explainer",
      duration_sec: 20,
    },
    style: {
      hook_type: "curiosity",
      pacing_profile: "fast_cut",
      caption_style: "hormozi",
      camera_language: "simple_push_in",
    },
    backend: {
      preferred_engine: "local",
      allow_fallback: true,
    },
  });
  const userProfile: UserProfile = {
    budget: {
      daily_cost_limit_usd: 1.2,
      prefer_free_first: false,
    },
    defaults: {
      language: "ko",
      platform: "youtube_shorts",
      video_engine: "runway",
      caption_template: "brand_4thpath",
      tts_engine: "elevenlabs",
    },
    created_at: null,
  };

  const resolved = resolveConfig(request, userProfile, createEngineConfig());

  assert.equal(resolved.video_engine, "local");
  assert.equal(resolved.caption_template, "hormozi");
  assert.equal(resolved.language, "ja");
  assert.equal(resolved.platform, "tiktok");
  assert.equal(resolved.budget_tier, "high");
  assert.equal(resolved.quality_tier, "premium");
  assert.equal(resolved.tts_engine, "elevenlabs");
});

test("resolveConfig falls back to profile defaults when request has no corresponding engine preference", () => {
  const request = createRequest();
  const userProfile: UserProfile = {
    budget: {
      daily_cost_limit_usd: 0.8,
      prefer_free_first: true,
    },
    defaults: {
      language: "ko",
      platform: "instagram_reels",
      video_engine: "veo3",
      caption_template: "brand_4thpath",
      tts_engine: "google_cloud",
    },
    created_at: null,
  };

  const resolved = resolveConfig(request, userProfile, createEngineConfig());

  assert.equal(resolved.video_engine, "local");
  assert.equal(resolved.tts_engine, "google_cloud");
  assert.equal(resolved.daily_cost_limit_usd, 0.8);
  assert.equal(resolved.prefer_free_first, true);
});

test("resolveConfig falls back to engine smart-router defaults when profile budget settings are missing", () => {
  const request = createRequest();
  const userProfile: UserProfile = {
    defaults: {
      language: "ko",
      platform: "youtube_shorts",
    },
    created_at: null,
  };

  const resolved = resolveConfig(request, userProfile, createEngineConfig());

  assert.equal(resolved.daily_cost_limit_usd, 0.5);
  assert.equal(resolved.prefer_free_first, true);
  assert.equal(resolved.caption_template, "tiktok_viral");
  assert.equal(resolved.language, "en");
  assert.equal(resolved.platform, "youtube_shorts");
});
