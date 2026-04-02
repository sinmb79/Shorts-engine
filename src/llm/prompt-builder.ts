import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { PromptResult } from "../domain/contracts.js";

export interface LlmRefinementPrompt {
  system_prompt: string;
  user_prompt: string;
}

export function buildLlmRefinementPrompt(
  context: PlanningContext,
  promptResult: PromptResult,
): LlmRefinementPrompt {
  const weakestDimensions = context.quality_gate.retry_plan.focus_dimensions.join(", ") || "none";
  const scenes = context.scenario_plan.scenes
    .map((scene) => `${scene.role}: ${scene.scenario_text_en}`)
    .join("\n");

  return {
    system_prompt: [
      "You refine short-form video prompts for generative video systems.",
      "Return strict JSON with keys: main_prompt, negative_prompt, style_descriptor.",
      "Keep the result grounded in the provided scenario structure and platform constraints.",
      "Do not mention JSON or analysis in the output values.",
    ].join(" "),
    user_prompt: [
      `Platform: ${context.platform_output_spec.platform}`,
      `Duration: ${context.platform_output_spec.effective_duration_sec}s`,
      `Style source: ${context.style_resolution.source}`,
      `Scenario summary: ${context.scenario_plan.summary}`,
      `Weakest quality dimensions: ${weakestDimensions}`,
      `Base style descriptor: ${promptResult.style_descriptor}`,
      "Scenario beats:",
      scenes,
      "Base prompt:",
      promptResult.main_prompt,
      "Return improved JSON only.",
    ].join("\n"),
  };
}
