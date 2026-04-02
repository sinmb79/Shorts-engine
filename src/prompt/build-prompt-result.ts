import type {
  BrollPlan,
  LearningState,
  MotionPlan,
  NormalizedRequest,
  NovelShortsPlan,
  PlatformOutputSpec,
  PromptResult,
  QualityGateResult,
  RoutingDecision,
  ScenarioPlan,
  ScoringResult,
  StyleResolution,
} from "../domain/contracts.js";
import type { TrendContext } from "../trends/trend-radar.js";

export function buildPromptResult(input: {
  brollPlan: BrollPlan;
  effectiveRequest: NormalizedRequest;
  learningState: LearningState;
  motionPlan: MotionPlan;
  platformOutputSpec: PlatformOutputSpec;
  qualityGate: QualityGateResult;
  routing: RoutingDecision;
  scenarioPlan: ScenarioPlan;
  scoring: ScoringResult;
  styleResolution: StyleResolution;
  novelShortsPlan: NovelShortsPlan | null;
  trendContext?: TrendContext | null;
}): PromptResult {
  const {
    brollPlan,
    effectiveRequest,
    learningState,
    motionPlan,
    novelShortsPlan,
    platformOutputSpec,
    qualityGate,
    routing,
    scenarioPlan,
    scoring,
    styleResolution,
    trendContext,
  } = input;
  const warnings = [
    ...platformOutputSpec.warnings,
    ...motionPlan.warnings,
    ...brollPlan.warnings,
    ...qualityGate.warnings,
    ...(trendContext?.warnings ?? []),
    ...(learningState.confidence === "low" ? ["low_learning_confidence_uses_priors"] : []),
  ];

  return {
    schema_version: "0.1",
    engine: routing.selected_backend,
    main_prompt: buildMainPrompt(
      effectiveRequest,
      platformOutputSpec,
      motionPlan,
      brollPlan,
      scenarioPlan,
      styleResolution,
      novelShortsPlan,
      trendContext ?? null,
    ),
    negative_prompt: "unsafe, graphic, policy-violating content",
    style_descriptor: [
      `${effectiveRequest.base.style.pacing_profile} pacing`,
      `${effectiveRequest.base.style.camera_language} camera`,
      `${effectiveRequest.base.intent.theme} tone`,
    ].join("; "),
    warnings,
    params: {
      aspect_ratio: platformOutputSpec.aspect_ratio,
      duration_sec: platformOutputSpec.effective_duration_sec,
    },
    quality_score: roundScore(
      qualityGate.overall_score / 100,
    ),
  };
}

function buildMainPrompt(
  effectiveRequest: NormalizedRequest,
  platformOutputSpec: PlatformOutputSpec,
  motionPlan: MotionPlan,
  brollPlan: BrollPlan,
  scenarioPlan: ScenarioPlan,
  styleResolution: StyleResolution,
  novelShortsPlan: NovelShortsPlan | null,
  trendContext: TrendContext | null,
): string {
  const sections = [
    `Scene: ${effectiveRequest.base.intent.topic}.`,
    `Subject: ${effectiveRequest.base.intent.subject}.`,
    `Goal: ${effectiveRequest.base.intent.goal}.`,
    `Emotion: ${effectiveRequest.base.intent.emotion}.`,
    `Theme: ${effectiveRequest.base.intent.theme}.`,
    `Platform: ${platformOutputSpec.platform}.`,
    `Hook motion: ${motionPlan.hook_motion.selected}.`,
    `Hook B-roll concept: ${brollPlan.segments[0]?.concept ?? "n/a"}.`,
    `Scenario structure: ${scenarioPlan.structure}.`,
    `Scenario summary: ${scenarioPlan.summary}.`,
  ];

  if (styleResolution.source === "taste_profile") {
    const topDirector = Object.entries(styleResolution.director_matches)[0]?.[0];
    const topWriter = Object.entries(styleResolution.writer_matches)[0]?.[0];
    sections.push(`Style source: taste profile ${styleResolution.taste_profile_id}.`);
    sections.push(`Resolved camera language: ${styleResolution.resolved_style.camera_language}.`);
    sections.push(`Resolved pacing: ${styleResolution.resolved_style.pacing_profile}.`);
    sections.push(`Color palette: ${styleResolution.color_palette.join(", ")}.`);
    sections.push(`Mood: ${styleResolution.mood ?? "n/a"}.`);
    if (topDirector) {
      sections.push(`Director anchor: ${topDirector}.`);
    }
    if (topWriter) {
      sections.push(`Writer anchor: ${topWriter}.`);
    }
    if (styleResolution.concept_keywords.length > 0) {
      sections.push(`Visual concepts: ${styleResolution.concept_keywords.join(", ")}.`);
    }
  }

  if (novelShortsPlan) {
    sections.push(`Novel highlight: ${novelShortsPlan.highlight_candidate}.`);
  }

  if (trendContext?.keywords.length) {
    sections.push(`Trend keywords: ${trendContext.keywords.join(", ")}.`);
  }

  if (trendContext?.hashtags.length) {
    sections.push(`Trend hashtags: ${trendContext.hashtags.join(", ")}.`);
  }

  for (const scene of scenarioPlan.scenes) {
    sections.push(`Scenario beat ${scene.role}: ${scene.scenario_text_en}.`);
    sections.push(`Scene prompt ${scene.role}: ${scene.ai_prompt_fragment}.`);
  }

  return sections.join(" ");
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
