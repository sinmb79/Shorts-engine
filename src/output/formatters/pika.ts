import { createFormatterOutput, renderPublishMeta, renderRenderSegments } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatPika(context: FormatterContext) {
  const content = [
    "PIKA SHORT PROMPT",
    context.promptResult.main_prompt,
    "",
    "MOTION CUES",
    renderRenderSegments(context),
    "",
    "STYLE CUES",
    context.promptResult.style_descriptor,
    "",
    "NEGATIVE",
    context.promptResult.negative_prompt,
    "",
    "SOCIAL PACK",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "pika",
    "Pika Motion Prompt",
    "Motion-emphasized prompt package for Pika-style generation passes.",
    content,
    context,
  );
}
