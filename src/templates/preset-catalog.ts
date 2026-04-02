import type {
  BudgetTier,
  EngineRequest,
  Platform,
  PreferredEngine,
  QualityTier,
} from "../domain/contracts.js";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  default_topic: string;
  default_subject: string;
  defaults: {
    platform: Platform;
    theme: string;
    duration_sec: number;
    goal: string;
    emotion: string;
    hook_type: string;
    pacing_profile: string;
    caption_style: string;
    camera_language: string;
    budget_tier: BudgetTier;
    quality_tier: QualityTier;
    preferred_engine: PreferredEngine;
  };
  recommended_styles: string[];
  scene_skeleton: string[];
  required_inputs: string[];
  optional_inputs: string[];
  novel_project?: EngineRequest["novel_project"];
}

export interface TemplateBuildOverrides {
  topic?: string;
  subject?: string;
  goal?: string;
  emotion?: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "recipe-30s",
    name: "Recipe 30s",
    description: "Result-first cooking short with quick visual payoff.",
    default_topic: "15-minute creamy pasta",
    default_subject: "home cook plating dinner",
    defaults: {
      platform: "youtube_shorts",
      theme: "recipe",
      duration_sec: 30,
      goal: "show a fast recipe people can repeat tonight",
      emotion: "comfort and appetite",
      hook_type: "curiosity",
      pacing_profile: "fast_cut",
      caption_style: "informative_clean",
      camera_language: "simple_push_in",
      budget_tier: "low",
      quality_tier: "balanced",
      preferred_engine: "local",
    },
    recommended_styles: ["warm_editorial", "clean_topdown", "cozy_domestic"],
    scene_skeleton: ["ingredient reveal", "fast assembly", "texture close-up", "plated payoff"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "comedy-skit-15s",
    name: "Comedy Skit 15s",
    description: "Tight setup-payoff structure for short jokes and character bits.",
    default_topic: "office coffee machine drama",
    default_subject: "sleep-deprived coworker",
    defaults: {
      platform: "tiktok",
      theme: "comedy",
      duration_sec: 15,
      goal: "land a quick joke with replay value",
      emotion: "surprise and laughter",
      hook_type: "surprise",
      pacing_profile: "fast_cut",
      caption_style: "tiktok_viral",
      camera_language: "dynamic_pan",
      budget_tier: "balanced",
      quality_tier: "balanced",
      preferred_engine: "gpu",
    },
    recommended_styles: ["kinetic_montage", "deadpan_reveal", "timed_reaction"],
    scene_skeleton: ["weird premise", "escalation", "reaction shot", "punchline"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "tutorial-60s",
    name: "Tutorial 60s",
    description: "Longer explainer preset with clear steps and payoff.",
    default_topic: "Notion weekly planning system",
    default_subject: "freelancer organizing tasks",
    defaults: {
      platform: "youtube_shorts",
      theme: "tutorial",
      duration_sec: 60,
      goal: "teach a workflow people can copy immediately",
      emotion: "clarity and confidence",
      hook_type: "question",
      pacing_profile: "dramatic_build",
      caption_style: "informative_clean",
      camera_language: "simple_push_in",
      budget_tier: "balanced",
      quality_tier: "premium",
      preferred_engine: "gpu",
    },
    recommended_styles: ["clean_explainer", "screen_demo", "mentor_voice"],
    scene_skeleton: ["pain point", "step one", "step two", "step three", "result"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "product-launch-20s",
    name: "Product Launch 20s",
    description: "Momentum-heavy product reveal for launch days.",
    default_topic: "AI note app launch",
    default_subject: "creator demo on mobile",
    defaults: {
      platform: "tiktok",
      theme: "product_launch",
      duration_sec: 20,
      goal: "announce the product with urgency and clarity",
      emotion: "urgency and excitement",
      hook_type: "surprise",
      pacing_profile: "fast_cut",
      caption_style: "tiktok_viral",
      camera_language: "dynamic_pan",
      budget_tier: "balanced",
      quality_tier: "premium",
      preferred_engine: "gpu",
    },
    recommended_styles: ["kinetic_tech", "high_contrast_ui", "launch_momentum"],
    scene_skeleton: ["shock opener", "core benefit", "before-after", "release CTA"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "story-tease-25s",
    name: "Story Tease 25s",
    description: "Narrative teaser preset for fiction and episodic drops.",
    default_topic: "the rebel sees the traitor",
    default_subject: "fantasy protagonist at the gate",
    defaults: {
      platform: "instagram_reels",
      theme: "story_tease",
      duration_sec: 25,
      goal: "leave viewers desperate for the next episode",
      emotion: "tension and anticipation",
      hook_type: "cliffhanger",
      pacing_profile: "dramatic_build",
      caption_style: "cinematic_minimal",
      camera_language: "slow_push_in",
      budget_tier: "balanced",
      quality_tier: "premium",
      preferred_engine: "premium",
    },
    recommended_styles: ["dark_fantasy", "character_focus", "cliffhanger"],
    scene_skeleton: ["impossible choice", "secret clue", "betrayal reveal", "cliffhanger end"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
    novel_project: {
      mode: "cliffhanger_short",
      episode_number: 1,
      scene_summary: "A dangerous truth arrives one second too late.",
      emotional_peak: "betrayal and fear",
      cliffhanger_strength: 0.88,
      character_focus: "Unnamed protagonist",
      visual_style_profile: "cinematic fantasy neon",
    },
  },
  {
    id: "before-after-15s",
    name: "Before / After 15s",
    description: "Contrast-first template for transformations and tools.",
    default_topic: "messy desktop to clean dashboard",
    default_subject: "solo operator fixing workflow chaos",
    defaults: {
      platform: "instagram_reels",
      theme: "transformation",
      duration_sec: 15,
      goal: "make the change feel instantly visible",
      emotion: "relief and satisfaction",
      hook_type: "question",
      pacing_profile: "fast_cut",
      caption_style: "cinematic_minimal",
      camera_language: "simple_push_in",
      budget_tier: "low",
      quality_tier: "balanced",
      preferred_engine: "local",
    },
    recommended_styles: ["before_after", "clean_contrast", "minimal_payoff"],
    scene_skeleton: ["mess", "pivot", "clean result", "CTA"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "cozy-vlog-20s",
    name: "Cozy Vlog 20s",
    description: "Warm lifestyle vignette with tactile calm.",
    default_topic: "rainy morning journaling ritual",
    default_subject: "quiet desk by the window",
    defaults: {
      platform: "instagram_reels",
      theme: "lifestyle",
      duration_sec: 20,
      goal: "make the moment feel intimate and repeatable",
      emotion: "calm and warmth",
      hook_type: "curiosity",
      pacing_profile: "slow_burn",
      caption_style: "cinematic_minimal",
      camera_language: "slow_push_in",
      budget_tier: "balanced",
      quality_tier: "balanced",
      preferred_engine: "local",
    },
    recommended_styles: ["soft_natural_light", "slow_domestic", "tactile_detail"],
    scene_skeleton: ["texture hook", "ritual detail", "small reflection", "soft close"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
  {
    id: "cinematic-mood-20s",
    name: "Cinematic Mood 20s",
    description: "Atmospheric visual statement with strong art direction.",
    default_topic: "neon city solitude",
    default_subject: "lone figure crossing wet streets",
    defaults: {
      platform: "youtube_shorts",
      theme: "mood_piece",
      duration_sec: 20,
      goal: "create a memorable visual mood without over-explaining",
      emotion: "wonder and melancholy",
      hook_type: "mystery_question",
      pacing_profile: "dramatic_build",
      caption_style: "cinematic_minimal",
      camera_language: "slow_push_in",
      budget_tier: "high",
      quality_tier: "premium",
      preferred_engine: "premium",
    },
    recommended_styles: ["neon_noir", "cinematic_composition", "ambient_story"],
    scene_skeleton: ["striking opener", "visual motif", "emotional turn", "lingering close"],
    required_inputs: ["topic", "subject"],
    optional_inputs: ["goal", "emotion"],
  },
];

export function listTemplatePresets(): TemplatePreset[] {
  return TEMPLATE_PRESETS.map((preset) => structuredClone(preset));
}

export function getTemplatePreset(templateId: string): TemplatePreset | null {
  const match = TEMPLATE_PRESETS.find((preset) => preset.id === templateId);
  return match ? structuredClone(match) : null;
}

export function buildRequestFromTemplate(
  templateId: string,
  overrides: TemplateBuildOverrides = {},
): EngineRequest {
  const preset = getTemplatePreset(templateId);
  if (!preset) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  return {
    version: "0.1",
    intent: {
      topic: overrides.topic ?? preset.default_topic,
      subject: overrides.subject ?? preset.default_subject,
      goal: overrides.goal ?? preset.defaults.goal,
      emotion: overrides.emotion ?? preset.defaults.emotion,
      platform: preset.defaults.platform,
      theme: preset.defaults.theme,
      duration_sec: preset.defaults.duration_sec,
    },
    constraints: {
      language: "en",
      budget_tier: preset.defaults.budget_tier,
      quality_tier: preset.defaults.quality_tier,
      visual_consistency_required: true,
      content_policy_safe: true,
    },
    style: {
      hook_type: preset.defaults.hook_type,
      pacing_profile: preset.defaults.pacing_profile,
      caption_style: preset.defaults.caption_style,
      camera_language: preset.defaults.camera_language,
    },
    backend: {
      preferred_engine: preset.defaults.preferred_engine,
      allow_fallback: true,
    },
    output: {
      type: "video_prompt",
    },
    ...(preset.novel_project ? { novel_project: structuredClone(preset.novel_project) } : {}),
  };
}
