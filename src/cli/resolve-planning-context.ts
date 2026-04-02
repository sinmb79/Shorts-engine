import type {
  BrollPlan,
  EngineRequest,
  ExecutionPlan,
  LearningState,
  MotionPlan,
  NormalizedRequest,
  NovelShortsPlan,
  PlatformOutputSpec,
  QualityGateResult,
  RecoverySimulation,
  RoutingDecision,
  ScenarioPlan,
  ScoringResult,
  StyleResolution,
} from "../domain/contracts.js";
import { normalizeRequest } from "../domain/normalize-request.js";
import { routeRequest } from "../domain/route-request.js";
import { scoreRequest } from "../domain/score-request.js";
import { resolveLearningState } from "../learning/resolve-learning-state.js";
import { resolveMotionPlan } from "../motion/resolve-motion-plan.js";
import {
  applyNovelIntentOverrides,
  resolveNovelShortsPlan,
} from "../novel/resolve-novel-shorts-plan.js";
import { resolvePlatformOutputSpec } from "../platform/resolve-platform-output-spec.js";
import { buildExecutionPlan } from "../simulation/build-execution-plan.js";
import { simulateRecovery } from "../simulation/simulate-recovery.js";
import { resolveBrollPlan } from "../broll/resolve-broll-plan.js";
import { loadTasteProfile } from "../taste/profile-manager.js";
import type { TasteProfile } from "../taste-db/schema.js";
import { applyStyleResolution, resolveStyleResolution } from "../style/style-engine.js";
import { weaveScenarioPlan } from "../scenario/block-weaver.js";
import { runScoreGate } from "../quality/score-gate.js";
import { loadTrendContext } from "../trends/trend-radar.js";
import type { TrendContext } from "../trends/trend-radar.js";

export interface PlanningContext {
  normalized_request: NormalizedRequest;
  effective_request: NormalizedRequest;
  style_resolution: StyleResolution;
  trend_context: TrendContext | null;
  scenario_plan: ScenarioPlan;
  quality_gate: QualityGateResult;
  novel_shorts_plan: NovelShortsPlan | null;
  platform_output_spec: PlatformOutputSpec;
  motion_plan: MotionPlan;
  broll_plan: BrollPlan;
  learning_state: LearningState;
  scoring: ScoringResult;
  routing: RoutingDecision;
  execution_plan: ExecutionPlan;
  recovery_simulation: RecoverySimulation;
}

function shouldUseProvidedTasteProfile(options: {
  taste_profile?: TasteProfile | null;
}): boolean {
  return Object.prototype.hasOwnProperty.call(options, "taste_profile");
}

export async function resolvePlanningContext(
  request: EngineRequest,
  options: {
    env?: NodeJS.ProcessEnv;
    taste_profile?: TasteProfile | null;
    trend_aware?: boolean;
  } = {},
): Promise<PlanningContext> {
  const normalizedRequest = normalizeRequest(request);
  const tasteProfile = shouldUseProvidedTasteProfile(options)
    ? (options.taste_profile ?? null)
    : await loadTasteProfile(options.env);
  const styleResolution = resolveStyleResolution(normalizedRequest.base, tasteProfile);
  const styleAwareRequest = normalizeRequest(applyStyleResolution(request, styleResolution));
  const novelShortsPlan = resolveNovelShortsPlan(styleAwareRequest);
  const effectiveRequest = applyNovelIntentOverrides(styleAwareRequest, novelShortsPlan);
  const trendContext = await loadTrendContext({
    enabled: options.trend_aware ?? false,
    platform: effectiveRequest.base.intent.platform,
    topic: effectiveRequest.base.intent.topic,
    ...(options.env ? { env: options.env } : {}),
  });
  const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
  const scenarioPlan = weaveScenarioPlan({
    effectiveRequest,
    ...(options.env ? { env: options.env } : {}),
    platformOutputSpec,
    styleResolution,
    novelShortsPlan,
  });
  const motionPlan = resolveMotionPlan(effectiveRequest, platformOutputSpec, styleResolution);
  const brollPlan = resolveBrollPlan(
    effectiveRequest,
    platformOutputSpec,
    motionPlan,
    styleResolution,
  );
  const qualityGate = runScoreGate({
    effectiveRequest,
    motionPlan,
    platformOutputSpec,
    scenarioPlan,
    styleResolution,
  });
  const learningState = resolveLearningState(
    effectiveRequest,
    platformOutputSpec,
    motionPlan,
    brollPlan,
  );
  const scoring = scoreRequest(effectiveRequest);
  const routing = routeRequest(effectiveRequest, scoring);
  const executionPlan = buildExecutionPlan(effectiveRequest, routing);
  const recoverySimulation = simulateRecovery(executionPlan);

  return {
    normalized_request: normalizedRequest,
    effective_request: effectiveRequest,
    style_resolution: styleResolution,
    trend_context: trendContext,
    scenario_plan: scenarioPlan,
    quality_gate: qualityGate,
    novel_shorts_plan: novelShortsPlan,
    platform_output_spec: platformOutputSpec,
    motion_plan: motionPlan,
    broll_plan: brollPlan,
    learning_state: learningState,
    scoring,
    routing,
    execution_plan: executionPlan,
    recovery_simulation: recoverySimulation,
  };
}
