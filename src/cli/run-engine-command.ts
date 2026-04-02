import type { EngineRunResult } from "../domain/contracts.js";
import { refinePromptWithLlm } from "../llm/refine-loop.js";
import { buildPromptResult } from "../prompt/build-prompt-result.js";
import { persistGeneratedScenario } from "../quality/persist-generated-scenario.js";
import { createRequestId } from "../shared/request-id.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import { loadEngineRequest } from "./load-engine-request.js";
import { renderOutput } from "./render-output.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function runEngineCommand(
  requestPath: string,
  options: {
    json: boolean;
    simulate: boolean;
    llm: boolean;
    provider: string | null;
    trend_aware: boolean;
  },
): Promise<{ exitCode: number; output: string }> {
  let requestId = createRequestId({ request_path: requestPath });

  try {
    const loaded = await loadEngineRequest(requestPath);
    requestId = loaded.request_id;

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: renderOutput(
          createRunResult(
            requestId,
            isRecord(loaded.raw_request) && typeof loaded.raw_request["version"] === "string"
              ? loaded.raw_request["version"]
              : "0.1",
            loaded.validation,
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
            null,
            null,
            null,
            null,
          ),
          options.json,
        ),
      };
    }

    const planningContext = await resolvePlanningContext(loaded.request, {
      trend_aware: options.trend_aware,
    });
    await persistGeneratedScenario(planningContext);
    let llmRefinement: EngineRunResult["llm_refinement"] = null;

    if (options.llm) {
      const basePrompt = buildPromptResult({
        brollPlan: planningContext.broll_plan,
        effectiveRequest: planningContext.effective_request,
        learningState: planningContext.learning_state,
        motionPlan: planningContext.motion_plan,
        novelShortsPlan: planningContext.novel_shorts_plan,
        platformOutputSpec: planningContext.platform_output_spec,
        qualityGate: planningContext.quality_gate,
        routing: planningContext.routing,
        scenarioPlan: planningContext.scenario_plan,
        scoring: planningContext.scoring,
        styleResolution: planningContext.style_resolution,
        trendContext: planningContext.trend_context,
      });
      const refined = await refinePromptWithLlm(planningContext, basePrompt, {
        enabled: true,
        provider: options.provider,
      });
      llmRefinement = refined.summary;
    }

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderOutput(
        createRunResult(
          requestId,
          loaded.request.version,
          loaded.validation,
          planningContext.normalized_request,
          planningContext.style_resolution,
          planningContext.scenario_plan,
          planningContext.quality_gate,
          llmRefinement,
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
  styleResolution: EngineRunResult["style_resolution"],
  scenarioPlan: EngineRunResult["scenario_plan"],
  qualityGate: EngineRunResult["quality_gate"],
  llmRefinement: EngineRunResult["llm_refinement"],
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
    style_resolution: styleResolution,
    scenario_plan: scenarioPlan,
    quality_gate: qualityGate,
    llm_refinement: llmRefinement,
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
