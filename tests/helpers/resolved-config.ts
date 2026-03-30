import type { ResolvedConfig } from "../../src/config/config-resolver.js";

export function createResolvedConfig(
  overrides?: Partial<ResolvedConfig>,
): ResolvedConfig {
  return {
    video_engine: "local",
    tts_engine: "openai",
    caption_template: "tiktok_viral",
    budget_tier: "low",
    quality_tier: "balanced",
    daily_cost_limit_usd: 0.5,
    prefer_free_first: true,
    language: "en",
    platform: "youtube_shorts",
    ...overrides,
  };
}
