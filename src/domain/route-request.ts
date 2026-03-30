import type {
  NormalizedRequest,
  PremiumAllowedStep,
  PreferredEngine,
  RoutingDecision,
  ScoringResult,
} from "./contracts.js";
import type { ResolvedConfig } from "../config/config-resolver.js";
import {
  SmartVideoRouter,
  type VideoRouterEngine,
} from "../routing/smart-video-router.js";

export function routeRequest(
  request: NormalizedRequest,
  scoring: ScoringResult,
  resolvedConfig: ResolvedConfig,
): RoutingDecision {
  const reasonCodes: string[] = [];
  const allowFallback = request.base.backend.allow_fallback;

  if (request.base.backend.preferred_engine === "cache") {
    reasonCodes.push("cache_hit");

    return {
      selected_backend: "cache",
      fallback_backend: allowFallback ? "local" : null,
      premium_allowed: false,
      premium_allowed_steps: [],
      reason_codes: reasonCodes,
    };
  }

  const premiumAllowed =
    request.derived.premium_allowed && scoring.candidate_score >= 0.6;

  if (!premiumAllowed) {
    reasonCodes.push("candidate_score_below_premium_threshold");
  }

  const { batch_size, gpu_available } = request.base.backend;
  const ruleCTriggered =
    typeof batch_size === "number" &&
    batch_size >= 5 &&
    gpu_available === true;

  let selectedBackend: RoutingDecision["selected_backend"];

  if (ruleCTriggered) {
    selectedBackend = "gpu";
    reasonCodes.push("batch_gpu_preferred");
  } else if (
    !premiumAllowed &&
    (request.base.backend.preferred_engine === "sora" ||
      request.base.backend.preferred_engine === "premium")
  ) {
    selectedBackend = "local";
    reasonCodes.push("local_backend_available");
  } else {
    const router = new SmartVideoRouter();
    const selectedEngine = router.selectEngine(
      request.base,
      resolvedConfig,
      0,
    );

    selectedBackend = mapSelectedEngineToBackend(
      selectedEngine,
      request.base.backend.preferred_engine,
    );
    reasonCodes.push(`video_engine_selected:${selectedEngine}`);

    if (selectedBackend === "local") {
      reasonCodes.push("local_backend_available");
    } else if (selectedBackend === "premium") {
      reasonCodes.push("premium_allowed_for_final_value_steps");
    }
  }

  const premiumAllowedSteps: PremiumAllowedStep[] = premiumAllowed
    ? ["final_script_refinement", "premium_tts", "high_value_video_generation", "final_polish"]
    : [];

  return {
    selected_backend: selectedBackend,
    fallback_backend: allowFallback ? chooseFallbackBackend(selectedBackend) : null,
    premium_allowed: premiumAllowed,
    premium_allowed_steps: premiumAllowedSteps,
    reason_codes: reasonCodes,
  };
}

function mapSelectedEngineToBackend(
  selectedEngine: VideoRouterEngine,
  preferredEngine: PreferredEngine,
): RoutingDecision["selected_backend"] {
  if (selectedEngine === "cache") {
    return "cache";
  }

  if (selectedEngine === "local" || selectedEngine === "ffmpeg_slides") {
    return "local";
  }

  if (preferredEngine === "gpu") {
    return "gpu";
  }

  return "premium";
}

function chooseFallbackBackend(
  selectedBackend: RoutingDecision["selected_backend"],
): Exclude<RoutingDecision["fallback_backend"], null> {
  // "gpu" here covers both explicit gpu preference and Rule C batch override.
  if (selectedBackend === "cache" || selectedBackend === "gpu") {
    return "local";
  }

  return "gpu";
}
