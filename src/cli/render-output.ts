import type { EngineRunResult } from "../domain/contracts.js";

export function renderOutput(result: EngineRunResult, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Request ID: ${result.request_id}`,
    `Validation: ${result.validation.valid ? "valid" : "invalid"}`,
    `Selected backend: ${result.routing?.selected_backend ?? "n/a"}`,
    `Fallback backend: ${result.routing?.fallback_backend ?? "n/a"}`,
    `Reason codes: ${result.routing?.reason_codes.join(", ") ?? "n/a"}`,
    `Normal path: ${result.recovery_simulation?.normal_path.join(" -> ") ?? "n/a"}`,
    `Recovery paths: ${result.recovery_simulation?.recovery_paths.length ?? 0}`,
  ];

  return `${lines.join("\n")}\n`;
}
