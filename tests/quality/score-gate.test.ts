import { test } from "node:test";
import * as assert from "node:assert/strict";

import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";
import type {
  EngineRequest,
  MotionPlan,
  NormalizedRequest,
  PlatformOutputSpec,
  ScenarioPlan,
  StyleResolution,
} from "../../src/domain/contracts.js";
import { runScoreGate } from "../../src/quality/score-gate.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("score gate passes a healthy planned scenario", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const planningContext = await resolvePlanningContext(request);

  assert.equal(planningContext.quality_gate.pass, true);
  assert.ok(planningContext.quality_gate.overall_score >= 75);
  assert.equal(planningContext.quality_gate.dimensions.length, 6);
});

test("score gate recommends retry for a weak scenario", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const planningContext = await resolvePlanningContext(request);
  const weakScenarioPlan: ScenarioPlan = {
    ...planningContext.scenario_plan,
    summary: "",
    blocks_used: ["generic_hook_question_frame"],
    scenes: [
      {
        scene_id: "scene_1",
        role: "hook",
        block_id: "generic_hook_question_frame",
        duration_sec: planningContext.effective_request.derived.resolved_duration_sec,
        scenario_text_ko: "",
        scenario_text_en: "",
        camera_cues: [],
        audio_cues: [],
        caption_text: "Hi",
        ai_prompt_fragment: "plain frame",
        tags: [],
      },
    ],
  };
  const weakMotionPlan: MotionPlan = {
    ...planningContext.motion_plan,
    motion_sequence: [
      {
        segment_id: "hook",
        motion: "zoom_in",
        duration_sec: planningContext.effective_request.derived.resolved_duration_sec,
        intensity: "low",
        reason_codes: [],
      },
    ],
  };
  const weakPlatformOutputSpec: PlatformOutputSpec = {
    ...planningContext.platform_output_spec,
    warnings: ["duration_clamped_to_platform_max"],
  };

  const result = runScoreGate({
    effectiveRequest: planningContext.effective_request,
    motionPlan: weakMotionPlan,
    platformOutputSpec: weakPlatformOutputSpec,
    scenarioPlan: weakScenarioPlan,
    styleResolution: planningContext.style_resolution,
  });

  assert.equal(result.pass, false);
  assert.ok(result.overall_score < result.threshold);
  assert.equal(result.retry_plan.recommended, true);
  assert.ok(result.retry_plan.focus_dimensions.length > 0);
});
