import type {
  BrollPlan,
  LearningState,
  MotionPlan,
  NormalizedRequest,
  NovelShortsPlan,
  PlatformOutputSpec,
  PromptResult,
  RoutingDecision,
  ScoringResult,
} from "../domain/contracts.js";
import type { ResolvedConfig } from "../config/config-resolver.js";
import { composeSearchQuery } from "./search-query-composer.js";
import { composeVideoPrompt } from "./video-prompt-composer.js";
import { translateToVisual } from "./visual-vocabulary.js";

export function buildPromptResult(input: {
  brollPlan: BrollPlan;
  effectiveRequest: NormalizedRequest;
  learningState: LearningState;
  motionPlan: MotionPlan;
  platformOutputSpec: PlatformOutputSpec;
  resolvedConfig: ResolvedConfig;
  routing: RoutingDecision;
  scoring: ScoringResult;
  novelShortsPlan: NovelShortsPlan | null;
}): PromptResult {
  const {
    brollPlan,
    effectiveRequest,
    learningState,
    motionPlan,
    novelShortsPlan,
    platformOutputSpec,
    resolvedConfig,
    routing,
    scoring,
  } = input;
  const warnings = [
    ...platformOutputSpec.warnings,
    ...motionPlan.warnings,
    ...brollPlan.warnings,
    ...(learningState.confidence === "low" ? ["low_learning_confidence_uses_priors"] : []),
  ];
  const promptEngine = resolvePromptEngine(resolvedConfig, routing);
  const searchPrompt = composeSearchQuery({
    sentence: buildIntentSentence(effectiveRequest, novelShortsPlan),
    engine: "stock_search",
    count: 3,
    source_language: resolvedConfig.language,
  });
  const composedPrompt = composeVideoPrompt(
    effectiveRequest.base.intent,
    promptEngine,
    translateToVisual,
    {
      corner: effectiveRequest.base.intent.theme,
      motion_hint: motionPlan.hook_motion.selected,
      source_language: resolvedConfig.language,
      ...(searchPrompt.metadata.search_queries
        ? { search_queries: searchPrompt.metadata.search_queries }
        : {}),
      style_overrides: {
        caption_style: effectiveRequest.base.style.caption_style,
        camera_language: effectiveRequest.base.style.camera_language,
        hook_broll: brollPlan.segments[0]?.concept ?? "n/a",
        hook_motion: motionPlan.hook_motion.selected,
        platform: platformOutputSpec.platform,
        ...(novelShortsPlan
          ? { novel_highlight: novelShortsPlan.highlight_candidate }
          : {}),
      },
    },
  );

  return {
    schema_version: "0.1",
    engine: routing.selected_backend,
    main_prompt: composedPrompt.visual_description,
    negative_prompt: composedPrompt.negative_prompt,
    style_descriptor: [
      `${effectiveRequest.base.style.pacing_profile} pacing`,
      `${effectiveRequest.base.style.camera_language} camera`,
      `${effectiveRequest.base.intent.theme} tone`,
      `${composedPrompt.engine_format} format`,
    ].join("; "),
    warnings,
    params: {
      aspect_ratio: platformOutputSpec.aspect_ratio,
      duration_sec: platformOutputSpec.effective_duration_sec,
    },
    quality_score: roundScore(
      (scoring.candidate_score + scoring.quality_tier_score) / 2,
    ),
  };
}

function buildIntentSentence(
  effectiveRequest: NormalizedRequest,
  novelShortsPlan: NovelShortsPlan | null,
): string {
  const sections = [
    effectiveRequest.base.intent.topic,
    effectiveRequest.base.intent.subject,
    effectiveRequest.base.intent.goal,
    effectiveRequest.base.intent.emotion,
    effectiveRequest.base.intent.theme,
  ];

  if (novelShortsPlan) {
    sections.push(novelShortsPlan.highlight_candidate);
  }

  return sections.join(" ");
}

function resolvePromptEngine(
  resolvedConfig: ResolvedConfig,
  routing: RoutingDecision,
): string {
  const selectedEngineReason = routing.reason_codes.find((reasonCode) =>
    reasonCode.startsWith("video_engine_selected:"),
  );

  if (selectedEngineReason) {
    return selectedEngineReason.slice("video_engine_selected:".length);
  }

  if (
    routing.selected_backend === "local" ||
    routing.selected_backend === "gpu" ||
    resolvedConfig.video_engine === "local"
  ) {
    return "ffmpeg_slides";
  }

  return resolvedConfig.video_engine;
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
