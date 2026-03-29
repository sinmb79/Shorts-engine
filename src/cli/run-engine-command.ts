import type { EngineRunResult } from "../domain/contracts.js";
import { createRequestId } from "../shared/request-id.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import { loadEngineRequest } from "./load-engine-request.js";
import { renderOutput } from "./render-output.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";

export async function runEngineCommand(
  requestPath: string,
  options: { json: boolean; simulate: boolean },
): Promise<{ exitCode: number; output: string }> {
  let requestId = createRequestId({ request_path: requestPath });

  try {
    const loaded = await loadEngineRequest(requestPath);
    requestId = loaded.request_id;

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: renderOutput(
          createRunResult(requestId, "0.1", loaded.validation, null, null, null, null, null, null, null, null, null, null),
          options.json,
        ),
      };
    }

    const planningContext = resolvePlanningContext(loaded.request);

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderOutput(
        createRunResult(
          requestId,
          loaded.request.version,
          loaded.validation,
          planningContext.normalized_request,
          planningContext.platform_output_spec,
          planningContext.novel_shorts_plan,
          planningContext.motion_plan,
          planningContext.broll_plan,
          planningContext.learning_state,
          planningContext.scoring,
          planningContext.routing,
          planningContext.execution_plan,
          planningContext.recovery_simulation,
        ),
        options.json,
      ),
    };
  } catch (error) {
    const result = createRunResult(
      requestId,
      "0.1",
      {
        valid: false,
        errors: [],
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );

    const output = options.json
      ? JSON.stringify(
          {
            ...result,
            fatal_error: error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2,
        )
      : `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`;

    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output,
    };
  }
}

function createRunResult(
  requestId: string,
  schemaVersion: string,
  validation: EngineRunResult["validation"],
  normalizedRequest: EngineRunResult["normalized_request"],
  platformOutputSpec: EngineRunResult["platform_output_spec"],
  novelShortsPlan: EngineRunResult["novel_shorts_plan"],
  motionPlan: EngineRunResult["motion_plan"],
  brollPlan: EngineRunResult["broll_plan"],
  learningState: EngineRunResult["learning_state"],
  scoring: EngineRunResult["scoring"],
  routing: EngineRunResult["routing"],
  executionPlan: EngineRunResult["execution_plan"],
  recoverySimulation: EngineRunResult["recovery_simulation"],
): EngineRunResult {
  return {
    schema_version: schemaVersion,
    request_id: requestId,
    validation,
    normalized_request: normalizedRequest,
    platform_output_spec: platformOutputSpec,
    novel_shorts_plan: novelShortsPlan,
    motion_plan: motionPlan,
    broll_plan: brollPlan,
    learning_state: learningState,
    scoring,
    routing,
    execution_plan: executionPlan,
    recovery_simulation: recoverySimulation,
  };
}
