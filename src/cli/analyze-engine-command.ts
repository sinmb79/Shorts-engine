import { buildAnalysisReport } from "../analyze/build-analysis-report.js";
import { persistGeneratedScenario } from "../quality/persist-generated-scenario.js";
import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS, EXIT_CODE_VALIDATION_FAILURE } from "./exit-codes.js";
import { loadEngineRequest } from "./load-engine-request.js";
import { renderAnalysisOutput } from "./render-analysis-output.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { renderOutput } from "./render-output.js";

export async function analyzeEngineCommand(
  requestPath: string,
  options: { json: boolean; trend_aware: boolean },
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
            style_resolution: null,
            scenario_plan: null,
            quality_gate: null,
            llm_refinement: null,
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

    const planningContext = await resolvePlanningContext(loaded.request, {
      trend_aware: options.trend_aware,
    });
    await persistGeneratedScenario(planningContext);
    const result = buildAnalysisReport({
      requestId: loaded.request_id,
      learningState: planningContext.learning_state,
      motionPlan: planningContext.motion_plan,
      platformOutputSpec: planningContext.platform_output_spec,
      qualityGate: planningContext.quality_gate,
      routing: planningContext.routing,
      scoring: planningContext.scoring,
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
