import type {
  BudgetTier,
  EngineRequest,
  Platform,
  QualityTier,
} from "../domain/contracts.js";

export type VideoEngineName =
  | "local"
  | "sora"
  | "kling"
  | "kling_free"
  | "veo3"
  | "seedance2"
  | "runway"
  | "ffmpeg_slides";

export type TtsEngineName =
  | "openai"
  | "elevenlabs"
  | "google_cloud"
  | "edge"
  | "gtts"
  | "local";

export interface EngineProviderOption {
  [key: string]: string | number | boolean | null | undefined;
}

export interface EngineConfigDefaults {
  language?: string;
  platform?: Platform;
  caption_template?: string;
  video_engine?: VideoEngineName;
  gpu_engine?: VideoEngineName;
  premium_engine?: VideoEngineName;
}

export interface SmartRouterDefaults {
  daily_cost_limit_usd?: number;
  prefer_free_first?: boolean;
  fallback?: string;
}

export interface TtsConfig {
  provider: TtsEngineName | string;
  options: Record<string, EngineProviderOption>;
}

export interface VideoGenerationConfig {
  provider: string;
  defaults?: EngineConfigDefaults;
  options: Record<string, EngineProviderOption & SmartRouterDefaults>;
}

export interface EngineConfig {
  _comment?: string;
  _updated?: string;
  tts: TtsConfig;
  video_generation: VideoGenerationConfig;
  defaults?: EngineConfigDefaults;
  optional_keys?: Record<string, string>;
}

export interface ShortsConfig {
  enabled: boolean;
  schedule: {
    frequency: string;
    times: string[];
    max_per_day: number;
  };
  input_dirs: Record<string, string>;
  assets: {
    characters?: Record<string, Record<string, string>>;
    corner_character_map?: Record<string, string>;
    character_overlay?: Record<string, string | number | boolean>;
  };
}

export interface PromptStyleDefinition {
  caption_template: string;
  color_palette: string[];
  video_style: string;
  motion_preference: string[];
  tone: string;
}

export interface PromptStylesConfig {
  _comment?: string;
  _updated?: string;
  corners: Record<string, PromptStyleDefinition>;
  default: PromptStyleDefinition;
}

export interface UserProfileDefaults {
  language?: string;
  platform?: Platform;
  video_engine?: VideoEngineName;
  tts_engine?: TtsEngineName;
  caption_template?: string;
}

export interface UserProfileBudget {
  daily_cost_limit_usd?: number;
  prefer_free_first?: boolean;
}

export interface UserProfile {
  budget?: UserProfileBudget;
  defaults?: UserProfileDefaults;
  created_at?: string | null;
}

export interface ResolvedConfig {
  video_engine: VideoEngineName;
  tts_engine: TtsEngineName | string;
  caption_template: string;
  budget_tier: BudgetTier;
  quality_tier: QualityTier;
  daily_cost_limit_usd: number;
  prefer_free_first: boolean;
  language: string;
  platform: Platform;
}

function toVideoEngineName(
  preferredEngine: EngineRequest["backend"]["preferred_engine"],
  defaults: EngineConfigDefaults | undefined,
  userDefaults: UserProfileDefaults | undefined,
): VideoEngineName {
  switch (preferredEngine) {
    case "local":
      return "local";
    case "sora":
      return userDefaults?.video_engine ?? defaults?.premium_engine ?? "veo3";
    case "gpu":
      return userDefaults?.video_engine ?? defaults?.gpu_engine ?? "runway";
    case "premium":
      return userDefaults?.video_engine ?? defaults?.premium_engine ?? "veo3";
    case "cache":
    default:
      return userDefaults?.video_engine ?? defaults?.video_engine ?? "local";
  }
}

export function resolveConfig(
  request: EngineRequest,
  userProfile: UserProfile,
  engineConfig: EngineConfig,
): ResolvedConfig {
  const engineDefaults = engineConfig.video_generation.defaults ?? engineConfig.defaults;
  const userDefaults = userProfile.defaults;
  const smartRouter =
    engineConfig.video_generation.options["smart_router"] ?? {};

  return {
    video_engine: toVideoEngineName(
      request.backend.preferred_engine,
      engineDefaults,
      userDefaults,
    ),
    tts_engine: userDefaults?.tts_engine ?? engineConfig.tts.provider ?? "openai",
    caption_template:
      request.style.caption_style ??
      userDefaults?.caption_template ??
      engineDefaults?.caption_template ??
      "tiktok_viral",
    budget_tier: request.constraints.budget_tier,
    quality_tier: request.constraints.quality_tier,
    daily_cost_limit_usd:
      userProfile.budget?.daily_cost_limit_usd ??
      smartRouter.daily_cost_limit_usd ??
      0.5,
    prefer_free_first:
      userProfile.budget?.prefer_free_first ??
      smartRouter.prefer_free_first ??
      true,
    language:
      request.constraints.language ??
      userDefaults?.language ??
      engineDefaults?.language ??
      "ko",
    platform:
      request.intent.platform ??
      userDefaults?.platform ??
      engineDefaults?.platform ??
      "youtube_shorts",
  };
}
