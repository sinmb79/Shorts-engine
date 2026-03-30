import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { MicroSignals } from "../domain/contracts.js";

const CAPTION_STYLE_BASE: Record<string, number> = {
  hormozi: 0.9,
  tiktok_viral: 0.86,
  brand_4thpath: 0.88,
  dramatic_subtitles: 0.74,
};

const STRONG_HOOK_MOTIONS = new Set(["zoom_in", "parallax", "glitch_transition"]);

export function scoreMicroSignals(plan: PlanningContext): MicroSignals {
  const durations = plan.motion_plan.motion_sequence.map((assignment) => assignment.duration_sec);
  const durationAverage = average(durations);
  const recommendedDuration = plan.platform_output_spec.recommended_duration_sec;
  const effectiveDuration = plan.platform_output_spec.effective_duration_sec;
  const durationDelta = Math.abs(effectiveDuration - recommendedDuration) / Math.max(1, recommendedDuration);
  const consecutiveDuplicates = countConsecutiveDuplicates(
    plan.motion_plan.motion_sequence.map((assignment) => assignment.motion),
  );
  const uniqueMotionRatio =
    plan.motion_plan.motion_sequence.length === 0
      ? 0
      : new Set(plan.motion_plan.motion_sequence.map((assignment) => assignment.motion)).size /
        plan.motion_plan.motion_sequence.length;
  const durationDeviation =
    durationAverage === 0
      ? 1
      : average(durations.map((duration) => Math.abs(duration - durationAverage))) / durationAverage;

  return {
    hook_strength: roundScore(
      resolveHookStrength(plan) - plan.motion_plan.warnings.length * 0.03,
    ),
    pacing_consistency: roundScore(
      1 - durationDeviation * 0.8 - plan.platform_output_spec.warnings.length * 0.04,
    ),
    motion_variation: roundScore(
      uniqueMotionRatio * 0.7 +
        (1 - consecutiveDuplicates / Math.max(1, plan.motion_plan.motion_sequence.length - 1)) * 0.3,
    ),
    caption_readability: roundScore(
      (CAPTION_STYLE_BASE[plan.effective_request.base.style.caption_style] ?? 0.72) -
        plan.platform_output_spec.warnings.length * 0.04,
    ),
    audio_text_sync: roundScore(
      0.78 -
        Math.abs(durationAverage - 5) * 0.06 +
        (plan.effective_request.base.style.pacing_profile === "fast_cut" ? 0.05 : 0),
    ),
    platform_fit: roundScore(
      0.95 - durationDelta * 0.5 - plan.platform_output_spec.warnings.length * 0.04,
    ),
  };
}

export function aggregateScore(signals: MicroSignals): number {
  return roundScore(
    average([
      signals.hook_strength,
      signals.pacing_consistency,
      signals.motion_variation,
      signals.caption_readability,
      signals.audio_text_sync,
      signals.platform_fit,
    ]),
  );
}

function resolveHookStrength(plan: PlanningContext): number {
  const hookType = plan.effective_request.base.style.hook_type.toLowerCase();
  const base =
    hookType.includes("shock") ? 0.86
      : hookType.includes("question") ? 0.82
      : hookType.includes("curiosity") ? 0.78
      : hookType.includes("stat") ? 0.76
      : hookType.includes("visual") ? 0.72
      : 0.58;
  const motionBonus = STRONG_HOOK_MOTIONS.has(plan.motion_plan.hook_motion.selected) ? 0.08 : 0.03;

  return base + motionBonus;
}

function countConsecutiveDuplicates(values: string[]): number {
  let duplicates = 0;

  for (let index = 1; index < values.length; index += 1) {
    if (values[index] === values[index - 1]) {
      duplicates += 1;
    }
  }

  return duplicates;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
