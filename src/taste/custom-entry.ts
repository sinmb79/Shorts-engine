import type { TasteEntry } from "../taste-db/schema.js";
import { saveCustomEntry } from "./profile-manager.js";
import type { TastePromptOption, TastePromptSession } from "./prompt-session.js";

interface CustomEntryAnswers {
  category: "movie" | "visual_style" | "author";
  title: string;
  year: number | null;
  genres: string[];
  mood: "dreamy" | "grounded" | "playful" | "intense" | "melancholic";
  pace: "slow" | "balanced" | "fast";
  color: "warm" | "cool" | "pastel" | "neon" | "monochrome";
  emotion: "awe" | "comfort" | "tension" | "wonder" | "rebellion";
  hook: "mystery_question" | "pattern_interrupt" | "false_sincerity" | "visual_spectacle";
}

const CATEGORY_OPTIONS: TastePromptOption<CustomEntryAnswers["category"]>[] = [
  { value: "movie", label: "Movie reference" },
  { value: "visual_style", label: "Visual style reference" },
  { value: "author", label: "Author or writer reference" },
];

const MOOD_OPTIONS: TastePromptOption<CustomEntryAnswers["mood"]>[] = [
  { value: "dreamy", label: "Dreamy" },
  { value: "grounded", label: "Grounded" },
  { value: "playful", label: "Playful" },
  { value: "intense", label: "Intense" },
  { value: "melancholic", label: "Melancholic" },
];

const PACE_OPTIONS: TastePromptOption<CustomEntryAnswers["pace"]>[] = [
  { value: "slow", label: "Slow" },
  { value: "balanced", label: "Balanced" },
  { value: "fast", label: "Fast" },
];

const COLOR_OPTIONS: TastePromptOption<CustomEntryAnswers["color"]>[] = [
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "pastel", label: "Pastel" },
  { value: "neon", label: "Neon" },
  { value: "monochrome", label: "Monochrome" },
];

const EMOTION_OPTIONS: TastePromptOption<CustomEntryAnswers["emotion"]>[] = [
  { value: "awe", label: "Awe" },
  { value: "comfort", label: "Comfort" },
  { value: "tension", label: "Tension" },
  { value: "wonder", label: "Wonder" },
  { value: "rebellion", label: "Rebellion" },
];

const HOOK_OPTIONS: TastePromptOption<CustomEntryAnswers["hook"]>[] = [
  { value: "mystery_question", label: "Mystery question" },
  { value: "pattern_interrupt", label: "Pattern interrupt" },
  { value: "false_sincerity", label: "False sincerity" },
  { value: "visual_spectacle", label: "Visual spectacle" },
];

const MOVEMENT_BY_PACE: Record<CustomEntryAnswers["pace"], string[]> = {
  slow: ["slow_push", "lockoff", "patient_track"],
  balanced: ["steady_track", "gentle_pan", "medium_push"],
  fast: ["whip_pan", "snap_zoom", "kinetic_push"],
};

const SIGNATURE_BY_MOOD: Record<CustomEntryAnswers["mood"], string> = {
  dreamy: "soft_reverie",
  grounded: "lived_in_detail",
  playful: "kinetic_mischief",
  intense: "pressure_cooker_focus",
  melancholic: "quiet_afterimage",
};

const CUT_RHYTHM_BY_PACE: Record<CustomEntryAnswers["pace"], string> = {
  slow: "meditative_breathing",
  balanced: "measured_progression",
  fast: "percussive_burst",
};

const TEMPERATURE_BY_COLOR: Record<CustomEntryAnswers["color"], number> = {
  warm: 0.78,
  cool: 0.24,
  pastel: 0.61,
  neon: 0.49,
  monochrome: 0.34,
};

const SATURATION_BY_COLOR: Record<CustomEntryAnswers["color"], number> = {
  warm: 0.58,
  cool: 0.42,
  pastel: 0.52,
  neon: 0.92,
  monochrome: 0.12,
};

const PALETTE_BY_COLOR: Record<CustomEntryAnswers["color"], string[]> = {
  warm: ["amber", "sand", "terracotta"],
  cool: ["steel_blue", "slate", "ice_gray"],
  pastel: ["powder_pink", "mint", "soft_blue"],
  neon: ["electric_cyan", "magenta", "acid_yellow"],
  monochrome: ["charcoal", "paper_white", "silver"],
};

const MUSIC_BY_MOOD: Record<CustomEntryAnswers["mood"], string> = {
  dreamy: "ambient_haze",
  grounded: "organic_minimal",
  playful: "quirky_pulse",
  intense: "driving_percussion",
  melancholic: "piano_echo",
};

const NARRATIVE_BY_EMOTION: Record<
  CustomEntryAnswers["emotion"],
  { structure: string; emotion_arc: string; pacing: string }
> = {
  awe: {
    structure: "discovery_reveal",
    emotion_arc: "curiosity_to_awe",
    pacing: "patient_expansion",
  },
  comfort: {
    structure: "slice_of_life",
    emotion_arc: "distance_to_warmth",
    pacing: "gentle_accumulation",
  },
  tension: {
    structure: "pressure_spiral",
    emotion_arc: "stability_to_threat",
    pacing: "tightening_ramp",
  },
  wonder: {
    structure: "quest_parable",
    emotion_arc: "uncertainty_to_revelation",
    pacing: "measured_revelation",
  },
  rebellion: {
    structure: "rule_breaking_uprise",
    emotion_arc: "constraint_to_release",
    pacing: "accelerating_release",
  },
};

const DIRECTOR_HINTS: Record<CustomEntryAnswers["mood"], Record<string, number>> = {
  dreamy: { wes_anderson: 0.7, denis_villeneuve: 0.2, christopher_nolan: 0.1 },
  grounded: { bong_joon_ho: 0.6, denis_villeneuve: 0.25, christopher_nolan: 0.15 },
  playful: { edgar_wright: 0.65, wes_anderson: 0.25, bong_joon_ho: 0.1 },
  intense: { park_chan_wook: 0.55, christopher_nolan: 0.3, denis_villeneuve: 0.15 },
  melancholic: { denis_villeneuve: 0.4, park_chan_wook: 0.3, wes_anderson: 0.3 },
};

const WRITER_HINTS: Record<CustomEntryAnswers["emotion"], Record<string, number>> = {
  awe: { paulo_coelho: 0.45, haruki_murakami: 0.3, charlie_kaufman: 0.25 },
  comfort: { noh_hee_kyung: 0.6, paulo_coelho: 0.2, agatha_christie: 0.2 },
  tension: { agatha_christie: 0.45, aaron_sorkin: 0.25, charlie_kaufman: 0.3 },
  wonder: { paulo_coelho: 0.35, haruki_murakami: 0.4, noh_hee_kyung: 0.25 },
  rebellion: { aaron_sorkin: 0.45, charlie_kaufman: 0.2, noh_hee_kyung: 0.35 },
};

function roundValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function parseYear(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? null : numeric;
}

function buildStyleVector(answers: CustomEntryAnswers): TasteEntry["style_vector"] {
  const movementEnergyByPace: Record<CustomEntryAnswers["pace"], number> = {
    slow: 0.26,
    balanced: 0.54,
    fast: 0.88,
  };

  const scaleByEmotion: Record<CustomEntryAnswers["emotion"], number> = {
    awe: 0.82,
    comfort: 0.4,
    tension: 0.58,
    wonder: 0.74,
    rebellion: 0.61,
  };

  const closeupByMood: Record<CustomEntryAnswers["mood"], number> = {
    dreamy: 0.64,
    grounded: 0.55,
    playful: 0.46,
    intense: 0.71,
    melancholic: 0.76,
  };

  const narrative = NARRATIVE_BY_EMOTION[answers.emotion];

  return {
    camera: {
      scale: roundValue(scaleByEmotion[answers.emotion]),
      movement_energy: roundValue(movementEnergyByPace[answers.pace]),
      closeup_ratio: roundValue(closeupByMood[answers.mood]),
      primary_movements: [...MOVEMENT_BY_PACE[answers.pace]],
      signature: SIGNATURE_BY_MOOD[answers.mood],
    },
    editing: {
      pace: roundValue(movementEnergyByPace[answers.pace]),
      cut_rhythm: CUT_RHYTHM_BY_PACE[answers.pace],
      cross_cutting: answers.pace === "fast" || answers.emotion === "rebellion",
      time_manipulation: answers.mood === "dreamy" || answers.emotion === "wonder",
    },
    color: {
      temperature: roundValue(TEMPERATURE_BY_COLOR[answers.color]),
      saturation: roundValue(SATURATION_BY_COLOR[answers.color]),
      palette: [...PALETTE_BY_COLOR[answers.color]],
      mood: `${answers.mood}_${answers.color}`,
    },
    audio: {
      music_style: MUSIC_BY_MOOD[answers.mood],
      music_intensity: roundValue(
        answers.pace === "fast" ? 0.82 : answers.pace === "balanced" ? 0.56 : 0.34,
      ),
      silence_usage: roundValue(
        answers.pace === "slow" ? 0.68 : answers.pace === "balanced" ? 0.42 : 0.18,
      ),
      sfx_style: answers.pace === "fast" ? "stylized_hit_points" : "natural_detail",
    },
    narrative: {
      structure: narrative.structure,
      emotion_arc: narrative.emotion_arc,
      pacing: narrative.pacing,
      theme_keywords: [...new Set([...answers.genres, answers.mood, answers.emotion])],
    },
    hook: {
      type: answers.hook,
      first_3sec: `${answers.hook}_${answers.color}`,
      retention: answers.pace === "fast" ? "rapid_payoff" : "slow_release",
    },
  };
}

export function buildCustomTasteEntry(answers: CustomEntryAnswers): TasteEntry {
  const entryId = `custom_${slugify(answers.title) || "taste_reference"}`;

  return {
    id: entryId,
    title: {
      ko: answers.title,
      en: answers.title,
    },
    ...(answers.year ? { year: answers.year } : {}),
    category: answers.category,
    genre: answers.genres.length > 0 ? answers.genres : ["custom"],
    style_vector: buildStyleVector(answers),
    maps_to_presets: {
      directors: { ...DIRECTOR_HINTS[answers.mood] },
      writers: { ...WRITER_HINTS[answers.emotion] },
    },
  };
}

export async function runCustomEntryWizard(
  session: TastePromptSession,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ entry: TasteEntry; custom_entries_path: string }> {
  session.write("\nCustom taste entry wizard turns structured choices into a reusable style reference.\n");

  const category = await session.askChoice("What kind of custom reference is this?", CATEGORY_OPTIONS);
  const title = await session.askText("Title");
  const year = parseYear(await session.askText("Year (optional)", { allowEmpty: true }));
  const genresInput = await session.askText(
    "Genre or keyword tags, comma separated",
    { defaultValue: "custom" },
  );
  const mood = await session.askChoice("Overall mood", MOOD_OPTIONS);
  const pace = await session.askChoice("Editing pace", PACE_OPTIONS, "balanced");
  const color = await session.askChoice("Color direction", COLOR_OPTIONS);
  const emotion = await session.askChoice("Primary emotional effect", EMOTION_OPTIONS);
  const hook = await session.askChoice("Opening hook", HOOK_OPTIONS, "mystery_question");

  const entry = buildCustomTasteEntry({
    category,
    title,
    year,
    genres: genresInput
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value !== ""),
    mood,
    pace,
    color,
    emotion,
    hook,
  });

  const customEntriesPath = await saveCustomEntry(entry, env);
  return {
    entry,
    custom_entries_path: customEntriesPath,
  };
}
