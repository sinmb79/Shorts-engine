import type { LlmProvider } from "../provider-types.js";

const DEFAULT_MODEL = "claude-3-5-haiku-latest";
const DEFAULT_BASE_URL = "https://api.anthropic.com";

export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  isAvailable(env = process.env) {
    return Boolean(env.ANTHROPIC_API_KEY || env.SHORTS_ENGINE_TEST_LLM_RESPONSE);
  },
  async generate(input, env = process.env) {
    if (env.SHORTS_ENGINE_TEST_LLM_RESPONSE) {
      return {
        provider: "anthropic",
        content: env.SHORTS_ENGINE_TEST_LLM_RESPONSE,
      };
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured.");
    }

    const response = await fetch(
      `${env.ANTHROPIC_BASE_URL ?? DEFAULT_BASE_URL}/v1/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.SHORTS_ENGINE_ANTHROPIC_MODEL ?? DEFAULT_MODEL,
          max_tokens: 1200,
          system: input.system_prompt,
          messages: [
            {
              role: "user",
              content: input.user_prompt,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Anthropic request failed with ${response.status}.`);
    }

    const payload = await response.json() as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const content = payload.content?.find((item) => item.type === "text")?.text;

    if (!content) {
      throw new Error("Anthropic response did not contain text content.");
    }

    return {
      provider: "anthropic",
      content,
    };
  },
};
