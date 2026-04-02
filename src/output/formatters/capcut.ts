import { createFormatterOutput, renderPublishMeta, renderRenderSegments } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatCapcut(context: FormatterContext) {
  const content = [
    "CAPCUT EDIT GUIDE",
    `Hook caption: ${context.renderPlan.segments[0]?.caption_text ?? "n/a"}`,
    "",
    "TIMELINE",
    renderRenderSegments(context),
    "",
    "VOICE / TEXT PROMPT",
    context.promptResult.main_prompt,
    "",
    "CLEANUP",
    `Avoid: ${context.promptResult.negative_prompt}`,
    "",
    "UPLOAD META",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "capcut",
    "CapCut Edit Guide",
    "Editing-first structure for manual assembly and caption timing in CapCut.",
    content,
    context,
  );
}
