import type { EngineRunResult } from "../domain/contracts.js";

export function renderOutput(result: EngineRunResult, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Request ID: ${result.request_id}`,
    `Validation: ${result.validation.valid ? "valid" : "invalid"}`,
    `Scenario ID: ${result.scenario_plan?.scenario_id ?? "n/a"}`,
    `Style source: ${result.style_resolution?.source ?? "n/a"}`,
    `Taste profile: ${result.style_resolution?.taste_profile_id ?? "n/a"}`,
    `Scenario summary: ${result.scenario_plan?.summary ?? "n/a"}`,
    `Quality gate: ${result.quality_gate ? `${result.quality_gate.overall_score}/100` : "n/a"}`,
    `LLM refine: ${result.llm_refinement ? `${result.llm_refinement.status}${result.llm_refinement.provider ? ` (${result.llm_refinement.provider})` : ""}` : "offline"}`,
    `Platform: ${result.platform_output_spec?.platform ?? "n/a"}`,
    `Effective duration: ${result.platform_output_spec?.effective_duration_sec ?? "n/a"}${result.platform_output_spec ? "s" : ""}`,
    `Warnings: ${result.platform_output_spec?.warnings.length ?? 0}`,
    `Selected backend: ${result.routing?.selected_backend ?? "n/a"}`,
    `Fallback backend: ${result.routing?.fallback_backend ?? "n/a"}`,
    `Reason codes: ${result.routing?.reason_codes.join(", ") ?? "n/a"}`,
    `Normal path: ${result.recovery_simulation?.normal_path.join(" -> ") ?? "n/a"}`,
    `Recovery paths: ${result.recovery_simulation?.recovery_paths.length ?? 0}`,
  ];

  return `${lines.join("\n")}\n`;
}
