import { buildAnalysisReport } from "../analyze/build-analysis-report.js";
import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS, EXIT_CODE_VALIDATION_FAILURE } from "./exit-codes.js";
import { loadEngineRequest } from "./load-engine-request.js";
import { loadRuntimeConfig } from "./load-runtime-config.js";
import { renderAnalysisOutput } from "./render-analysis-output.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { renderOutput } from "./render-output.js";

export async function analyzeEngineCommand(
  requestPath: string,
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  try {
    const loaded = await loadEngineRequest(requestPath);

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: renderOutput(
          {
            schema_version: "0.1",
            request_id: loaded.request_id,
            validation: loaded.validation,
            normalized_request: null,
            platform_output_spec: null,
            novel_shorts_plan: null,
            motion_plan: null,
            broll_plan: null,
            learning_state: null,
            scoring: null,
            routing: null,
            execution_plan: null,
            recovery_simulation: null,
          },
          options.json,
        ),
      };
    }

    const runtimeConfig = await loadRuntimeConfig(requestPath, loaded.request);
    const planningContext = resolvePlanningContext(
      loaded.request,
      runtimeConfig.resolved_config,
    );
    const result = buildAnalysisReport({
      requestId: loaded.request_id,
      planningContext,
    });

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderAnalysisOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify(
            {
              fatal_error: error instanceof Error ? error.message : "Unknown error",
            },
            null,
            2,
          )
        : `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
