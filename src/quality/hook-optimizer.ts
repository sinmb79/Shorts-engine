import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { HookAnalysis } from "../domain/contracts.js";

const STRONG_HOOK_MOTIONS = new Set(["zoom_in", "parallax", "glitch_transition"]);

export function analyzeHook(plan: PlanningContext): HookAnalysis {
  const hookType = resolveHookType(plan);
  const optimalDurationSec =
    plan.platform_output_spec.platform === "tiktok" ? 2.5 : 3;
  const hookMotion = plan.motion_plan.hook_motion.selected;
  const baseScore =
    hookType === "question" ? 0.84
      : hookType === "shock" ? 0.8
      : hookType === "curiosity" ? 0.76
      : hookType === "stat" ? 0.72
      : hookType === "visual" ? 0.68
      : 0.54;
  const hookDuration = plan.motion_plan.segments[0]?.duration_sec ?? optimalDurationSec;
  const score = roundScore(
    baseScore +
      (STRONG_HOOK_MOTIONS.has(hookMotion) ? 0.08 : 0.02) -
      Math.max(0, hookDuration - optimalDurationSec) * 0.03,
  );

  return {
    type: hookType,
    score,
    suggestions: buildSuggestions(plan, hookType, score),
    optimal_duration_sec: optimalDurationSec,
  };
}

function resolveHookType(plan: PlanningContext): HookAnalysis["type"] {
  const configuredType = plan.effective_request.base.style.hook_type.toLowerCase();
  const hookText = [
    plan.effective_request.base.intent.topic,
    plan.effective_request.base.intent.goal,
  ].join(" ");

  if (configuredType.includes("question") || hookText.includes("?")) {
    return "question";
  }

  if (configuredType.includes("shock")) {
    return "shock";
  }

  if (configuredType.includes("curiosity")) {
    return "curiosity";
  }

  if (configuredType.includes("stat") || /\d|%/.test(hookText)) {
    return "stat";
  }

  if (configuredType.includes("visual")) {
    return "visual";
  }

  return "statement";
}

function buildSuggestions(
  plan: PlanningContext,
  hookType: HookAnalysis["type"],
  score: number,
): string[] {
  const suggestions: string[] = [];

  if (hookType !== "question" && score < 0.75) {
    suggestions.push("Lead with a sharper question or claim in the first line.");
  }

  if (!STRONG_HOOK_MOTIONS.has(plan.motion_plan.hook_motion.selected)) {
    suggestions.push("Use a stronger opening camera move to raise hook intensity.");
  }

  const firstBroll = plan.broll_plan.segments[0]?.concept ?? "n/a";
  if (firstBroll === "generic" || firstBroll === "n/a") {
    suggestions.push("Swap the first B-roll concept for a more specific visual metaphor.");
  }

  if ((plan.motion_plan.segments[0]?.duration_sec ?? 0) > 4) {
    suggestions.push("Compress the hook beat so the reveal lands within three seconds.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Keep the opening concise and let the first visual reveal land immediately.");
  }

  return suggestions;
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
