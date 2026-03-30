import { preprocessKorean } from "./korean-preprocessor.js";
import { sentenceToVisualQueries } from "./visual-vocabulary.js";
import type { ComposedPrompt } from "./composed-prompt.js";

export interface SearchQueryComposerInput {
  sentence: string;
  engine?: string;
  count?: number;
  source_language?: string;
}

export function composeSearchQuery(
  input: SearchQueryComposerInput,
): ComposedPrompt {
  const sourceLanguage = input.source_language ?? detectSourceLanguage(input.sentence);
  const normalizedSentence =
    sourceLanguage === "ko" ? preprocessKorean(input.sentence) : input.sentence.trim();
  const queries = sentenceToVisualQueries(normalizedSentence, input.count ?? 3);

  return {
    raw_intent: normalizedSentence,
    visual_description: queries.join(", "),
    negative_prompt: "",
    engine_format: input.engine ?? "pexels",
    metadata: {
      source_language: sourceLanguage,
      search_queries: queries,
    },
  };
}

function detectSourceLanguage(sentence: string): string {
  return /[가-힣]/u.test(sentence) ? "ko" : "en";
}
