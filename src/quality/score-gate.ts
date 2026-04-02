import type {
  MotionPlan,
  NormalizedRequest,
  PlatformOutputSpec,
  QualityDimensionId,
  QualityDimensionScore,
  QualityGateResult,
  ScenarioPlan,
  StyleResolution,
} from "../domain/contracts.js";

const QUALITY_GATE_THRESHOLD = 75;

const QUALITY_DIMENSION_LABELS: Record<QualityDimensionId, string> = {
  hook_strength: "Hook Strength",
  rhythm_match: "Rhythm Match",
  style_fidelity: "Style Fidelity",
  platform_fit: "Platform Fit",
  narrative_arc: "Narrative Arc",
  prompt_quality: "Prompt Quality",
};

const QUALITY_DIMENSION_WEIGHTS: Record<QualityDimensionId, number> = {
  hook_strength: 25,
  rhythm_match: 20,
  style_fidelity: 20,
  platform_fit: 15,
  narrative_arc: 10,
  prompt_quality: 10,
};

export function runScoreGate(input: {
  effectiveRequest: NormalizedRequest;
  motionPlan: MotionPlan;
  platformOutputSpec: PlatformOutputSpec;
  scenarioPlan: ScenarioPlan;
  styleResolution: StyleResolution;
}): QualityGateResult {
  const { effectiveRequest, motionPlan, platformOutputSpec, scenarioPlan, styleResolution } = input;
  const dimensions: QualityDimensionScore[] = [
    scoreHookStrength(scenarioPlan, motionPlan),
    scoreRhythmMatch(effectiveRequest, scenarioPlan, motionPlan),
    scoreStyleFidelity(effectiveRequest, scenarioPlan, styleResolution),
    scorePlatformFit(platformOutputSpec, scenarioPlan),
    scoreNarrativeArc(scenarioPlan),
    scorePromptQuality(scenarioPlan),
  ];
  const overallScore = roundScore(
    dimensions.reduce((sum, dimension) => {
      return sum + dimension.score * (dimension.weight / 100);
    }, 0),
  );
  const weakestDimensions = [...dimensions]
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((dimension) => dimension.dimension);
  const warnings = dimensions
    .filter((dimension) => !dimension.pass)
    .map((dimension) => `${dimension.dimension}_below_target`);

  return {
    schema_version: "0.2.0",
    overall_score: overallScore,
    threshold: QUALITY_GATE_THRESHOLD,
    pass: overallScore >= QUALITY_GATE_THRESHOLD,
    dimensions,
    warnings,
    retry_plan: {
      recommended: overallScore < QUALITY_GATE_THRESHOLD,
      max_attempts: 3,
      focus_dimensions: overallScore < QUALITY_GATE_THRESHOLD ? weakestDimensions : [],
    },
  };
}

function scoreHookStrength(
  scenarioPlan: ScenarioPlan,
  motionPlan: MotionPlan,
): QualityDimensionScore {
  const hookScene = scenarioPlan.scenes.find((scene) => scene.role === "hook");
  let score = 0;
  const reasonCodes: string[] = [];

  if (scenarioPlan.hook_decision.hook_type.trim().length > 0) {
    score += 20;
    reasonCodes.push("hook_type_present");
  }

  const hookCameraCueCount = hookScene?.camera_cues.length ?? 0;
  if (hookCameraCueCount >= 3) {
    score += 20;
    reasonCodes.push("hook_camera_cues_rich");
  } else if (hookCameraCueCount >= 2) {
    score += 14;
    reasonCodes.push("hook_camera_cues_present");
  } else if (hookCameraCueCount >= 1) {
    score += 8;
  }

  const hookCaptionLength = hookScene?.caption_text.trim().length ?? 0;
  if (hookCaptionLength >= 20 && hookCaptionLength <= 90) {
    score += 20;
    reasonCodes.push("hook_caption_specific");
  } else if (hookCaptionLength > 0) {
    score += 10;
  }

  const hookDuration = hookScene?.duration_sec ?? 0;
  if (hookDuration >= 2 && hookDuration <= 5) {
    score += 15;
    reasonCodes.push("hook_duration_in_target_window");
  } else if (hookDuration > 0) {
    score += 8;
  }

  const promptTokenCount = countTokens(hookScene?.ai_prompt_fragment ?? "");
  if (promptTokenCount >= 6) {
    score += 10;
    reasonCodes.push("hook_prompt_specific");
  } else if (promptTokenCount >= 3) {
    score += 5;
  }

  if (motionPlan.hook_motion.required) {
    score += 15;
    reasonCodes.push("hook_motion_required");
  }

  return buildDimension("hook_strength", score, reasonCodes);
}

function scoreRhythmMatch(
  effectiveRequest: NormalizedRequest,
  scenarioPlan: ScenarioPlan,
  motionPlan: MotionPlan,
): QualityDimensionScore {
  const durations = scenarioPlan.scenes.map((scene) => scene.duration_sec);
  const totalDuration = effectiveRequest.derived.resolved_duration_sec;
  const longestScene = durations.length > 0 ? Math.max(...durations) : totalDuration;
  const uniqueMotions = new Set(motionPlan.motion_sequence.map((segment) => segment.motion)).size;
  let score = 0;
  const reasonCodes: string[] = [];

  if (matchesPacingWindow(effectiveRequest.base.style.pacing_profile, durations, totalDuration)) {
    score += 35;
    reasonCodes.push("scene_durations_match_pacing");
  } else {
    score += 15;
  }

  if (motionPlan.motion_sequence.length >= 4) {
    score += 20;
    reasonCodes.push("full_motion_coverage");
  }

  if (uniqueMotions >= 3) {
    score += 15;
    reasonCodes.push("motion_variety_present");
  } else if (uniqueMotions >= 2) {
    score += 8;
  }

  if (longestScene / Math.max(1, totalDuration) <= 0.42) {
    score += 20;
    reasonCodes.push("no_dead_spot_detected");
  }

  if (motionPlan.hook_motion.required) {
    score += 10;
    reasonCodes.push("hook_motion_supports_rhythm");
  }

  return buildDimension("rhythm_match", score, reasonCodes);
}

function scoreStyleFidelity(
  effectiveRequest: NormalizedRequest,
  scenarioPlan: ScenarioPlan,
  styleResolution: StyleResolution,
): QualityDimensionScore {
  let score = styleResolution.source === "taste_profile" ? 35 : 45;
  const reasonCodes: string[] = [];
  const topDirector = Object.entries(styleResolution.director_matches)[0]?.[0] ?? null;
  const topWriter = Object.entries(styleResolution.writer_matches)[0]?.[0] ?? null;
  const tagOverlap = countOverlap(
    scenarioPlan.scenes.flatMap((scene) => scene.tags),
    styleResolution.concept_keywords,
  );

  if (styleResolution.source === "taste_profile") {
    if (scenarioPlan.director_anchor === topDirector && topDirector) {
      score += 20;
      reasonCodes.push("top_director_anchor_applied");
    }

    if (scenarioPlan.writer_anchor === topWriter && topWriter) {
      score += 12;
      reasonCodes.push("top_writer_anchor_applied");
    }
  } else if (scenarioPlan.director_anchor === null) {
    score += 10;
    reasonCodes.push("request_only_generic_alignment");
  }

  if (cameraLanguageMatchesCues(
    styleResolution.resolved_style.camera_language,
    scenarioPlan.scenes.flatMap((scene) => scene.camera_cues),
  )) {
    score += 18;
    reasonCodes.push("camera_language_reflected");
  }

  if (matchesHookIntent(styleResolution.resolved_style.hook_type, scenarioPlan.hook_decision.hook_type)) {
    score += 10;
    reasonCodes.push("hook_intent_preserved");
  }

  if (tagOverlap >= 2 || styleResolution.concept_keywords.length === 0) {
    score += 10;
    reasonCodes.push("concept_keywords_reflected");
  } else if (tagOverlap === 1) {
    score += 5;
  }

  if (
    effectiveRequest.base.style.pacing_profile === styleResolution.resolved_style.pacing_profile ||
    styleResolution.source === "taste_profile"
  ) {
    score += 5;
  }

  return buildDimension("style_fidelity", score, reasonCodes);
}

function scorePlatformFit(
  platformOutputSpec: PlatformOutputSpec,
  scenarioPlan: ScenarioPlan,
): QualityDimensionScore {
  let score = 65;
  const reasonCodes: string[] = [];
  const warnings = platformOutputSpec.warnings.length;

  if (platformOutputSpec.aspect_ratio === "9:16") {
    score += 10;
    reasonCodes.push("vertical_format_compliant");
  }

  if (
    platformOutputSpec.effective_duration_sec >= platformOutputSpec.min_duration_sec &&
    platformOutputSpec.effective_duration_sec <= platformOutputSpec.max_duration_sec
  ) {
    score += 10;
    reasonCodes.push("duration_in_platform_window");
  }

  if (warnings === 0) {
    score += 15;
    reasonCodes.push("no_platform_warnings");
  } else {
    score -= warnings * 8;
  }

  if (scenarioPlan.scenes.length === 4) {
    score += 5;
  }

  return buildDimension("platform_fit", score, reasonCodes);
}

function scoreNarrativeArc(scenarioPlan: ScenarioPlan): QualityDimensionScore {
  const roles = new Set(scenarioPlan.scenes.map((scene) => scene.role));
  let score = 0;
  const reasonCodes: string[] = [];

  for (const role of ["hook", "development", "twist", "closer"] as const) {
    if (roles.has(role)) {
      score += 20;
    }
  }

  if (scenarioPlan.summary.trim().length > 0) {
    score += 10;
    reasonCodes.push("summary_present");
  }

  if (new Set(scenarioPlan.blocks_used).size === scenarioPlan.blocks_used.length) {
    score += 10;
    reasonCodes.push("distinct_story_blocks");
  }

  return buildDimension("narrative_arc", score, reasonCodes);
}

function scorePromptQuality(scenarioPlan: ScenarioPlan): QualityDimensionScore {
  const sceneScores = scenarioPlan.scenes.map((scene) => {
    let sceneScore = 0;
    const promptTokens = countTokens(scene.ai_prompt_fragment);

    if (promptTokens >= 6) {
      sceneScore += 45;
    } else if (promptTokens >= 4) {
      sceneScore += 30;
    } else if (promptTokens > 0) {
      sceneScore += 18;
    }

    if (scene.ai_prompt_fragment.includes(",")) {
      sceneScore += 20;
    }

    if (containsVisualDescriptor(scene.ai_prompt_fragment)) {
      sceneScore += 20;
    }

    if (scene.camera_cues.length >= 2) {
      sceneScore += 15;
    }

    return Math.min(100, sceneScore);
  });
  const averageSceneScore =
    sceneScores.length === 0
      ? 0
      : sceneScores.reduce((sum, score) => sum + score, 0) / sceneScores.length;
  const reasonCodes = averageSceneScore >= 80
    ? ["scene_prompts_specific"]
    : averageSceneScore >= 65
      ? ["scene_prompts_usable"]
      : [];

  return buildDimension("prompt_quality", averageSceneScore, reasonCodes);
}

function buildDimension(
  dimension: QualityDimensionId,
  score: number,
  reasonCodes: string[],
): QualityDimensionScore {
  const rounded = roundScore(score);

  return {
    dimension,
    label: QUALITY_DIMENSION_LABELS[dimension],
    weight: QUALITY_DIMENSION_WEIGHTS[dimension],
    score: rounded,
    pass: rounded >= 70,
    reason_codes: reasonCodes,
  };
}

function matchesPacingWindow(
  pacingProfile: string,
  durations: number[],
  totalDuration: number,
): boolean {
  if (durations.length === 0) {
    return false;
  }

  const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const longestShare = Math.max(...durations) / Math.max(1, totalDuration);

  if (pacingProfile === "fast_cut") {
    return average <= 5.5 && longestShare <= 0.35;
  }

  if (pacingProfile === "slow_burn") {
    return average >= 4 && longestShare <= 0.5;
  }

  return average >= 4 && average <= 7 && longestShare <= 0.42;
}

function matchesHookIntent(resolvedHookType: string, scenarioHookType: string): boolean {
  if (resolvedHookType === scenarioHookType) {
    return true;
  }

  const relatedPairs = new Set([
    "curiosity:mystery_question",
    "question:mystery_question",
    "surprise:pattern_interrupt",
    "shock:tone_bait_switch",
  ]);

  return relatedPairs.has(`${resolvedHookType}:${scenarioHookType}`);
}

function cameraLanguageMatchesCues(cameraLanguage: string, cameraCues: string[]): boolean {
  const haystack = cameraCues.join(" ").toLowerCase();

  if (cameraLanguage.includes("symmetry")) {
    return /center|symmetr|tableau/.test(haystack);
  }

  if (cameraLanguage.includes("kinetic")) {
    return /whip|snap|kinetic/.test(haystack);
  }

  if (cameraLanguage.includes("push")) {
    return /push/.test(haystack);
  }

  if (cameraLanguage.includes("tracking") || cameraLanguage.includes("track")) {
    return /track/.test(haystack);
  }

  return cameraCues.length > 0;
}

function containsVisualDescriptor(value: string): boolean {
  return /(cinematic|contrast|tableau|editorial|kinetic|pastel|clean|stylish|balanced|modern|storybook)/i.test(
    value,
  );
}

function countTokens(value: string): number {
  return value
    .trim()
    .split(/[^a-z0-9_]+/i)
    .filter(Boolean).length;
}

function countOverlap(left: string[], right: string[]): number {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));

  return [...new Set(left.map((value) => value.toLowerCase()))].filter((value) => {
    return rightSet.has(value);
  }).length;
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}
