import { randomUUID } from "node:crypto";

import { DIRECTOR_PRESET_VECTORS, WRITER_PRESET_VECTORS } from "../style/preset-library.js";
import type {
  StyleVector,
  TasteCatalog,
  TasteEntry,
  TasteProfile,
  TasteSelectionRecord,
} from "../taste-db/schema.js";
import { findTasteEntryById } from "../taste-db/catalog-loader.js";

function roundValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function averageNumber(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return roundValue(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function chooseMostCommon(values: string[]): string {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let bestValue = values[0] ?? "balanced";
  let bestScore = counts.get(bestValue) ?? 0;

  for (const [value, score] of counts.entries()) {
    if (score > bestScore) {
      bestValue = value;
      bestScore = score;
    }
  }

  return bestValue;
}

function mergeTopStrings(values: string[][], limit: number): string[] {
  const counts = new Map<string, number>();

  for (const group of values) {
    for (const value of group) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([value]) => value);
}

function averageBooleans(values: boolean[]): boolean {
  if (values.length === 0) {
    return false;
  }

  const trueCount = values.filter(Boolean).length;
  return trueCount >= values.length / 2;
}

function flattenVector(vector: StyleVector): number[] {
  return [
    vector.camera.scale,
    vector.camera.movement_energy,
    vector.camera.closeup_ratio,
    vector.editing.pace,
    vector.editing.cross_cutting ? 1 : 0,
    vector.editing.time_manipulation ? 1 : 0,
    vector.color.temperature,
    vector.color.saturation,
    vector.audio.music_intensity,
    vector.audio.silence_usage,
  ];
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index++) {
    dot += left[index]! * right[index]!;
    leftMagnitude += left[index]! * left[index]!;
    rightMagnitude += right[index]! * right[index]!;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function rankPresets(
  vector: StyleVector,
  presetVectors: Record<string, StyleVector>,
): Record<string, number> {
  const source = flattenVector(vector);

  return Object.fromEntries(
    Object.entries(presetVectors)
      .map(([presetId, presetVector]) => [
        presetId,
        roundValue(Math.max(0, cosineSimilarity(source, flattenVector(presetVector)))),
      ] as const)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3),
  );
}

function resolveSelectedEntries(
  ids: string[],
  catalog: TasteCatalog,
  categoryLabel: string,
): TasteEntry[] {
  return ids.map((id) => {
    const entry = findTasteEntryById(catalog, id);
    if (!entry) {
      throw new Error(`Unknown ${categoryLabel} selection: ${id}`);
    }

    return entry;
  });
}

export function computeStyleVectorFromEntries(entries: TasteEntry[]): StyleVector {
  if (entries.length === 0) {
    throw new Error("At least one taste entry is required to compute a Style DNA.");
  }

  return {
    camera: {
      scale: averageNumber(entries.map((entry) => entry.style_vector.camera.scale)),
      movement_energy: averageNumber(entries.map((entry) => entry.style_vector.camera.movement_energy)),
      closeup_ratio: averageNumber(entries.map((entry) => entry.style_vector.camera.closeup_ratio)),
      primary_movements: mergeTopStrings(
        entries.map((entry) => entry.style_vector.camera.primary_movements),
        4,
      ),
      signature: chooseMostCommon(entries.map((entry) => entry.style_vector.camera.signature)),
    },
    editing: {
      pace: averageNumber(entries.map((entry) => entry.style_vector.editing.pace)),
      cut_rhythm: chooseMostCommon(entries.map((entry) => entry.style_vector.editing.cut_rhythm)),
      cross_cutting: averageBooleans(entries.map((entry) => entry.style_vector.editing.cross_cutting)),
      time_manipulation: averageBooleans(entries.map((entry) => entry.style_vector.editing.time_manipulation)),
    },
    color: {
      temperature: averageNumber(entries.map((entry) => entry.style_vector.color.temperature)),
      saturation: averageNumber(entries.map((entry) => entry.style_vector.color.saturation)),
      palette: mergeTopStrings(entries.map((entry) => entry.style_vector.color.palette), 5),
      mood: chooseMostCommon(entries.map((entry) => entry.style_vector.color.mood)),
    },
    audio: {
      music_style: chooseMostCommon(entries.map((entry) => entry.style_vector.audio.music_style)),
      music_intensity: averageNumber(entries.map((entry) => entry.style_vector.audio.music_intensity)),
      silence_usage: averageNumber(entries.map((entry) => entry.style_vector.audio.silence_usage)),
      sfx_style: chooseMostCommon(entries.map((entry) => entry.style_vector.audio.sfx_style)),
    },
    narrative: {
      structure: chooseMostCommon(entries.map((entry) => entry.style_vector.narrative.structure)),
      emotion_arc: chooseMostCommon(entries.map((entry) => entry.style_vector.narrative.emotion_arc)),
      pacing: chooseMostCommon(entries.map((entry) => entry.style_vector.narrative.pacing)),
      theme_keywords: mergeTopStrings(
        entries.map((entry) => entry.style_vector.narrative.theme_keywords),
        6,
      ),
    },
    hook: {
      type: chooseMostCommon(entries.map((entry) => entry.style_vector.hook.type)),
      first_3sec: chooseMostCommon(entries.map((entry) => entry.style_vector.hook.first_3sec)),
      retention: chooseMostCommon(entries.map((entry) => entry.style_vector.hook.retention)),
    },
  };
}

export function generateTasteProfile(
  selections: TasteSelectionRecord,
  catalog: TasteCatalog,
  options: { now?: Date; profile_id?: string } = {},
): TasteProfile {
  const selectedEntries = [
    ...resolveSelectedEntries(selections.movies, catalog, "movie"),
    ...resolveSelectedEntries(selections.visual_styles, catalog, "visual style"),
    ...resolveSelectedEntries(selections.authors, catalog, "author"),
  ];

  if (selectedEntries.length === 0) {
    throw new Error("Taste onboarding requires at least one selection.");
  }

  const computedDna = computeStyleVectorFromEntries(selectedEntries);
  const timestamp = (options.now ?? new Date()).toISOString();

  return {
    profile_id: options.profile_id ?? `taste_${randomUUID()}`,
    created_at: timestamp,
    updated_at: timestamp,
    selections: {
      movies: [...new Set(selections.movies)],
      visual_styles: [...new Set(selections.visual_styles)],
      authors: [...new Set(selections.authors)],
    },
    computed_dna: computedDna,
    nearest_presets: {
      directors: rankPresets(computedDna, DIRECTOR_PRESET_VECTORS),
      writers: rankPresets(computedDna, WRITER_PRESET_VECTORS),
    },
  };
}
