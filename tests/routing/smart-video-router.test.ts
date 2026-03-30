import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { SmartVideoRouter } from "../../src/routing/smart-video-router.js";
import { createResolvedConfig } from "../helpers/resolved-config.js";

function createRequest(
  overrides?: Partial<EngineRequest>,
): EngineRequest {
  return {
    version: "0.1",
    intent: {
      topic: "AI launch trailer",
      subject: "mobile app showcase",
      goal: "make a short-form promo clip",
      emotion: "excitement",
      platform: "youtube_shorts",
      theme: "product_launch",
      duration_sec: 20,
      ...overrides?.intent,
    },
    constraints: {
      language: "ko",
      budget_tier: "high",
      quality_tier: "premium",
      visual_consistency_required: true,
      content_policy_safe: true,
      ...overrides?.constraints,
    },
    style: {
      hook_type: "shock",
      pacing_profile: "fast_cut",
      caption_style: "tiktok_viral",
      camera_language: "simple_push_in",
      ...overrides?.style,
    },
    backend: {
      preferred_engine: "premium",
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

test("selectEngine prefers kling_free when free tier remains", () => {
  const router = new SmartVideoRouter();
  const request = createRequest();
  const selected = router.selectEngine(
    request,
    createResolvedConfig({
      video_engine: "veo3",
      prefer_free_first: true,
      daily_cost_limit_usd: 0.5,
    }),
    0,
  );

  assert.equal(selected, "kling_free");
});

test("selectEngine falls back to ffmpeg_slides when daily limit is exceeded", () => {
  const router = new SmartVideoRouter();
  const request = createRequest({
    intent: {
      topic: "AI launch trailer",
      subject: "mobile app showcase",
      goal: "make a short-form promo clip",
      emotion: "excitement",
      platform: "youtube_shorts",
      theme: "product_launch",
      duration_sec: 30,
    },
  });
  const selected = router.selectEngine(
    request,
    createResolvedConfig({
      video_engine: "veo3",
      prefer_free_first: false,
      daily_cost_limit_usd: 0.2,
    }),
    0.2,
  );

  assert.equal(selected, "ffmpeg_slides");
});

test("onFailure returns the next engine in priority order", () => {
  const router = new SmartVideoRouter();

  assert.equal(router.onFailure("kling_free"), "veo3");
  assert.equal(router.onFailure("veo3"), "seedance2");
  assert.equal(router.onFailure("seedance2"), "runway");
  assert.equal(router.onFailure("runway"), "ffmpeg_slides");
});
