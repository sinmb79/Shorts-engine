import { createFormatterOutput, renderPublishMeta, renderRenderSegments } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatKling(context: FormatterContext) {
  const content = [
    "KLING MASTER PROMPT",
    context.promptResult.main_prompt,
    "",
    "NEGATIVE",
    context.promptResult.negative_prompt,
    "",
    "SHOT PLAN",
    renderRenderSegments(context),
    "",
    "NOTES",
    `Style descriptor: ${context.promptResult.style_descriptor}`,
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "kling",
    "Kling Copy-Ready Prompt",
    "Compact tool-facing prompt bundle tuned for Kling workflows.",
    content,
    context,
  );
}
