import type { LlmProviderName } from "../domain/contracts.js";

export interface LlmGenerateInput {
  system_prompt: string;
  user_prompt: string;
}

export interface LlmGenerateResult {
  provider: LlmProviderName;
  content: string;
}

export interface LlmProvider {
  name: LlmProviderName;
  isAvailable(env?: NodeJS.ProcessEnv): boolean;
  generate(input: LlmGenerateInput, env?: NodeJS.ProcessEnv): Promise<LlmGenerateResult>;
}
