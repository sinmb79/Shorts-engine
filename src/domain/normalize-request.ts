import type { EngineRequest, NormalizedRequest } from "./contracts.js";

const PLATFORM_DEFAULT_DURATIONS = {
  youtube_shorts: 20,
  tiktok: 15,
  instagram_reels: 15,
} as const;

export function normalizeRequest(request: EngineRequest): NormalizedRequest {
  const resolvedDuration = Math.max(
    1,
    request.intent.duration_sec ??
      PLATFORM_DEFAULT_DURATIONS[request.intent.platform],
  );

  return {
    base: {
      ...request,
      intent: {
        ...request.intent,
        topic: request.intent.topic.trim(),
        subject: request.intent.subject.trim(),
        goal: request.intent.goal.trim(),
        emotion: request.intent.emotion.trim(),
        theme: request.intent.theme.trim(),
      },
      constraints: {
        ...request.constraints,
        language: request.constraints.language.trim().toLowerCase(),
      },
      style: {
        ...request.style,
        hook_type: request.style.hook_type.trim(),
        pacing_profile: request.style.pacing_profile.trim(),
        caption_style: request.style.caption_style.trim(),
        camera_language: request.style.camera_language.trim(),
      },
      ...(request.novel_project
        ? {
            novel_project: {
              ...request.novel_project,
              character_focus: request.novel_project.character_focus.trim(),
              emotional_peak: request.novel_project.emotional_peak.trim(),
              scene_summary: request.novel_project.scene_summary.trim(),
              visual_style_profile: request.novel_project.visual_style_profile.trim(),
            },
          }
        : {}),
      ...(request.studio_id ? { studio_id: request.studio_id } : {}),
      ...(request.narrative_payload
        ? {
            narrative_payload: {
              ...request.narrative_payload,
              scene_archetype: request.narrative_payload.scene_archetype.trim(),
              philosophy_note: request.narrative_payload.philosophy_note.trim(),
              key_prop: request.narrative_payload.key_prop.trim(),
              beats: request.narrative_payload.beats.map((beat) => ({
                ...beat,
                label: beat.label.trim(),
                scene: beat.scene.trim(),
                subtext: beat.subtext.trim(),
                philosophy_note: beat.philosophy_note.trim(),
              })),
            },
          }
        : {}),
    },
    derived: {
      resolved_platform_profile: request.intent.platform,
      resolved_duration_sec: resolvedDuration,
      resolved_aspect_ratio: "9:16",
      premium_allowed:
        request.constraints.quality_tier === "premium" &&
        request.backend.preferred_engine !== "local",
    },
  };
}
