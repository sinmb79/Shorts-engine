import { test } from "node:test";
import * as assert from "node:assert/strict";

import { buildPromptResult } from "../../src/prompt/build-prompt-result.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import { resolveNovelShortsPlan, applyNovelIntentOverrides } from "../../src/novel/resolve-novel-shorts-plan.js";
import { resolvePlatformOutputSpec } from "../../src/platform/resolve-platform-output-spec.js";
import { resolveMotionPlan } from "../../src/motion/resolve-motion-plan.js";
import { resolveBrollPlan } from "../../src/broll/resolve-broll-plan.js";
import { resolveLearningState } from "../../src/learning/resolve-learning-state.js";
import { scoreRequest } from "../../src/domain/score-request.js";
import { routeRequest } from "../../src/domain/route-request.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { runScoreGate } from "../../src/quality/score-gate.js";
import { resolveStyleResolution } from "../../src/style/style-engine.js";
import { weaveScenarioPlan } from "../../src/scenario/block-weaver.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("builds a structured prompt result for a standard request", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalizedRequest = normalizeRequest(request);
  const novelShortsPlan = resolveNovelShortsPlan(normalizedRequest);
  const effectiveRequest = applyNovelIntentOverrides(normalizedRequest, novelShortsPlan);
  const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
  const motionPlan = resolveMotionPlan(effectiveRequest, platformOutputSpec);
  const brollPlan = resolveBrollPlan(effectiveRequest, platformOutputSpec, motionPlan);
  const learningState = resolveLearningState(
    effectiveRequest,
    platformOutputSpec,
    motionPlan,
    brollPlan,
  );
  const scoring = scoreRequest(effectiveRequest);
  const routing = routeRequest(effectiveRequest, scoring);
  const styleResolution = resolveStyleResolution(request, null);
  const scenarioPlan = weaveScenarioPlan({
    effectiveRequest,
    platformOutputSpec,
    styleResolution,
    novelShortsPlan,
  });
  const qualityGate = runScoreGate({
    effectiveRequest,
    motionPlan,
    platformOutputSpec,
    scenarioPlan,
    styleResolution,
  });
  const promptResult = buildPromptResult({
    brollPlan,
    effectiveRequest,
    learningState,
    motionPlan,
    platformOutputSpec,
    qualityGate,
    routing,
    scenarioPlan,
    scoring,
    styleResolution,
    novelShortsPlan,
  });

  assert.equal(promptResult.schema_version, "0.1");
  assert.equal(promptResult.engine, "local");
  assert.equal(promptResult.params.aspect_ratio, "9:16");
  assert.equal(promptResult.params.duration_sec, 20);
  assert.match(promptResult.main_prompt, /AI meeting note tool/);
  assert.match(promptResult.main_prompt, /Scenario beat hook:/);
  assert.match(promptResult.main_prompt, /Hook motion: zoom_in/);
  assert.ok(promptResult.quality_score >= 0.75);
});

test("uses novel override theme and duration in prompt result", async () => {
  const request = await loadFixture<EngineRequest>("novel-cliffhanger-request.json");
  const normalizedRequest = normalizeRequest(request);
  const novelShortsPlan = resolveNovelShortsPlan(normalizedRequest);
  const effectiveRequest = applyNovelIntentOverrides(normalizedRequest, novelShortsPlan);
  const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
  const motionPlan = resolveMotionPlan(effectiveRequest, platformOutputSpec);
  const brollPlan = resolveBrollPlan(effectiveRequest, platformOutputSpec, motionPlan);
  const learningState = resolveLearningState(
    effectiveRequest,
    platformOutputSpec,
    motionPlan,
    brollPlan,
  );
  const scoring = scoreRequest(effectiveRequest);
  const routing = routeRequest(effectiveRequest, scoring);
  const styleResolution = resolveStyleResolution(request, null);
  const scenarioPlan = weaveScenarioPlan({
    effectiveRequest,
    platformOutputSpec,
    styleResolution,
    novelShortsPlan,
  });
  const qualityGate = runScoreGate({
    effectiveRequest,
    motionPlan,
    platformOutputSpec,
    scenarioPlan,
    styleResolution,
  });
  const promptResult = buildPromptResult({
    brollPlan,
    effectiveRequest,
    learningState,
    motionPlan,
    platformOutputSpec,
    qualityGate,
    routing,
    scenarioPlan,
    scoring,
    styleResolution,
    novelShortsPlan,
  });

  assert.equal(promptResult.schema_version, "0.1");
  assert.equal(promptResult.params.duration_sec, 25);
  assert.match(promptResult.style_descriptor, /cliffhanger/);
  assert.match(promptResult.main_prompt, /Novel highlight:/);
  assert.match(promptResult.main_prompt, /Scenario summary:/);
});
