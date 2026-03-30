import { test } from "node:test";
import * as assert from "node:assert/strict";

import { composeVideoPrompt } from "../../src/prompt/video-prompt-composer.js";
import { translateToVisual } from "../../src/prompt/visual-vocabulary.js";

const intent = {
  topic: "서울 골목의 비 내리는 밤",
  subject: "우산 없이 걷는 직장인",
  goal: "짧고 몰입감 있는 도시 감성 영상을 만든다",
  emotion: "긴장감과 몰입",
  platform: "youtube_shorts",
  theme: "cinematic",
  duration_sec: 20,
} as const;

test("composeVideoPrompt formats the same intent differently for Kling, Veo, Seedance, and FFmpeg", () => {
  const kling = composeVideoPrompt(intent, "kling_free", translateToVisual, {
    corner: "technology",
    motion_hint: "smooth push in",
  });
  const veo = composeVideoPrompt(intent, "veo3", translateToVisual, {
    corner: "technology",
    motion_hint: "smooth push in",
  });
  const seedance = composeVideoPrompt(intent, "seedance2", translateToVisual, {
    corner: "technology",
    motion_hint: "smooth push in",
  });
  const ffmpeg = composeVideoPrompt(intent, "ffmpeg_slides", translateToVisual, {
    corner: "technology",
    motion_hint: "smooth push in",
  });

  assert.equal(kling.engine_format, "kling_free");
  assert.match(kling.visual_description, /Camera: smooth movement/);
  assert.match(kling.negative_prompt, /text overlay/);

  assert.equal(veo.engine_format, "veo3");
  assert.match(veo.visual_description, /Subject:/);
  assert.match(veo.visual_description, /Audio:/);

  assert.equal(seedance.engine_format, "seedance2");
  assert.match(seedance.visual_description, /vertical 9:16/);
  assert.doesNotMatch(seedance.visual_description, /Subject:/);

  assert.equal(ffmpeg.engine_format, "ffmpeg_slides");
  assert.match(ffmpeg.visual_description, /FFmpeg slide plan/);
  assert.match(ffmpeg.visual_description, /slide_1=/);

  assert.notEqual(kling.visual_description, veo.visual_description);
  assert.notEqual(veo.visual_description, seedance.visual_description);
  assert.notEqual(seedance.visual_description, ffmpeg.visual_description);
});
