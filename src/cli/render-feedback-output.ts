import type { FeedbackSubmissionResult } from "../quality/feedback-tracker.js";

export function renderFeedbackOutput(
  result: FeedbackSubmissionResult,
  json: boolean,
): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Feedback saved for scenario: ${result.feedback.scenario_id}`,
    `Overall score: ${result.feedback.overall_score}/5`,
    `Taste match: ${formatTasteMatch(result.feedback.taste_match)}`,
    `Good aspects: ${result.feedback.good_aspects.join(", ") || "n/a"}`,
    `Bad aspects: ${result.feedback.bad_aspects.join(", ") || "n/a"}`,
    `Top combos tracked: ${result.evolution.verified_combos.length}`,
    `DNA adjustments: ${result.evolution.dna_refinement.adjustments.length}`,
  ];

  return `${lines.join("\n")}\n`;
}

function formatTasteMatch(value: boolean | null): string {
  if (value === null) {
    return "skipped";
  }

  return value ? "yes" : "no";
}
