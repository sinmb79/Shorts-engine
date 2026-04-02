import type {
  NormalizedRequest,
  NovelShortsPlan,
  StyleResolution,
} from "../domain/contracts.js";

export interface HookDecision {
  hook_type: string;
  opening_device: string;
  reason_codes: string[];
}

const HOOK_TYPE_ALIASES: Record<string, string> = {
  cliffhanger: "mystery_question",
  curiosity: "mystery_question",
  question: "mystery_question",
  shock: "tone_bait_switch",
  surprise: "pattern_interrupt",
};

export function forgeHook(
  effectiveRequest: NormalizedRequest,
  styleResolution: StyleResolution,
  novelShortsPlan: NovelShortsPlan | null,
): HookDecision {
  const reasonCodes: string[] = [];
  const topDirector = Object.entries(styleResolution.director_matches)[0]?.[0] ?? null;
  let hookType =
    HOOK_TYPE_ALIASES[styleResolution.resolved_style.hook_type] ??
    styleResolution.resolved_style.hook_type;

  if (novelShortsPlan?.mode === "cliffhanger_short") {
    hookType = "mystery_question";
    reasonCodes.push("novel_cliffhanger_bias");
  }

  if (topDirector === "wes_anderson" && hookType === "mystery_question") {
    hookType = "unsettling_normal";
    reasonCodes.push("director_wes_anderson_bias");
  }

  if (topDirector === "edgar_wright" && hookType === "mystery_question") {
    hookType = "pattern_interrupt";
    reasonCodes.push("director_edgar_wright_bias");
  }

  if (
    styleResolution.resolved_style.pacing_profile === "fast_cut" &&
    hookType === "unsettling_normal"
  ) {
    hookType = "pattern_interrupt";
    reasonCodes.push("fast_cut_overrides_soft_hook");
  }

  if (styleResolution.camera_signature?.includes("storybook")) {
    reasonCodes.push("camera_signature_storybook");
  }

  if (styleResolution.music_style?.includes("needle_drop")) {
    reasonCodes.push("music_style_needle_drop");
  }

  if (styleResolution.source === "taste_profile") {
    reasonCodes.push("taste_profile_hook_bias");
  } else {
    reasonCodes.push("request_hook_bias");
  }

  return {
    hook_type: hookType,
    opening_device: buildOpeningDevice(
      hookType,
      effectiveRequest,
      styleResolution,
      novelShortsPlan,
    ),
    reason_codes: reasonCodes,
  };
}

function buildOpeningDevice(
  hookType: string,
  effectiveRequest: NormalizedRequest,
  styleResolution: StyleResolution,
  novelShortsPlan: NovelShortsPlan | null,
): string {
  if (novelShortsPlan) {
    return `Start with the unresolved image from ${novelShortsPlan.highlight_candidate}, then hold back the explanation long enough to build tension.`;
  }

  switch (hookType) {
    case "pattern_interrupt":
      return `Interrupt ${effectiveRequest.base.intent.subject}'s routine with a rhythmic visual jolt tied to ${effectiveRequest.base.intent.topic}.`;
    case "unsettling_normal":
      return `Present ${effectiveRequest.base.intent.topic} inside a perfectly controlled frame, then reveal one small mismatch.`;
    case "tone_bait_switch":
      return `Open with apparent confidence, then pivot the tone to expose the hidden cost around ${effectiveRequest.base.intent.topic}.`;
    case "visual_spectacle":
      return `Lead with a high-impact image that makes ${effectiveRequest.base.intent.topic} feel larger than everyday life.`;
    case "sensory_immersion":
      return `Begin with texture, sound, and atmosphere so ${effectiveRequest.base.intent.topic} feels physical before it is explained.`;
    case "false_sincerity":
      return `Use a simple, sincere setup that slowly reveals a sharper truth about ${effectiveRequest.base.intent.topic}.`;
    default:
      return `Ask the sharpest question about ${effectiveRequest.base.intent.topic} before giving the audience any comfort.`;
  }
}
