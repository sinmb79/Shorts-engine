import type { FormattedOutput, FormatterContext, OutputFormatName } from "./types.js";

export function renderSceneLines(
  context: FormatterContext,
  options: { includeCaptions?: boolean; includeCamera?: boolean } = {},
): string {
  return context.planningContext.scenario_plan.scenes
    .map((scene, index) => {
      const parts = [
        `${index + 1}. ${scene.role.toUpperCase()} - ${scene.scenario_text_en}`,
        `Prompt: ${scene.ai_prompt_fragment}`,
      ];

      if (options.includeCaptions) {
        parts.push(`Caption: ${scene.caption_text}`);
      }

      if (options.includeCamera) {
        parts.push(`Camera: ${scene.camera_cues.join(", ") || "n/a"}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");
}

export function renderRenderSegments(context: FormatterContext): string {
  return context.renderPlan.segments
    .map((segment, index) => {
      return `${index + 1}. ${segment.segment_id} | ${segment.duration_sec}s | ${segment.motion} | ${segment.broll_concept} | ${segment.caption_text}`;
    })
    .join("\n");
}

export function renderPublishMeta(context: FormatterContext): string {
  return [
    `Title: ${context.publishPlan.title}`,
    `Description: ${context.publishPlan.description}`,
    `Hashtags: ${context.publishPlan.hashtags.join(" ")}`,
    `CTA: ${context.publishPlan.cta}`,
  ].join("\n");
}

export function createFormatterOutput(
  format: OutputFormatName,
  title: string,
  description: string,
  content: string,
  context: FormatterContext,
): FormattedOutput {
  return {
    format,
    title,
    description,
    content,
    copy_ready: true,
    metadata: {
      scenario_id: context.planningContext.scenario_plan.scenario_id,
      platform: context.planningContext.platform_output_spec.platform,
      duration_sec: context.planningContext.platform_output_spec.effective_duration_sec,
      hashtags: [...context.publishPlan.hashtags],
      warnings: [...context.promptResult.warnings],
      llm_status: context.llmRefinement?.status ?? "offline",
    },
  };
}
