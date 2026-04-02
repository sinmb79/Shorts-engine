import { createFormatterOutput, renderPublishMeta, renderSceneLines } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatHuman(context: FormatterContext) {
  const content = [
    `Build a ${context.planningContext.platform_output_spec.effective_duration_sec}-second ${context.planningContext.platform_output_spec.platform} short that feels like ${context.planningContext.scenario_plan.summary}.`,
    "",
    "Tell the story in four beats:",
    renderSceneLines(context, { includeCaptions: true, includeCamera: true }),
    "",
    "Use this creative spine:",
    `Style: ${context.promptResult.style_descriptor}`,
    `Avoid: ${context.promptResult.negative_prompt}`,
    "",
    "Finish with:",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "human",
    "Human Director Brief",
    "Readable creative brief for editors, directors, and collaborators.",
    content,
    context,
  );
}
