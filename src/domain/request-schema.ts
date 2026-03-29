import type {
  BudgetTier,
  EngineRequest,
  Platform,
  PreferredEngine,
  QualityTier,
  ValidationResult,
} from "./contracts.js";
import { createEngineError } from "./errors.js";

const SUPPORTED_PLATFORMS = new Set<Platform>([
  "youtube_shorts",
  "tiktok",
  "instagram_reels",
]);
const SUPPORTED_BUDGET_TIERS = new Set<BudgetTier>(["low", "balanced", "high"]);
const SUPPORTED_QUALITY_TIERS = new Set<QualityTier>(["low", "balanced", "premium"]);
const SUPPORTED_ENGINES = new Set<PreferredEngine>([
  "cache",
  "local",
  "gpu",
  "sora",
  "premium",
]);

export function validateEngineRequest(value: unknown): ValidationResult {
  const errors = validateRequest(value);

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateRequest(value: unknown) {
  if (!isRecord(value)) {
    return [
      createEngineError(
        "validation_error",
        "Engine request must be an object.",
        "validate",
      ),
    ];
  }

  const errors = [
    ...validateString(value.version, "version"),
    ...validateIntent(value.intent),
    ...validateConstraints(value.constraints),
    ...validateStyle(value.style),
    ...validateBackend(value.backend),
    ...validateOutput(value.output),
  ];

  return errors;
}

function validateIntent(value: unknown) {
  if (!isRecord(value)) {
    return [missingField("intent")];
  }

  return [
    ...validateString(value.topic, "intent.topic"),
    ...validateString(value.subject, "intent.subject"),
    ...validateString(value.goal, "intent.goal"),
    ...validateString(value.emotion, "intent.emotion"),
    ...validateEnum(value.platform, "intent.platform", SUPPORTED_PLATFORMS),
    ...validateString(value.theme, "intent.theme"),
    ...validateNumber(value.duration_sec, "intent.duration_sec"),
  ];
}

function validateConstraints(value: unknown) {
  if (!isRecord(value)) {
    return [missingField("constraints")];
  }

  return [
    ...validateString(value.language, "constraints.language"),
    ...validateEnum(value.budget_tier, "constraints.budget_tier", SUPPORTED_BUDGET_TIERS),
    ...validateEnum(
      value.quality_tier,
      "constraints.quality_tier",
      SUPPORTED_QUALITY_TIERS,
    ),
    ...validateBoolean(
      value.visual_consistency_required,
      "constraints.visual_consistency_required",
    ),
    ...validateBoolean(value.content_policy_safe, "constraints.content_policy_safe"),
  ];
}

function validateStyle(value: unknown) {
  if (!isRecord(value)) {
    return [missingField("style")];
  }

  return [
    ...validateString(value.hook_type, "style.hook_type"),
    ...validateString(value.pacing_profile, "style.pacing_profile"),
    ...validateString(value.caption_style, "style.caption_style"),
    ...validateString(value.camera_language, "style.camera_language"),
  ];
}

function validateBackend(value: unknown) {
  if (!isRecord(value)) {
    return [missingField("backend")];
  }

  return [
    ...validateEnum(
      value.preferred_engine,
      "backend.preferred_engine",
      SUPPORTED_ENGINES,
    ),
    ...validateBoolean(value.allow_fallback, "backend.allow_fallback"),
  ];
}

function validateOutput(value: unknown) {
  if (!isRecord(value)) {
    return [missingField("output")];
  }

  return validateString(value.type, "output.type");
}

function validateString(value: unknown, field: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return [];
  }

  return [missingField(field)];
}

function validateNumber(value: unknown, field: string) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return [];
  }

  return [missingField(field)];
}

function validateBoolean(value: unknown, field: string) {
  if (typeof value === "boolean") {
    return [];
  }

  return [missingField(field)];
}

function validateEnum<T extends string>(value: unknown, field: string, validValues: Set<T>) {
  if (typeof value === "string" && validValues.has(value as T)) {
    return [];
  }

  return [missingField(field)];
}

function missingField(field: string) {
  return createEngineError(
    "validation_error",
    `Missing or invalid field: ${field}`,
    "validate",
    {
      details: { field },
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isEngineRequest(value: unknown): value is EngineRequest {
  return validateEngineRequest(value).valid;
}
