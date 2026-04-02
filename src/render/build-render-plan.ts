import type {
  BrollPlan,
  NormalizedRequest,
  MotionPlan,
  PlatformOutputSpec,
  PromptResult,
  RenderPlan,
  RoutingDecision,
  ScenarioPlan,
} from "../domain/contracts.js";
import { createRequestId } from "../shared/request-id.js";

export function buildRenderPlan(input: {
  requestId: string;
  brollPlan: BrollPlan;
  effectiveRequest: NormalizedRequest;
  motionPlan: MotionPlan;
  promptResult: PromptResult;
  routing: RoutingDecision;
  platformOutputSpec: PlatformOutputSpec;
  scenarioPlan: ScenarioPlan;
}): RenderPlan {
  const {
    requestId,
    brollPlan,
    effectiveRequest,
    motionPlan,
    promptResult,
    routing,
    platformOutputSpec,
    scenarioPlan,
  } = input;

  const scenarioByRole = new Map(
    scenarioPlan.scenes.map((scene) => [scene.role, scene] as const),
  );

  return {
    schema_version: "0.1",
    render_id: createRequestId({ requestId, command: "render" }),
    engine: routing.selected_backend,
    output_filename: buildOutputFilename(effectiveRequest, requestId),
    segments: motionPlan.motion_sequence.map((segment, index) => ({
      ...resolveScenarioSegmentFields(segment.segment_id, scenarioByRole),
      segment_id: segment.segment_id,
      duration_sec: segment.duration_sec,
      motion: segment.motion,
      broll_concept: brollPlan.segments[index]?.concept ?? "generic_visual",
    })),
    asset_manifest: {
      prompt_engine: routing.selected_backend,
      caption_style: effectiveRequest.base.style.caption_style,
      camera_language: effectiveRequest.base.style.camera_language,
      placeholder_assets: [
        "primary_scene_prompt",
        "hook_broll_placeholder",
        "body_broll_placeholder",
        "scenario_caption_track",
      ],
    },
    qa_checklist: [
      ...platformOutputSpec.qa_emphasis,
      "caption_safe_zone_verified",
      "hook_alignment_verified",
    ],
    warnings: [...promptResult.warnings],
  };
}

function resolveScenarioSegmentFields(
  segmentId: RenderPlan["segments"][number]["segment_id"],
  scenarioByRole: Map<string, ScenarioPlan["scenes"][number]>,
): Pick<RenderPlan["segments"][number], "caption_text" | "scene_prompt"> {
  const role =
    segmentId === "hook"
      ? "hook"
      : segmentId === "body_1"
        ? "development"
        : segmentId === "body_2"
          ? "twist"
          : "closer";
  const scene = scenarioByRole.get(role);

  return {
    caption_text: scene?.caption_text ?? "",
    scene_prompt: scene?.ai_prompt_fragment ?? "",
  };
}

function buildOutputFilename(
  effectiveRequest: NormalizedRequest,
  requestId: string,
): string {
  const topicSlug = effectiveRequest.base.intent.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `${effectiveRequest.base.intent.platform}-${topicSlug || "short"}-${requestId.slice(0, 8)}.mp4`;
}
