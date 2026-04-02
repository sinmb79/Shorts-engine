import type {
  NormalizedRequest,
  PlatformOutputSpec,
  PromptResult,
  PublishPlan,
  RenderPlan,
  ScenarioPlan,
} from "../domain/contracts.js";
import { createRequestId } from "../shared/request-id.js";
import type { TrendContext } from "../trends/trend-radar.js";

export function buildPublishPlan(input: {
  effectiveRequest: NormalizedRequest;
  platformOutputSpec: PlatformOutputSpec;
  promptResult: PromptResult;
  renderPlan: RenderPlan;
  scenarioPlan: ScenarioPlan;
  trendContext?: TrendContext | null;
}): PublishPlan {
  const {
    effectiveRequest,
    platformOutputSpec,
    promptResult,
    renderPlan,
    scenarioPlan,
    trendContext,
  } = input;

  return {
    schema_version: "0.1",
    publish_id: createRequestId({ render_id: renderPlan.render_id, command: "publish" }),
    platform: platformOutputSpec.platform,
    title: effectiveRequest.base.intent.topic,
    description: [
      effectiveRequest.base.intent.goal,
      `Story: ${scenarioPlan.summary}`,
      `Theme: ${effectiveRequest.base.intent.theme}`,
      `Hook: ${renderPlan.segments[0]?.caption_text || renderPlan.segments[0]?.motion || "n/a"}`,
    ].join(" | "),
    hashtags: buildHashtags(effectiveRequest, trendContext ?? null),
    cta: buildCta(platformOutputSpec.platform),
    upload_checklist: [
      "review_cover_frame",
      "verify_safe_zone",
      "confirm_caption_timing",
      "attach_platform_metadata",
    ],
    warnings: [...promptResult.warnings, ...(trendContext?.warnings ?? [])],
  };
}

function buildHashtags(
  effectiveRequest: NormalizedRequest,
  trendContext: TrendContext | null,
): string[] {
  const themeTag = toHashtag(effectiveRequest.base.intent.theme);
  const platformTag = toHashtag(effectiveRequest.base.intent.platform);
  const topicTag = toHashtag(effectiveRequest.base.intent.topic.split(" ").slice(0, 2).join(" "));

  return [themeTag, platformTag, topicTag, ...(trendContext?.hashtags ?? [])].filter(
    (value, index, all) => Boolean(value) && all.indexOf(value) === index,
  );
}

function toHashtag(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

  return normalized ? `#${normalized}` : "#shorts";
}

function buildCta(platform: PlatformOutputSpec["platform"]): string {
  if (platform === "tiktok") {
    return "Follow for the full story.";
  }

  if (platform === "instagram_reels") {
    return "Save this reel for later.";
  }

  return "Watch the full short for more.";
}
