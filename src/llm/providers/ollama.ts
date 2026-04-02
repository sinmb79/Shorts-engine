import type { LlmProvider } from "../provider-types.js";

const DEFAULT_MODEL = "llama3.1";
const DEFAULT_BASE_URL = "http://127.0.0.1:11434";

export const ollamaProvider: LlmProvider = {
  name: "ollama",
  isAvailable(env = process.env) {
    return Boolean(env.OLLAMA_HOST || env.SHORTS_ENGINE_TEST_LLM_RESPONSE);
  },
  async generate(input, env = process.env) {
    if (env.SHORTS_ENGINE_TEST_LLM_RESPONSE) {
      return {
        provider: "ollama",
        content: env.SHORTS_ENGINE_TEST_LLM_RESPONSE,
      };
    }

    const response = await fetch(
      `${env.OLLAMA_HOST ?? DEFAULT_BASE_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.SHORTS_ENGINE_OLLAMA_MODEL ?? DEFAULT_MODEL,
          prompt: `${input.system_prompt}\n\n${input.user_prompt}`,
          stream: false,
          format: "json",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Ollama request failed with ${response.status}.`);
    }

    const payload = await response.json() as { response?: string };
    if (!payload.response) {
      throw new Error("Ollama response did not contain text.");
    }

    return {
      provider: "ollama",
      content: payload.response,
    };
  },
};
