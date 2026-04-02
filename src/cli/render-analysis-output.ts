import type { AnalyzeResult } from "../domain/contracts.js";

export function renderAnalysisOutput(result: AnalyzeResult, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Request ID: ${result.request_id}`,
    `Recommended backend: ${result.recommended_backend}`,
    `Quality gate: ${result.quality_gate.pass ? "pass" : "retry"} (${result.quality_gate.overall_score}/100)`,
    `Warnings: ${result.warning_count}`,
    `Render ready: ${result.readiness.render ? "yes" : "no"}`,
    `Publish ready: ${result.readiness.publish ? "yes" : "no"}`,
  ];

  return `${lines.join("\n")}\n`;
}
