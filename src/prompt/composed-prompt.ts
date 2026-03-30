export interface ComposedPromptMetadata {
  source_language: string;
  corner?: string;
  style_overrides?: Record<string, string>;
  search_queries?: string[];
}

export interface ComposedPrompt {
  raw_intent: string;
  visual_description: string;
  negative_prompt: string;
  engine_format: string;
  metadata: ComposedPromptMetadata;
}
