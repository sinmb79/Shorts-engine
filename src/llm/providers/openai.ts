import type { LlmProvider } from "../provider-types.js";

const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_BASE_URL = "https://api.openai.com";

export const openAiProvider: LlmProvider = {
  name: "openai",
  isAvailable(env = process.env) {
    return Boolean(env.OPENAI_API_KEY || env.SHORTS_ENGINE_TEST_LLM_RESPONSE);
  },
  async generate(input, env = process.env) {
    if (env.SHORTS_ENGINE_TEST_LLM_RESPONSE) {
      return {
        provider: "openai",
        content: env.SHORTS_ENGINE_TEST_LLM_RESPONSE,
      };
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch(
      `${env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: env.SHORTS_ENGINE_OPENAI_MODEL ?? DEFAULT_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system_prompt },
            { role: "user", content: input.user_prompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}.`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI response did not contain content.");
    }

    return {
      provider: "openai",
      content,
    };
  },
};
