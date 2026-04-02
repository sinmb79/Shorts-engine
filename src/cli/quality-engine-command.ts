import { buildQualityDashboard } from "../quality/quality-dashboard.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
} from "./exit-codes.js";
import { renderQualityOutput } from "./render-quality-output.js";

export async function qualityEngineCommand(
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  try {
    const result = await buildQualityDashboard();
    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderQualityOutput(result, options.json),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify({ fatal_error: message }, null, 2)
        : `${message}\n`,
    };
  }
}
