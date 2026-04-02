import { createFormatterOutput, renderPublishMeta, renderSceneLines } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatRunway(context: FormatterContext) {
  const content = [
    "RUNWAY DIRECTOR PROMPT",
    context.promptResult.main_prompt,
    "",
    "STYLE",
    context.promptResult.style_descriptor,
    "",
    "SCENES",
    renderSceneLines(context, { includeCaptions: true }),
    "",
    "NEGATIVE",
    context.promptResult.negative_prompt,
    "",
    "DELIVERY",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "runway",
    "Runway Director Prompt",
    "Scene-forward format shaped for Runway-style prompt workflows.",
    content,
    context,
  );
}
