import { createFormatterOutput, renderPublishMeta, renderSceneLines } from "./shared.js";
import type { FormatterContext } from "./types.js";

export function formatVeo(context: FormatterContext) {
  const content = [
    "VEO CINEMATIC PROMPT",
    context.promptResult.main_prompt,
    "",
    "SHOT-BY-SHOT INTENT",
    renderSceneLines(context, { includeCamera: true }),
    "",
    "SAFETY / AVOID",
    context.promptResult.negative_prompt,
    "",
    "PUBLISHING",
    renderPublishMeta(context),
  ].join("\n");

  return createFormatterOutput(
    "veo",
    "Veo Cinematic Prompt",
    "Cinematic structure with explicit scene and camera intent for Veo-style prompting.",
    content,
    context,
  );
}
