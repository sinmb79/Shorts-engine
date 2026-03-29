import { readFile } from "node:fs/promises";

import type { EngineRequest, EngineRunResult } from "../domain/contracts.js";
import { normalizeRequest } from "../domain/normalize-request.js";
import { routeRequest } from "../domain/route-request.js";
import { scoreRequest } from "../domain/score-request.js";
import { validateEngineRequest } from "../domain/request-schema.js";
import { buildExecutionPlan } from "../simulation/build-execution-plan.js";
import { simulateRecovery } from "../simulation/simulate-recovery.js";
import { createRequestId } from "../shared/request-id.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import { renderOutput } from "./render-output.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function runEngineCommand(
  requestPath: string,
  options: { json: boolean; simulate: boolean },
): Promise<{ exitCode: number; output: string }> {
  let requestId = createRequestId({ request_path: requestPath });

  try {
    const rawFile = await readFile(requestPath, "utf8");
    requestId = createRequestId(rawFile);
    const rawRequest = JSON.parse(rawFile) as unknown;
    requestId = createRequestId(rawRequest);
    const validation = validateEngineRequest(rawRequest);

    if (!validation.valid) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: renderOutput(
          createRunResult(
            requestId,
            isRecord(rawRequest) && typeof rawRequest['version'] === 'string'
              ? rawRequest['version']
              : '0.1',
            validation, null, null, null, null, null
          ),
          options.json,
        ),
      };
    }

    const request = rawRequest as EngineRequest;
    const normalizedRequest = normalizeRequest(request);
    const scoring = scoreRequest(normalizedRequest);
    const routing = routeRequest(normalizedRequest, scoring);
    const executionPlan = buildExecutionPlan(normalizedRequest, routing);
    const recoverySimulation = simulateRecovery(executionPlan);

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderOutput(
        createRunResult(
          requestId,
          request.version,
          validation,
          normalizedRequest,
          scoring,
          routing,
          executionPlan,
          recoverySimulation,
        ),
        options.json,
      ),
    };
  } catch (error) {
    // rawRequest is not in scope here (file read or JSON parse failed),
    // so schema_version cannot be extracted from the request.
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
    scoring,
    routing,
    execution_plan: executionPlan,
    recovery_simulation: recoverySimulation,
  };
}
