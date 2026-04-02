import { createHash } from "node:crypto";

import type {
  NormalizedRequest,
  NovelShortsPlan,
  Platform,
  PlatformOutputSpec,
  ScenarioPlan,
  ScenarioScene,
  StyleResolution,
} from "../domain/contracts.js";
import {
  SCENARIO_BLOCK_LIBRARY,
  type ScenarioBlockRole,
  type ScenarioBlockTemplate,
} from "./block-library.js";
import { loadScenarioEvolutionHints, type ScenarioEvolutionHints } from "./evolution-hints.js";
import { forgeHook, type HookDecision } from "./hook-forge.js";

const ROLE_ORDER: ScenarioBlockRole[] = ["hook", "development", "twist", "closer"];
const GENERIC_DIRECTOR = "generic";

export function weaveScenarioPlan(input: {
  effectiveRequest: NormalizedRequest;
  platformOutputSpec: PlatformOutputSpec;
  styleResolution: StyleResolution;
  novelShortsPlan: NovelShortsPlan | null;
  env?: NodeJS.ProcessEnv;
}): ScenarioPlan {
  const {
    effectiveRequest,
    env,
    novelShortsPlan,
    platformOutputSpec,
    styleResolution,
  } = input;
  const directorAnchor = Object.entries(styleResolution.director_matches)[0]?.[0] ?? null;
  const writerAnchor = Object.entries(styleResolution.writer_matches)[0]?.[0] ?? null;
  const hookDecision = forgeHook(effectiveRequest, styleResolution, novelShortsPlan);
  const durations = allocateSceneDurations(
    effectiveRequest.derived.resolved_duration_sec,
    styleResolution.resolved_style.pacing_profile,
  );
  const evolutionHints = loadScenarioEvolutionHints(env);
  const warnings: string[] = [];
  const scenes: ScenarioScene[] = [];

  for (const [index, role] of ROLE_ORDER.entries()) {
    const block = selectBestBlock({
      role,
      directorAnchor,
      writerAnchor,
      platform: platformOutputSpec.platform,
      hookType: hookDecision.hook_type,
      pacingProfile: styleResolution.resolved_style.pacing_profile,
      request: effectiveRequest,
      styleResolution,
      evolutionHints,
      selectedBlockIds: scenes.map((scene) => scene.block_id),
    });

    if (block.director_anchor === null) {
      warnings.push(`${role}_used_generic_block`);
    }

    scenes.push(
      materializeScene(block, {
        effectiveRequest,
        writerAnchor,
        directorAnchor,
        hookDecision,
        novelShortsPlan,
        durationSec: durations[index] ?? 1,
        roleIndex: index,
      }),
    );
  }

  return {
    schema_version: "0.2.0",
    scenario_id: createScenarioId(effectiveRequest, directorAnchor, writerAnchor),
    source: styleResolution.source,
    director_anchor: directorAnchor,
    writer_anchor: writerAnchor,
    structure: writerAnchor ?? "baseline_explainer_arc",
    hook_decision: hookDecision,
    summary: buildSummary(effectiveRequest, scenes, directorAnchor, writerAnchor),
    blocks_used: scenes.map((scene) => scene.block_id),
    scenes,
    warnings,
  };
}

function createScenarioId(
  effectiveRequest: NormalizedRequest,
  directorAnchor: string | null,
  writerAnchor: string | null,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        topic: effectiveRequest.base.intent.topic,
        platform: effectiveRequest.base.intent.platform,
        directorAnchor,
        writerAnchor,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

function allocateSceneDurations(totalDurationSec: number, pacingProfile: string): number[] {
  const weights =
    pacingProfile === "fast_cut"
      ? [0.24, 0.32, 0.26, 0.18]
      : pacingProfile === "slow_burn"
        ? [0.2, 0.38, 0.22, 0.2]
        : [0.22, 0.34, 0.24, 0.2];

  const raw = weights.map((weight) => Math.max(1, Math.floor(totalDurationSec * weight)));
  let remainder = totalDurationSec - raw.reduce((sum, value) => sum + value, 0);
  let index = 0;

  while (remainder > 0) {
    const cursor = index % raw.length;
    raw[cursor] = (raw[cursor] ?? 1) + 1;
    remainder -= 1;
    index += 1;
  }

  while (remainder < 0) {
    const cursor = index % raw.length;
    const bucket = raw[cursor] ?? 1;
    if (bucket > 1) {
      raw[cursor] = bucket - 1;
      remainder += 1;
    }
    index += 1;
  }

  return raw;
}

function selectBestBlock(input: {
  role: ScenarioBlockRole;
  directorAnchor: string | null;
  writerAnchor: string | null;
  platform: Platform;
  hookType: string;
  pacingProfile: string;
  request: NormalizedRequest;
  styleResolution: StyleResolution;
  evolutionHints: ScenarioEvolutionHints;
  selectedBlockIds: string[];
}): ScenarioBlockTemplate {
  const {
    role,
    directorAnchor,
    writerAnchor,
    platform,
    hookType,
    pacingProfile,
    request,
    styleResolution,
    evolutionHints,
    selectedBlockIds,
  } = input;

  const themeSignals = new Set(
    [
      request.base.intent.theme,
      request.base.intent.emotion,
      ...styleResolution.concept_keywords,
      ...styleResolution.narrative_keywords,
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9_]+/)
      .filter(Boolean),
  );

  const candidates = SCENARIO_BLOCK_LIBRARY.filter((block) => {
    return block.role === role && block.supported_platforms.includes(platform);
  });

  const ranked = candidates
    .map((block) => ({
      block,
      score: scoreBlock({
        block,
        directorAnchor,
        writerAnchor,
        hookType,
        pacingProfile,
        themeSignals,
        evolutionHints,
        selectedBlockIds,
      }),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.block ?? fallbackBlock(role);
}

function scoreBlock(input: {
  block: ScenarioBlockTemplate;
  directorAnchor: string | null;
  writerAnchor: string | null;
  hookType: string;
  pacingProfile: string;
  themeSignals: Set<string>;
  evolutionHints: ScenarioEvolutionHints;
  selectedBlockIds: string[];
}): number {
  const {
    block,
    directorAnchor,
    writerAnchor,
    hookType,
    pacingProfile,
    themeSignals,
    evolutionHints,
    selectedBlockIds,
  } = input;
  let score = 0;

  if (block.director_anchor === directorAnchor) {
    score += 40;
  } else if (block.director_anchor === null) {
    score += 14;
  }

  if (block.writer_anchor === writerAnchor && writerAnchor) {
    score += 18;
  }

  if (block.supported_hook_types.includes(hookType)) {
    score += 20;
  }

  if (block.supported_pacing_profiles.includes(pacingProfile)) {
    score += 12;
  }

  for (const tag of block.tags) {
    if (themeSignals.has(tag.toLowerCase())) {
      score += 5;
    }
  }

  for (const structureTag of block.structure_tags) {
    if (themeSignals.has(structureTag.toLowerCase())) {
      score += 4;
    }
  }

  const learnedScore = evolutionHints.block_scores[block.id];
  if (learnedScore) {
    if (learnedScore.rank === "gold") {
      score += 22 + learnedScore.feedback_count;
    } else if (learnedScore.rank === "normal") {
      score += 8;
    } else if (learnedScore.rank === "flagged") {
      score -= 10;
    } else if (learnedScore.rank === "retired") {
      score -= 30;
    }
  }

  for (const combo of evolutionHints.verified_combos) {
    if (!combo.blocks.includes(block.id)) {
      continue;
    }

    const pairedBlocks = combo.blocks.filter((candidate) => candidate !== block.id);
    if (pairedBlocks.length > 0 && pairedBlocks.every((candidate) => selectedBlockIds.includes(candidate))) {
      score += 12 + combo.feedback_count * 2;
    }
  }

  return score;
}

function fallbackBlock(role: ScenarioBlockRole): ScenarioBlockTemplate {
  const genericBlock = SCENARIO_BLOCK_LIBRARY.find(
    (block) => block.role === role && block.director_anchor === null,
  );
  if (genericBlock) {
    return genericBlock;
  }

  const firstRoleMatch = SCENARIO_BLOCK_LIBRARY.find((block) => block.role === role);
  if (firstRoleMatch) {
    return firstRoleMatch;
  }

  return {
    id: `${GENERIC_DIRECTOR}_${role}_fallback`,
    role,
    director_anchor: null,
    writer_anchor: null,
    supported_platforms: ["youtube_shorts", "tiktok", "instagram_reels"],
    supported_hook_types: ["mystery_question"],
    supported_pacing_profiles: ["dramatic_build"],
    tags: [],
    structure_tags: [],
    scenario_text_ko_template: "{topic}의 핵심을 짧고 선명하게 전달한다.",
    scenario_text_en_template: "Deliver the core value of {topic} in one clear beat.",
    camera_cues: ["clean framing"],
    audio_cues: ["minimal cue"],
    caption_template: "{topic}",
    ai_prompt_fragment_template: "clean short-form frame",
  };
}

function materializeScene(
  block: ScenarioBlockTemplate,
  context: {
    effectiveRequest: NormalizedRequest;
    writerAnchor: string | null;
    directorAnchor: string | null;
    hookDecision: HookDecision;
    novelShortsPlan: NovelShortsPlan | null;
    durationSec: number;
    roleIndex: number;
  },
): ScenarioScene {
  const templateContext = buildTemplateContext(context);

  return {
    scene_id: `scene_${context.roleIndex + 1}`,
    role: block.role,
    block_id: block.id,
    duration_sec: context.durationSec,
    scenario_text_ko: renderTemplate(block.scenario_text_ko_template, templateContext),
    scenario_text_en: renderTemplate(block.scenario_text_en_template, templateContext),
    camera_cues: block.camera_cues.map((value) => renderTemplate(value, templateContext)),
    audio_cues: block.audio_cues.map((value) => renderTemplate(value, templateContext)),
    caption_text: renderTemplate(block.caption_template, templateContext),
    ai_prompt_fragment: renderTemplate(block.ai_prompt_fragment_template, templateContext),
    tags: [...block.tags],
  };
}

function buildTemplateContext(context: {
  effectiveRequest: NormalizedRequest;
  writerAnchor: string | null;
  directorAnchor: string | null;
  hookDecision: HookDecision;
  novelShortsPlan: NovelShortsPlan | null;
}): Record<string, string> {
  const { effectiveRequest, writerAnchor, directorAnchor, hookDecision, novelShortsPlan } = context;

  return {
    topic: effectiveRequest.base.intent.topic,
    subject: effectiveRequest.base.intent.subject,
    goal: effectiveRequest.base.intent.goal,
    emotion: effectiveRequest.base.intent.emotion,
    theme: effectiveRequest.base.intent.theme,
    hook_type: hookDecision.hook_type,
    opening_device: hookDecision.opening_device,
    director_anchor: directorAnchor ?? "generic",
    writer_anchor: writerAnchor ?? "generic",
    novel_highlight: novelShortsPlan?.highlight_candidate ?? effectiveRequest.base.intent.topic,
    character_focus: effectiveRequest.base.intent.subject,
  };
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-z_]+)\}/g, (_, key: string) => values[key] ?? "");
}

function buildSummary(
  effectiveRequest: NormalizedRequest,
  scenes: ScenarioScene[],
  directorAnchor: string | null,
  writerAnchor: string | null,
): string {
  const hookCaption = scenes[0]?.caption_text ?? effectiveRequest.base.intent.topic;
  const closerCaption = scenes[3]?.caption_text ?? effectiveRequest.base.intent.goal;
  const anchors = [directorAnchor, writerAnchor].filter(Boolean).join(" x ");

  return anchors
    ? `${hookCaption} ${closerCaption} (${anchors})`
    : `${hookCaption} ${closerCaption}`;
}
