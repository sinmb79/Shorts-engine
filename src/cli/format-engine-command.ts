import { refinePromptWithLlm } from "../llm/refine-loop.js";
import {
  buildFormattedOutputs,
  resolveOutputSelection,
} from "../output/formatters/index.js";
import { buildPromptResult } from "../prompt/build-prompt-result.js";
import { buildPublishPlan } from "../publish/build-publish-plan.js";
import { persistGeneratedScenario } from "../quality/persist-generated-scenario.js";
import { buildRenderPlan } from "../render/build-render-plan.js";
import { createRequestId } from "../shared/request-id.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import { loadEngineRequest } from "./load-engine-request.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";

export async function formatEngineCommand(
  requestPath: string,
  options: {
    json: boolean;
    llm: boolean;
    provider: string | null;
    output: string | null;
    trend_aware: boolean;
  },
): Promise<{ exitCode: number; output: string }> {
  try {
    const loaded = await loadEngineRequest(requestPath);
    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: `Validation failed: ${loaded.validation.errors.map((error) => error.message).join(", ")}\n`,
      };
    }

    const selection = resolveOutputSelection(options.output);
    const planningContext = await resolvePlanningContext(loaded.request, {
      trend_aware: options.trend_aware,
    });
    await persistGeneratedScenario(planningContext);

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
      enabled: options.llm,
      provider: options.provider,
    });
    const renderPlan = buildRenderPlan({
      requestId: createRequestId(loaded.request),
      brollPlan: planningContext.broll_plan,
      effectiveRequest: planningContext.effective_request,
      motionPlan: planningContext.motion_plan,
      promptResult: refined.promptResult,
      routing: planningContext.routing,
      platformOutputSpec: planningContext.platform_output_spec,
      scenarioPlan: planningContext.scenario_plan,
    });
    const publishPlan = buildPublishPlan({
      effectiveRequest: planningContext.effective_request,
      platformOutputSpec: planningContext.platform_output_spec,
      promptResult: refined.promptResult,
      renderPlan,
      scenarioPlan: planningContext.scenario_plan,
      trendContext: planningContext.trend_context,
    });
    const outputs = buildFormattedOutputs(
      {
        planningContext,
        promptResult: refined.promptResult,
        renderPlan,
        publishPlan,
        llmRefinement: refined.summary,
      },
      selection,
    );

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderFormattedOutputs(outputs, options.json),
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

function renderFormattedOutputs(
  outputs: ReturnType<typeof buildFormattedOutputs>,
  json: boolean,
): string {
  if (json) {
    return JSON.stringify(outputs.length === 1 ? outputs[0] : outputs, null, 2);
  }

  return `${outputs
    .map((output) => {
      return [
        `[${output.format}] ${output.title}`,
        output.description,
        "",
        output.content,
      ].join("\n");
    })
    .join("\n\n")}\n`;
}
