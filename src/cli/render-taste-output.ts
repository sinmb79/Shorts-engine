import type { TasteCommandOutput } from "../taste/types.js";

function formatPresetWeights(weights: Record<string, number>): string {
  const pairs = Object.entries(weights);
  if (pairs.length === 0) {
    return "n/a";
  }

  return pairs.map(([key, value]) => `${key} (${value.toFixed(3)})`).join(", ");
}

export function renderTasteOutput(result: TasteCommandOutput, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  if (result.action === "reset_profile") {
    return [
      `Taste profile removed: ${result.removed ? "yes" : "no"}`,
      `Profile path: ${result.profile_path}`,
    ].join("\n") + "\n";
  }

  if (result.action === "add_custom_entry") {
    return [
      `Custom entry saved: ${result.custom_entry?.id ?? "n/a"}`,
      `Category: ${result.custom_entry?.category ?? "n/a"}`,
      `Custom entries path: ${result.custom_entries_path ?? "n/a"}`,
    ].join("\n") + "\n";
  }

  if (result.action === "refined_profile") {
    return [
      `Taste profile refined: ${result.profile?.profile_id ?? "n/a"}`,
      `Adjustments applied: ${result.adjustments?.length ?? 0}`,
      `Feedback considered: ${result.considered_feedback ?? 0}`,
      `Profile path: ${result.profile_path}`,
    ].join("\n") + "\n";
  }

  if (!result.profile) {
    return `No taste profile found at ${result.profile_path}\n`;
  }

  const lines = [
    `Taste profile: ${result.profile.profile_id}`,
    `Selections: ${result.profile.selections.movies.length} movies, ${result.profile.selections.visual_styles.length} visual styles, ${result.profile.selections.authors.length} authors`,
    `Top directors: ${formatPresetWeights(result.profile.nearest_presets.directors)}`,
    `Top writers: ${formatPresetWeights(result.profile.nearest_presets.writers)}`,
    `Profile path: ${result.profile_path}`,
  ];

  if (result.catalog_counts) {
    lines.push(
      `Catalog counts: ${result.catalog_counts.movies} movies, ${result.catalog_counts.visual_styles} visual styles, ${result.catalog_counts.authors} authors, ${result.catalog_counts.custom} custom`,
    );
  }

  return `${lines.join("\n")}\n`;
}
