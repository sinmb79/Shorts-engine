import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type {
  LlmRefinementSummary,
  PromptResult,
} from "../domain/contracts.js";
import { buildLlmRefinementPrompt } from "./prompt-builder.js";
import { resolveLlmProvider } from "./llm-router.js";

export interface RefinePromptOptions {
  enabled: boolean;
  provider?: string | null;
  env?: NodeJS.ProcessEnv;
}

export async function refinePromptWithLlm(
  context: PlanningContext,
  promptResult: PromptResult,
  options: RefinePromptOptions,
): Promise<{ promptResult: PromptResult; summary: LlmRefinementSummary }> {
  if (!options.enabled) {
    return {
      promptResult,
      summary: {
        enabled: false,
        provider: null,
        status: "fallback",
        warnings: [],
        refined_quality_score: null,
      },
    };
  }

  const provider = resolveLlmProvider(options.env, options.provider);
  if (!provider) {
    return {
      promptResult: {
        ...promptResult,
        warnings: [...promptResult.warnings, "llm_unavailable_fell_back_to_offline"],
      },
      summary: {
        enabled: true,
        provider: null,
        status: "unavailable",
        warnings: ["llm_unavailable_fell_back_to_offline"],
        refined_quality_score: promptResult.quality_score,
      },
    };
  }

  try {
    const refinementPrompt = buildLlmRefinementPrompt(context, promptResult);
    const result = await provider.generate(refinementPrompt, options.env);
    const parsed = parseJsonObject(result.content);
    const nextPrompt: PromptResult = {
      ...promptResult,
      main_prompt:
        typeof parsed.main_prompt === "string" && parsed.main_prompt.trim() !== ""
          ? parsed.main_prompt.trim()
          : promptResult.main_prompt,
      negative_prompt:
        typeof parsed.negative_prompt === "string" && parsed.negative_prompt.trim() !== ""
          ? parsed.negative_prompt.trim()
          : promptResult.negative_prompt,
      style_descriptor:
        typeof parsed.style_descriptor === "string" && parsed.style_descriptor.trim() !== ""
          ? parsed.style_descriptor.trim()
          : promptResult.style_descriptor,
      warnings: [...promptResult.warnings, `llm_refined_with_${result.provider}`],
      quality_score: Math.min(1, Number((promptResult.quality_score + 0.08).toFixed(2))),
    };

    return {
      promptResult: nextPrompt,
      summary: {
        enabled: true,
        provider: result.provider,
        status: "refined",
        warnings: [`llm_refined_with_${result.provider}`],
        refined_quality_score: nextPrompt.quality_score,
      },
    };
  } catch (error) {
    const warning = `llm_refinement_failed_${error instanceof Error ? sanitizeErrorLabel(error.message) : "unknown"}`;

    return {
      promptResult: {
        ...promptResult,
        warnings: [...promptResult.warnings, warning],
      },
      summary: {
        enabled: true,
        provider: provider.name,
        status: "error",
        warnings: [warning],
        refined_quality_score: promptResult.quality_score,
      },
    };
  }
}

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("invalid_json");
    }

    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function sanitizeErrorLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "unknown";
}
