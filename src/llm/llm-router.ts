import type { LlmProviderName } from "../domain/contracts.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { ollamaProvider } from "./providers/ollama.js";
import { openAiProvider } from "./providers/openai.js";
import type { LlmProvider } from "./provider-types.js";

const PROVIDERS: Record<LlmProviderName, LlmProvider> = {
  openai: openAiProvider,
  anthropic: anthropicProvider,
  ollama: ollamaProvider,
};

export function resolveLlmProvider(
  env: NodeJS.ProcessEnv = process.env,
  preferredProvider?: string | null,
): LlmProvider | null {
  const explicitProvider = normalizeProviderName(preferredProvider);
  if (explicitProvider) {
    const provider = PROVIDERS[explicitProvider];
    return provider.isAvailable(env) ? provider : null;
  }

  if (openAiProvider.isAvailable(env)) {
    return openAiProvider;
  }

  if (anthropicProvider.isAvailable(env)) {
    return anthropicProvider;
  }

  if (ollamaProvider.isAvailable(env)) {
    return ollamaProvider;
  }

  return null;
}

function normalizeProviderName(value?: string | null): LlmProviderName | null {
  if (value === "openai" || value === "anthropic" || value === "ollama") {
    return value;
  }

  return null;
}
