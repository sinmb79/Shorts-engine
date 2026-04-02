import { createInterface } from "node:readline";

import { refinePromptWithLlm } from "../llm/refine-loop.js";
import {
  buildFormattedOutputs,
  resolveOutputSelection,
  SUPPORTED_OUTPUT_FORMATS,
} from "../output/formatters/index.js";
import { buildPromptResult } from "../prompt/build-prompt-result.js";
import { buildPublishPlan } from "../publish/build-publish-plan.js";
import { persistGeneratedScenario } from "../quality/persist-generated-scenario.js";
import { buildRenderPlan } from "../render/build-render-plan.js";
import { createRequestId } from "../shared/request-id.js";
import { runTasteOnboarding } from "../taste/onboarding.js";
import {
  createBufferedTastePromptSession,
  createReadlineTastePromptSession,
  type TastePromptOption,
} from "../taste/prompt-session.js";
import { loadTasteProfile } from "../taste/profile-manager.js";
import {
  buildRequestFromTemplate,
  getTemplatePreset,
  listTemplatePresets,
} from "../templates/preset-catalog.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
} from "./exit-codes.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";

function createInteractiveInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stderr,
  });
}

async function createInteractiveSession() {
  if (process.stdin.isTTY) {
    const rl = createInteractiveInterface();
    return {
      session: createReadlineTastePromptSession(rl),
      close() {
        rl.close();
      },
    };
  }

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }

  return {
    session: createBufferedTastePromptSession(chunks.join("")),
    close() {
      return;
    },
  };
}

export async function interactiveEngineCommand(
  options: { json: boolean; trend_aware: boolean },
): Promise<{ exitCode: number; output: string }> {
  const promptSession = await createInteractiveSession();

  try {
    let tasteProfile = await loadTasteProfile();
    if (!tasteProfile) {
      promptSession.session.write("\nNo saved taste profile was found. Let's build one first.\n");
      const onboarding = await runTasteOnboarding(promptSession.session);
      tasteProfile = onboarding.profile;
    }

    const templateOptions = listTemplatePresets().map<TastePromptOption>((template) => ({
      value: template.id,
      label: `${template.name} - ${template.description}`,
    }));
    const templateId = await promptSession.session.askChoice(
      "Pick a template to shape the short.",
      templateOptions,
      templateOptions[0]?.value,
    );
    const template = getTemplatePreset(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const topic = await promptSession.session.askText("Topic", {
      defaultValue: template.default_topic,
    });
    const subject = await promptSession.session.askText("Subject", {
      defaultValue: template.default_subject,
    });
    const goal = await promptSession.session.askText("Goal", {
      defaultValue: template.defaults.goal,
    });
    const emotion = await promptSession.session.askText("Emotion", {
      defaultValue: template.defaults.emotion,
    });
    const outputChoice = await promptSession.session.askChoice(
      "Choose your output format.",
      SUPPORTED_OUTPUT_FORMATS.map<TastePromptOption>((format) => ({
        value: format,
        label: format,
      })),
      "human",
    );
    const llmChoice = await promptSession.session.askChoice(
      "Use LLM refinement if a provider is available?",
      [
        { value: "no", label: "No - keep it fully offline" },
        { value: "yes", label: "Yes - refine when possible" },
      ],
      "no",
    );

    const request = buildRequestFromTemplate(templateId, {
      topic,
      subject,
      goal,
      emotion,
    });
    const planningContext = await resolvePlanningContext(request, {
      taste_profile: tasteProfile,
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
      enabled: llmChoice === "yes",
    });
    const renderPlan = buildRenderPlan({
      requestId: createRequestId(request),
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
    const formatted = buildFormattedOutputs(
      {
        planningContext,
        promptResult: refined.promptResult,
        renderPlan,
        publishPlan,
        llmRefinement: refined.summary,
      },
      resolveOutputSelection(outputChoice),
    )[0]!;

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: options.json
        ? JSON.stringify(
            {
              template_id: templateId,
              taste_profile_id: tasteProfile.profile_id,
              request,
              formatted_output: formatted,
            },
            null,
            2,
          )
        : [
            `Template: ${template.name}`,
            `Taste profile: ${tasteProfile.profile_id}`,
            `Output format: ${formatted.format}`,
            "",
            formatted.content,
          ].join("\n") + "\n",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify({ fatal_error: message }, null, 2)
        : `${message}\n`,
    };
  } finally {
    promptSession.close();
  }
}
