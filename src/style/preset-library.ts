import type { StyleVector } from "../taste-db/schema.js";

function createStyleVector(vector: StyleVector): StyleVector {
  return structuredClone(vector);
}

export const DIRECTOR_PRESET_VECTORS: Record<string, StyleVector> = {
  christopher_nolan: createStyleVector({
    camera: {
      scale: 0.95,
      movement_energy: 0.55,
      closeup_ratio: 0.45,
      primary_movements: ["imax_wide", "steady_track", "slow_dolly"],
      signature: "epic_scale_with_human_focus",
    },
    editing: {
      pace: 0.58,
      cut_rhythm: "braided_precision",
      cross_cutting: true,
      time_manipulation: true,
    },
    color: {
      temperature: 0.46,
      saturation: 0.52,
      palette: ["steel_blue", "amber", "charcoal"],
      mood: "awe_under_pressure",
    },
    audio: {
      music_style: "orchestral_pulse",
      music_intensity: 0.86,
      silence_usage: 0.62,
      sfx_style: "immersive_realism",
    },
    narrative: {
      structure: "braided_mystery",
      emotion_arc: "curiosity_to_transcendence",
      pacing: "slow_build_explosive_climax",
      theme_keywords: ["time", "sacrifice", "obsession"],
    },
    hook: {
      type: "mystery_question",
      first_3sec: "massive_image_plus_question",
      retention: "escalating_stakes",
    },
  }),
  wes_anderson: createStyleVector({
    camera: {
      scale: 0.52,
      movement_energy: 0.3,
      closeup_ratio: 0.6,
      primary_movements: ["center_lockoff", "tableau_pan", "symmetry_push"],
      signature: "storybook_symmetry",
    },
    editing: {
      pace: 0.42,
      cut_rhythm: "chaptered_precision",
      cross_cutting: false,
      time_manipulation: false,
    },
    color: {
      temperature: 0.68,
      saturation: 0.74,
      palette: ["mustard", "rose", "powder_blue"],
      mood: "whimsical_control",
    },
    audio: {
      music_style: "retro_curated",
      music_intensity: 0.48,
      silence_usage: 0.34,
      sfx_style: "stylized_detail",
    },
    narrative: {
      structure: "chapter_tableau",
      emotion_arc: "deadpan_to_tenderness",
      pacing: "measured_but_playful",
      theme_keywords: ["family", "ritual", "precision"],
    },
    hook: {
      type: "unsettling_normal",
      first_3sec: "perfectly_arranged_visual",
      retention: "quirk_reveal",
    },
  }),
  bong_joon_ho: createStyleVector({
    camera: {
      scale: 0.68,
      movement_energy: 0.57,
      closeup_ratio: 0.58,
      primary_movements: ["class_shift_track", "handheld_follow", "slow_reveal"],
      signature: "social_space_as_drama",
    },
    editing: {
      pace: 0.63,
      cut_rhythm: "tonal_pivot",
      cross_cutting: true,
      time_manipulation: false,
    },
    color: {
      temperature: 0.42,
      saturation: 0.48,
      palette: ["concrete_gray", "sickly_green", "warm_interior"],
      mood: "tension_with_irony",
    },
    audio: {
      music_style: "minimal_anxiety",
      music_intensity: 0.64,
      silence_usage: 0.45,
      sfx_style: "environmental_detail",
    },
    narrative: {
      structure: "class_collision",
      emotion_arc: "humor_to_horror",
      pacing: "steady_escalation",
      theme_keywords: ["class", "survival", "deception"],
    },
    hook: {
      type: "false_sincerity",
      first_3sec: "ordinary_scene_with_threat",
      retention: "tonal_reversal",
    },
  }),
  park_chan_wook: createStyleVector({
    camera: {
      scale: 0.66,
      movement_energy: 0.61,
      closeup_ratio: 0.76,
      primary_movements: ["precise_closeup", "lateral_glide", "violent_snap"],
      signature: "intimacy_cut_by_violence",
    },
    editing: {
      pace: 0.69,
      cut_rhythm: "elegant_shock",
      cross_cutting: true,
      time_manipulation: true,
    },
    color: {
      temperature: 0.38,
      saturation: 0.71,
      palette: ["emerald", "blood_red", "midnight_blue"],
      mood: "seduction_and_threat",
    },
    audio: {
      music_style: "ornate_tension",
      music_intensity: 0.76,
      silence_usage: 0.39,
      sfx_style: "hyper_real_foley",
    },
    narrative: {
      structure: "revenge_spiral",
      emotion_arc: "control_to_ruin",
      pacing: "ornate_build_and_release",
      theme_keywords: ["revenge", "desire", "guilt"],
    },
    hook: {
      type: "tone_bait_switch",
      first_3sec: "beautiful_image_with_dread",
      retention: "moral_discomfort",
    },
  }),
  denis_villeneuve: createStyleVector({
    camera: {
      scale: 0.92,
      movement_energy: 0.34,
      closeup_ratio: 0.36,
      primary_movements: ["monumental_wide", "slow_push", "silhouette_track"],
      signature: "monumental_contemplation",
    },
    editing: {
      pace: 0.37,
      cut_rhythm: "patient_tension",
      cross_cutting: false,
      time_manipulation: true,
    },
    color: {
      temperature: 0.28,
      saturation: 0.35,
      palette: ["sand", "black", "dusty_orange"],
      mood: "austere_awe",
    },
    audio: {
      music_style: "industrial_dread",
      music_intensity: 0.74,
      silence_usage: 0.68,
      sfx_style: "low_frequency_weight",
    },
    narrative: {
      structure: "philosophical_pressure",
      emotion_arc: "distance_to_revelation",
      pacing: "slow_burn",
      theme_keywords: ["identity", "language", "destiny"],
    },
    hook: {
      type: "sensory_immersion",
      first_3sec: "overwhelming_world_texture",
      retention: "mystery_pressure",
    },
  }),
  edgar_wright: createStyleVector({
    camera: {
      scale: 0.54,
      movement_energy: 0.95,
      closeup_ratio: 0.57,
      primary_movements: ["whip_pan", "snap_zoom", "kinetic_push"],
      signature: "music_video_precision",
    },
    editing: {
      pace: 0.94,
      cut_rhythm: "percussive_sync",
      cross_cutting: true,
      time_manipulation: false,
    },
    color: {
      temperature: 0.58,
      saturation: 0.72,
      palette: ["electric_red", "ink_black", "cream"],
      mood: "playful_adrenaline",
    },
    audio: {
      music_style: "needle_drop_drive",
      music_intensity: 0.88,
      silence_usage: 0.18,
      sfx_style: "comic_exaggeration",
    },
    narrative: {
      structure: "escalating_set_piece",
      emotion_arc: "awkwardness_to_triumph",
      pacing: "rapid_escalation",
      theme_keywords: ["rhythm", "chaos", "cool_factor"],
    },
    hook: {
      type: "pattern_interrupt",
      first_3sec: "instant_visual_hit",
      retention: "constant_payoff",
    },
  }),
};

export const WRITER_PRESET_VECTORS: Record<string, StyleVector> = {
  charlie_kaufman: createStyleVector({
    camera: {
      scale: 0.38,
      movement_energy: 0.24,
      closeup_ratio: 0.74,
      primary_movements: ["hesitant_push", "lingering_closeup", "identity_mirror"],
      signature: "inner_life_as_space",
    },
    editing: {
      pace: 0.32,
      cut_rhythm: "self_reflective",
      cross_cutting: false,
      time_manipulation: true,
    },
    color: {
      temperature: 0.44,
      saturation: 0.37,
      palette: ["paper_gray", "faded_blue", "skin_tone"],
      mood: "fragile_introspection",
    },
    audio: {
      music_style: "subtle_unease",
      music_intensity: 0.35,
      silence_usage: 0.71,
      sfx_style: "psychological_detail",
    },
    narrative: {
      structure: "identity_loop",
      emotion_arc: "self_doubt_to_reckoning",
      pacing: "ruminative_spiral",
      theme_keywords: ["identity", "memory", "regret"],
    },
    hook: {
      type: "unsettling_normal",
      first_3sec: "ordinary_line_that_bends_reality",
      retention: "existential_question",
    },
  }),
  aaron_sorkin: createStyleVector({
    camera: {
      scale: 0.46,
      movement_energy: 0.52,
      closeup_ratio: 0.64,
      primary_movements: ["walk_and_talk", "medium_track", "fast_push"],
      signature: "argument_as_momentum",
    },
    editing: {
      pace: 0.76,
      cut_rhythm: "verbal_ping_pong",
      cross_cutting: true,
      time_manipulation: false,
    },
    color: {
      temperature: 0.5,
      saturation: 0.44,
      palette: ["navy", "white", "office_gray"],
      mood: "urgent_confidence",
    },
    audio: {
      music_style: "measured_drive",
      music_intensity: 0.52,
      silence_usage: 0.22,
      sfx_style: "dialogue_forward",
    },
    narrative: {
      structure: "debate_escalation",
      emotion_arc: "pressure_to_breakthrough",
      pacing: "accelerating_argument",
      theme_keywords: ["power", "wit", "ambition"],
    },
    hook: {
      type: "mystery_question",
      first_3sec: "sharp_claim_or_argument",
      retention: "verbal_escalation",
    },
  }),
  noh_hee_kyung: createStyleVector({
    camera: {
      scale: 0.42,
      movement_energy: 0.26,
      closeup_ratio: 0.82,
      primary_movements: ["gentle_closeup", "patient_two_shot", "small_pan"],
      signature: "compassionate_observation",
    },
    editing: {
      pace: 0.28,
      cut_rhythm: "emotional_breathing",
      cross_cutting: false,
      time_manipulation: false,
    },
    color: {
      temperature: 0.62,
      saturation: 0.39,
      palette: ["soft_brown", "window_light", "rainy_blue"],
      mood: "warm_honesty",
    },
    audio: {
      music_style: "piano_restraint",
      music_intensity: 0.34,
      silence_usage: 0.74,
      sfx_style: "intimate_room_tone",
    },
    narrative: {
      structure: "relational_slice_of_life",
      emotion_arc: "distance_to_understanding",
      pacing: "quiet_accumulation",
      theme_keywords: ["healing", "family", "forgiveness"],
    },
    hook: {
      type: "false_sincerity",
      first_3sec: "simple_line_with_emotional_weight",
      retention: "earned_empathy",
    },
  }),
  paulo_coelho: createStyleVector({
    camera: {
      scale: 0.63,
      movement_energy: 0.29,
      closeup_ratio: 0.48,
      primary_movements: ["symbolic_wide", "meditative_push", "journey_track"],
      signature: "parable_in_motion",
    },
    editing: {
      pace: 0.33,
      cut_rhythm: "meditative_progression",
      cross_cutting: false,
      time_manipulation: false,
    },
    color: {
      temperature: 0.72,
      saturation: 0.53,
      palette: ["gold", "sand", "midnight_teal"],
      mood: "spiritual_wonder",
    },
    audio: {
      music_style: "acoustic_quest",
      music_intensity: 0.47,
      silence_usage: 0.58,
      sfx_style: "symbolic_naturalism",
    },
    narrative: {
      structure: "quest_parable",
      emotion_arc: "uncertainty_to_clarity",
      pacing: "measured_revelation",
      theme_keywords: ["destiny", "faith", "search"],
    },
    hook: {
      type: "mystery_question",
      first_3sec: "parable_or_sign",
      retention: "spiritual_resolution",
    },
  }),
  haruki_murakami: createStyleVector({
    camera: {
      scale: 0.47,
      movement_energy: 0.21,
      closeup_ratio: 0.69,
      primary_movements: ["still_frame", "night_walk_track", "dream_cut"],
      signature: "loneliness_with_portals",
    },
    editing: {
      pace: 0.24,
      cut_rhythm: "drifting_repetition",
      cross_cutting: false,
      time_manipulation: true,
    },
    color: {
      temperature: 0.41,
      saturation: 0.32,
      palette: ["night_blue", "vinyl_black", "soft_neon"],
      mood: "dreamlike_isolation",
    },
    audio: {
      music_style: "late_night_jazz",
      music_intensity: 0.28,
      silence_usage: 0.78,
      sfx_style: "subtle_surrealism",
    },
    narrative: {
      structure: "drift_into_surreal",
      emotion_arc: "calm_to_dislocation",
      pacing: "hypnotic_drift",
      theme_keywords: ["loneliness", "memory", "surrealism"],
    },
    hook: {
      type: "unsettling_normal",
      first_3sec: "ordinary_moment_with_slippage",
      retention: "quiet_mystery",
    },
  }),
  agatha_christie: createStyleVector({
    camera: {
      scale: 0.44,
      movement_energy: 0.33,
      closeup_ratio: 0.62,
      primary_movements: ["clue_insert", "measured_track", "suspicion_closeup"],
      signature: "clue_first_clarity",
    },
    editing: {
      pace: 0.49,
      cut_rhythm: "clue_reveal",
      cross_cutting: true,
      time_manipulation: false,
    },
    color: {
      temperature: 0.54,
      saturation: 0.41,
      palette: ["mahogany", "cream", "forest_green"],
      mood: "elegant_suspense",
    },
    audio: {
      music_style: "chamber_tension",
      music_intensity: 0.43,
      silence_usage: 0.51,
      sfx_style: "precise_clues",
    },
    narrative: {
      structure: "closed_circle_mystery",
      emotion_arc: "certainty_to_doubt",
      pacing: "clue_stack_and_reveal",
      theme_keywords: ["mystery", "deception", "reveal"],
    },
    hook: {
      type: "mystery_question",
      first_3sec: "strange_fact_or_missing_piece",
      retention: "clue_chain",
    },
  }),
};
