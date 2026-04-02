import type { QualityDashboard } from "../quality/quality-dashboard.js";

export function renderQualityOutput(result: QualityDashboard, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const averageScore = result.average_score === null ? "n/a" : `${result.average_score}/5`;
  const tasteAccuracy =
    result.taste_dna_accuracy === null ? "n/a" : `${result.taste_dna_accuracy}%`;
  const topCombo = result.top_combos[0]?.combo_key ?? "n/a";

  const lines = [
    `Total scenarios generated: ${result.total_scenarios_generated}`,
    `Total feedback received: ${result.total_feedback_received}`,
    `Average score: ${averageScore}`,
    `Block health: gold ${result.block_health.gold}, normal ${result.block_health.normal}, flagged ${result.block_health.flagged}, retired ${result.block_health.retired}`,
    `Taste DNA accuracy: ${tasteAccuracy}`,
    `Top combo: ${topCombo}`,
    `Last DNA refinement: ${result.last_dna_refinement.adjustments.length} adjustments across ${result.last_dna_refinement.considered_feedback} feedback entries`,
  ];

  return `${lines.join("\n")}\n`;
}
