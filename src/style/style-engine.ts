import type { EngineRequest, EngineStyle, Platform, StyleResolution } from "../domain/contracts.js";
import type { TasteProfile } from "../taste-db/schema.js";

const PLATFORM_DEFAULT_CAPTIONS: Record<Platform, string> = {
  youtube_shorts: "informative_clean",
  tiktok: "tiktok_viral",
  instagram_reels: "cinematic_minimal",
};

const GENERIC_CAMERA_LANGUAGES = new Set([
  "simple_push_in",
  "slow_push_in",
  "dynamic_pan",
]);

const DIRECTOR_CAMERA_LANGUAGE: Record<string, string> = {
  bong_joon_ho: "social_tracking",
  christopher_nolan: "epic_push_pull",
  denis_villeneuve: "monumental_slow_push",
  edgar_wright: "kinetic_snap",
  park_chan_wook: "ornate_closeup",
  wes_anderson: "symmetry_tableau",
};

const HOOK_TYPE_ALIASES: Record<string, string> = {
  false_sincerity: "curiosity",
  mystery_question: "question",
  pattern_interrupt: "surprise",
  sensory_immersion: "curiosity",
  tone_bait_switch: "surprise",
  unsettling_normal: "curiosity",
  visual_spectacle: "surprise",
};

const REQUEST_PACE_SCORE: Record<string, number> = {
  dramatic_build: 0.58,
  fast_cut: 0.88,
  slow_burn: 0.24,
};

const DIRECTOR_CONCEPT_KEYWORDS: Record<string, string[]> = {
  bong_joon_ho: ["risk", "comparison", "change"],
  christopher_nolan: ["innovation", "decision", "opportunity"],
  denis_villeneuve: ["focus", "clarity", "opportunity"],
  edgar_wright: ["speed", "momentum", "surprise"],
  park_chan_wook: ["risk", "change", "surprise"],
  wes_anderson: ["simplicity", "clarity", "trust"],
};

const MOOD_CONCEPT_KEYWORDS: Array<{ pattern: RegExp; keywords: string[] }> = [
  { pattern: /wonder|awe/, keywords: ["innovation", "opportunity"] },
  { pattern: /rest|comfort|warm/, keywords: ["trust", "focus"] },
  { pattern: /tension|dread|pressure/, keywords: ["risk", "decision"] },
  { pattern: /playful|adrenaline/, keywords: ["momentum", "speed"] },
  { pattern: /clarity/, keywords: ["clarity", "simplicity"] },
];

function topWeightedMatch(weights: Record<string, number>): [string, number] | null {
  const matches = Object.entries(weights).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });

  return matches[0] ?? null;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))];
}

function mapBlendedPacingProfile(requestPacing: string, dnaPace: number): string {
  const requestPace = REQUEST_PACE_SCORE[requestPacing] ?? 0.55;
  const blended = (requestPace + dnaPace) / 2;

  if (blended >= 0.72) {
    return "fast_cut";
  }

  if (blended <= 0.38) {
    return "slow_burn";
  }

  return "dramatic_build";
}

function resolveHookType(requestStyle: EngineStyle, tasteProfile: TasteProfile): string {
  if (requestStyle.hook_type === "cliffhanger") {
    return requestStyle.hook_type;
  }

  return HOOK_TYPE_ALIASES[tasteProfile.computed_dna.hook.type] ?? tasteProfile.computed_dna.hook.type;
}

function resolveCaptionStyle(
  request: EngineRequest,
  tasteProfile: TasteProfile,
  resolvedPacing: string,
): string {
  const platformDefault = PLATFORM_DEFAULT_CAPTIONS[request.intent.platform];
  if (request.style.caption_style !== platformDefault) {
    return request.style.caption_style;
  }

  if (request.intent.platform === "tiktok") {
    return resolvedPacing === "slow_burn" ? "dynamic_subtitle_punch" : "tiktok_viral";
  }

  if (request.intent.platform === "instagram_reels") {
    return tasteProfile.computed_dna.color.saturation >= 0.7
      ? "editorial_glow"
      : "cinematic_minimal";
  }

  return tasteProfile.computed_dna.color.mood.includes("wonder")
    ? "cinematic_explainer"
    : "informative_clean";
}

function resolveCameraLanguage(
  request: EngineRequest,
  tasteProfile: TasteProfile,
): string {
  const topDirector = topWeightedMatch(tasteProfile.nearest_presets.directors);
  if (!topDirector) {
    return request.style.camera_language;
  }

  const [directorId, weight] = topDirector;
  const mappedCameraLanguage = DIRECTOR_CAMERA_LANGUAGE[directorId];
  if (!mappedCameraLanguage) {
    return request.style.camera_language;
  }

  if (weight >= 0.45 || GENERIC_CAMERA_LANGUAGES.has(request.style.camera_language)) {
    return mappedCameraLanguage;
  }

  return request.style.camera_language;
}

function buildConceptKeywords(
  request: EngineRequest,
  tasteProfile: TasteProfile,
  resolvedStyle: EngineStyle,
): string[] {
  const topDirector = topWeightedMatch(tasteProfile.nearest_presets.directors)?.[0];
  const keywords = [
    ...tasteProfile.computed_dna.narrative.theme_keywords,
    ...(topDirector ? DIRECTOR_CONCEPT_KEYWORDS[topDirector] ?? [] : []),
  ];

  if (resolvedStyle.pacing_profile === "fast_cut") {
    keywords.push("speed", "momentum");
  }

  if (resolvedStyle.pacing_profile === "slow_burn") {
    keywords.push("focus", "clarity");
  }

  if (resolvedStyle.hook_type === "question") {
    keywords.push("choice", "decision");
  }

  if (resolvedStyle.hook_type === "surprise") {
    keywords.push("surprise");
  }

  if (request.intent.platform === "instagram_reels") {
    keywords.push("simplicity");
  }

  for (const descriptor of MOOD_CONCEPT_KEYWORDS) {
    if (descriptor.pattern.test(tasteProfile.computed_dna.color.mood)) {
      keywords.push(...descriptor.keywords);
    }
  }

  return uniqueStrings(keywords);
}

function buildRequestOnlyResolution(request: EngineRequest): StyleResolution {
  return {
    schema_version: "0.2.0",
    source: "request_only",
    taste_profile_id: null,
    resolved_style: { ...request.style },
    director_matches: {},
    writer_matches: {},
    narrative_keywords: [],
    color_palette: [],
    concept_keywords: [],
    mood: null,
    camera_signature: null,
    music_style: null,
    notes: ["no_taste_profile_found"],
  };
}

export function resolveStyleResolution(
  request: EngineRequest,
  tasteProfile: TasteProfile | null,
): StyleResolution {
  if (!tasteProfile) {
    return buildRequestOnlyResolution(request);
  }

  const resolvedPacing = mapBlendedPacingProfile(
    request.style.pacing_profile,
    tasteProfile.computed_dna.editing.pace,
  );
  const resolvedStyle: EngineStyle = {
    hook_type: resolveHookType(request.style, tasteProfile),
    pacing_profile: resolvedPacing,
    caption_style: resolveCaptionStyle(request, tasteProfile, resolvedPacing),
    camera_language: resolveCameraLanguage(request, tasteProfile),
  };

  const notes = ["taste_profile_applied"];
  if (resolvedStyle.pacing_profile !== request.style.pacing_profile) {
    notes.push("taste_adjusted_pacing_profile");
  }
  if (resolvedStyle.camera_language !== request.style.camera_language) {
    notes.push("taste_adjusted_camera_language");
  }
  if (resolvedStyle.caption_style !== request.style.caption_style) {
    notes.push("taste_adjusted_caption_style");
  }
  if (resolvedStyle.hook_type !== request.style.hook_type) {
    notes.push("taste_adjusted_hook_type");
  }

  return {
    schema_version: "0.2.0",
    source: "taste_profile",
    taste_profile_id: tasteProfile.profile_id,
    resolved_style: resolvedStyle,
    director_matches: { ...tasteProfile.nearest_presets.directors },
    writer_matches: { ...tasteProfile.nearest_presets.writers },
    narrative_keywords: [...tasteProfile.computed_dna.narrative.theme_keywords],
    color_palette: [...tasteProfile.computed_dna.color.palette],
    concept_keywords: buildConceptKeywords(request, tasteProfile, resolvedStyle),
    mood: tasteProfile.computed_dna.color.mood,
    camera_signature: tasteProfile.computed_dna.camera.signature,
    music_style: tasteProfile.computed_dna.audio.music_style,
    notes,
  };
}

export function applyStyleResolution(
  request: EngineRequest,
  styleResolution: StyleResolution,
): EngineRequest {
  return {
    ...request,
    style: {
      ...request.style,
      ...styleResolution.resolved_style,
    },
  };
}
