export interface StyleVector {
  camera: {
    scale: number;
    movement_energy: number;
    closeup_ratio: number;
    primary_movements: string[];
    signature: string;
  };
  editing: {
    pace: number;
    cut_rhythm: string;
    cross_cutting: boolean;
    time_manipulation: boolean;
  };
  color: {
    temperature: number;
    saturation: number;
    palette: string[];
    mood: string;
  };
  audio: {
    music_style: string;
    music_intensity: number;
    silence_usage: number;
    sfx_style: string;
  };
  narrative: {
    structure: string;
    emotion_arc: string;
    pacing: string;
    theme_keywords: string[];
  };
  hook: {
    type: string;
    first_3sec: string;
    retention: string;
  };
}

export type TasteEntryCategory = "movie" | "visual_style" | "author" | "custom";

export interface TasteEntry {
  id: string;
  title: { ko: string; en: string };
  year?: number;
  category: TasteEntryCategory;
  genre: string[];
  style_vector: StyleVector;
  maps_to_presets: {
    directors: Record<string, number>;
    writers: Record<string, number>;
  };
}

export interface TasteSelectionRecord {
  movies: string[];
  visual_styles: string[];
  authors: string[];
}

export interface TasteProfile {
  profile_id: string;
  created_at: string;
  updated_at: string;
  selections: TasteSelectionRecord;
  computed_dna: StyleVector;
  nearest_presets: {
    directors: Record<string, number>;
    writers: Record<string, number>;
  };
}

export interface TasteCatalog {
  movies: TasteEntry[];
  visual_styles: TasteEntry[];
  authors: TasteEntry[];
  custom: TasteEntry[];
  all: TasteEntry[];
}

export interface TasteCatalogCounts {
  movies: number;
  visual_styles: number;
  authors: number;
  custom: number;
  total: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateWeightMap(
  value: unknown,
  path: string,
  errors: string[],
): value is Record<string, number> {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return false;
  }

  for (const [key, weight] of Object.entries(value)) {
    if (typeof weight !== "number" || Number.isNaN(weight) || weight < 0 || weight > 1) {
      errors.push(`${path}.${key} must be a number between 0 and 1.`);
    }
  }

  return true;
}

function validateRange(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    errors.push(`${path} must be a number between 0 and 1.`);
  }
}

export function validateStyleVector(
  styleVector: unknown,
  context = "style_vector",
): string[] {
  const errors: string[] = [];

  if (!isRecord(styleVector)) {
    return [`${context} must be an object.`];
  }

  const camera = styleVector["camera"];
  const editing = styleVector["editing"];
  const color = styleVector["color"];
  const audio = styleVector["audio"];
  const narrative = styleVector["narrative"];
  const hook = styleVector["hook"];

  if (!isRecord(camera)) {
    errors.push(`${context}.camera must be an object.`);
  } else {
    validateRange(camera["scale"], `${context}.camera.scale`, errors);
    validateRange(camera["movement_energy"], `${context}.camera.movement_energy`, errors);
    validateRange(camera["closeup_ratio"], `${context}.camera.closeup_ratio`, errors);
    if (!isStringArray(camera["primary_movements"]) || camera["primary_movements"].length === 0) {
      errors.push(`${context}.camera.primary_movements must be a non-empty string array.`);
    }
    if (typeof camera["signature"] !== "string" || camera["signature"].trim() === "") {
      errors.push(`${context}.camera.signature must be a non-empty string.`);
    }
  }

  if (!isRecord(editing)) {
    errors.push(`${context}.editing must be an object.`);
  } else {
    validateRange(editing["pace"], `${context}.editing.pace`, errors);
    if (typeof editing["cut_rhythm"] !== "string" || editing["cut_rhythm"].trim() === "") {
      errors.push(`${context}.editing.cut_rhythm must be a non-empty string.`);
    }
    if (typeof editing["cross_cutting"] !== "boolean") {
      errors.push(`${context}.editing.cross_cutting must be a boolean.`);
    }
    if (typeof editing["time_manipulation"] !== "boolean") {
      errors.push(`${context}.editing.time_manipulation must be a boolean.`);
    }
  }

  if (!isRecord(color)) {
    errors.push(`${context}.color must be an object.`);
  } else {
    validateRange(color["temperature"], `${context}.color.temperature`, errors);
    validateRange(color["saturation"], `${context}.color.saturation`, errors);
    if (!isStringArray(color["palette"]) || color["palette"].length === 0) {
      errors.push(`${context}.color.palette must be a non-empty string array.`);
    }
    if (typeof color["mood"] !== "string" || color["mood"].trim() === "") {
      errors.push(`${context}.color.mood must be a non-empty string.`);
    }
  }

  if (!isRecord(audio)) {
    errors.push(`${context}.audio must be an object.`);
  } else {
    if (typeof audio["music_style"] !== "string" || audio["music_style"].trim() === "") {
      errors.push(`${context}.audio.music_style must be a non-empty string.`);
    }
    validateRange(audio["music_intensity"], `${context}.audio.music_intensity`, errors);
    validateRange(audio["silence_usage"], `${context}.audio.silence_usage`, errors);
    if (typeof audio["sfx_style"] !== "string" || audio["sfx_style"].trim() === "") {
      errors.push(`${context}.audio.sfx_style must be a non-empty string.`);
    }
  }

  if (!isRecord(narrative)) {
    errors.push(`${context}.narrative must be an object.`);
  } else {
    if (typeof narrative["structure"] !== "string" || narrative["structure"].trim() === "") {
      errors.push(`${context}.narrative.structure must be a non-empty string.`);
    }
    if (typeof narrative["emotion_arc"] !== "string" || narrative["emotion_arc"].trim() === "") {
      errors.push(`${context}.narrative.emotion_arc must be a non-empty string.`);
    }
    if (typeof narrative["pacing"] !== "string" || narrative["pacing"].trim() === "") {
      errors.push(`${context}.narrative.pacing must be a non-empty string.`);
    }
    if (!isStringArray(narrative["theme_keywords"]) || narrative["theme_keywords"].length === 0) {
      errors.push(`${context}.narrative.theme_keywords must be a non-empty string array.`);
    }
  }

  if (!isRecord(hook)) {
    errors.push(`${context}.hook must be an object.`);
  } else {
    if (typeof hook["type"] !== "string" || hook["type"].trim() === "") {
      errors.push(`${context}.hook.type must be a non-empty string.`);
    }
    if (typeof hook["first_3sec"] !== "string" || hook["first_3sec"].trim() === "") {
      errors.push(`${context}.hook.first_3sec must be a non-empty string.`);
    }
    if (typeof hook["retention"] !== "string" || hook["retention"].trim() === "") {
      errors.push(`${context}.hook.retention must be a non-empty string.`);
    }
  }

  return errors;
}

export function validateTasteEntry(entry: unknown, context = "entry"): string[] {
  const errors: string[] = [];

  if (!isRecord(entry)) {
    return [`${context} must be an object.`];
  }

  if (typeof entry["id"] !== "string" || entry["id"].trim() === "") {
    errors.push(`${context}.id must be a non-empty string.`);
  }

  const title = entry["title"];
  if (!isRecord(title)) {
    errors.push(`${context}.title must be an object.`);
  } else {
    if (typeof title["ko"] !== "string" || title["ko"].trim() === "") {
      errors.push(`${context}.title.ko must be a non-empty string.`);
    }
    if (typeof title["en"] !== "string" || title["en"].trim() === "") {
      errors.push(`${context}.title.en must be a non-empty string.`);
    }
  }

  if (
    entry["year"] !== undefined
    && (typeof entry["year"] !== "number" || !Number.isInteger(entry["year"]))
  ) {
    errors.push(`${context}.year must be an integer when provided.`);
  }

  const category = entry["category"];
  if (
    category !== "movie"
    && category !== "visual_style"
    && category !== "author"
    && category !== "custom"
  ) {
    errors.push(`${context}.category must be movie, visual_style, author, or custom.`);
  }

  if (!isStringArray(entry["genre"])) {
    errors.push(`${context}.genre must be a string array.`);
  }

  errors.push(...validateStyleVector(entry["style_vector"], `${context}.style_vector`));

  const mapsToPresets = entry["maps_to_presets"];
  if (!isRecord(mapsToPresets)) {
    errors.push(`${context}.maps_to_presets must be an object.`);
  } else {
    validateWeightMap(mapsToPresets["directors"], `${context}.maps_to_presets.directors`, errors);
    validateWeightMap(mapsToPresets["writers"], `${context}.maps_to_presets.writers`, errors);
  }

  return errors;
}

export function assertValidTasteEntries(entries: unknown, context = "catalog"): asserts entries is TasteEntry[] {
  if (!Array.isArray(entries)) {
    throw new Error(`${context} must be an array.`);
  }

  const errors = entries.flatMap((entry, index) => validateTasteEntry(entry, `${context}[${index}]`));
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
