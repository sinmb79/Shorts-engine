import type { ResolvedConfig } from "../config/config-resolver.js";
import type { EngineRequest } from "../domain/contracts.js";

export type VideoRouterEngine =
  | "cache"
  | "local"
  | "kling_free"
  | "veo3"
  | "seedance2"
  | "runway"
  | "ffmpeg_slides";

export interface VideoEngineOption {
  engine: Exclude<VideoRouterEngine, "cache">;
  cost_per_sec: number;
  free_daily_credits: number;
  quality: number;
  has_audio: boolean;
  api_url?: string;
  api_key_env?: string;
}

export const ENGINE_PRIORITY: VideoEngineOption[] = [
  {
    engine: "kling_free",
    cost_per_sec: 0,
    free_daily_credits: 66,
    quality: 5,
    has_audio: true,
    api_key_env: "KLING_API_KEY",
  },
  {
    engine: "veo3",
    cost_per_sec: 0.03,
    free_daily_credits: 0,
    quality: 5,
    has_audio: true,
    api_key_env: "GEMINI_API_KEY",
  },
  {
    engine: "seedance2",
    cost_per_sec: 0.022,
    free_daily_credits: 0,
    quality: 4,
    has_audio: true,
    api_key_env: "FAL_API_KEY",
  },
  {
    engine: "runway",
    cost_per_sec: 0.1,
    free_daily_credits: 0,
    quality: 4,
    has_audio: false,
    api_key_env: "RUNWAY_API_KEY",
  },
  {
    engine: "ffmpeg_slides",
    cost_per_sec: 0,
    free_daily_credits: -1,
    quality: 2,
    has_audio: false,
  },
];

const PAID_ENGINE_ORDER: Array<Exclude<VideoRouterEngine, "cache" | "local" | "ffmpeg_slides">> = [
  "veo3",
  "seedance2",
  "runway",
];

export class SmartVideoRouter {
  private readonly priority: VideoRouterEngine[];

  constructor(priority: VideoRouterEngine[] = ENGINE_PRIORITY.map((option) => option.engine)) {
    this.priority = [...priority];
  }

  selectEngine(
    request: EngineRequest,
    config: ResolvedConfig,
    dailySpent: number,
  ): VideoRouterEngine {
    if (request.backend.preferred_engine === "cache") {
      return "cache";
    }

    if (request.backend.preferred_engine === "local") {
      return "local";
    }

    if (dailySpent >= config.daily_cost_limit_usd) {
      return "ffmpeg_slides";
    }

    if (config.prefer_free_first && this.hasFreeTierRemaining("kling_free")) {
      return "kling_free";
    }

    const preferredEngine = this.normalizePreferredEngine(config.video_engine);
    if (preferredEngine === "local") {
      return preferredEngine;
    }

    if (
      preferredEngine !== null &&
      preferredEngine !== "cache" &&
      this.isAffordable(preferredEngine, request.intent.duration_sec, dailySpent, config)
    ) {
      return preferredEngine;
    }

    for (const engine of PAID_ENGINE_ORDER) {
      if (this.isAffordable(engine, request.intent.duration_sec, dailySpent, config)) {
        return engine;
      }
    }

    return "ffmpeg_slides";
  }

  onFailure(failedEngine: VideoRouterEngine): VideoRouterEngine {
    const currentIndex = this.priority.indexOf(failedEngine);
    if (currentIndex === -1) {
      return "ffmpeg_slides";
    }

    return this.priority[currentIndex + 1] ?? "ffmpeg_slides";
  }

  private hasFreeTierRemaining(engine: Extract<VideoRouterEngine, "kling_free">): boolean {
    const option = ENGINE_PRIORITY.find((candidate) => candidate.engine === engine);
    return option !== undefined && option.free_daily_credits > 0;
  }

  private normalizePreferredEngine(engine: ResolvedConfig["video_engine"]): VideoRouterEngine | null {
    if (engine === "local") {
      return "local";
    }

    if (engine === "kling" || engine === "kling_free") {
      return "kling_free";
    }

    if (engine === "veo3" || engine === "seedance2" || engine === "runway" || engine === "ffmpeg_slides") {
      return engine;
    }

    return null;
  }

  private isAffordable(
    engine: Exclude<VideoRouterEngine, "cache" | "local">,
    durationSec: number,
    dailySpent: number,
    config: ResolvedConfig,
  ): boolean {
    if (engine === "ffmpeg_slides" || engine === "kling_free") {
      return true;
    }

    const option = ENGINE_PRIORITY.find((candidate) => candidate.engine === engine);
    if (!option) {
      return false;
    }

    const estimatedCost = option.cost_per_sec * durationSec;
    return dailySpent + estimatedCost <= config.daily_cost_limit_usd;
  }
}
