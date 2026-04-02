import { createFormatterOutput, renderPublishMeta, renderSceneLines } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatGeneric(context: FormatterContext) {
  const content = [
    "Main Prompt:",
    context.promptResult.main_prompt,
    "",
    "Negative Prompt:",
    context.promptResult.negative_prompt,
    "",
    "Style Descriptor:",
    context.promptResult.style_descriptor,
    "",
    "Scene Breakdown:",
    renderSceneLines(context, { includeCaptions: true }),
    "",
    "Publish Metadata:",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "generic",
    "Generic Prompt Package",
    "Balanced internal format for review, copy, or handoff.",
    content,
    context,
  );
}
