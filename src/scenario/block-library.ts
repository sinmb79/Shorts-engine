import type { Platform } from "../domain/contracts.js";

export type ScenarioBlockRole = "hook" | "development" | "twist" | "closer";

export interface ScenarioBlockTemplate {
  id: string;
  role: ScenarioBlockRole;
  director_anchor: string | null;
  writer_anchor: string | null;
  supported_platforms: Platform[];
  supported_hook_types: string[];
  supported_pacing_profiles: string[];
  tags: string[];
  structure_tags: string[];
  scenario_text_ko_template: string;
  scenario_text_en_template: string;
  camera_cues: string[];
  audio_cues: string[];
  caption_template: string;
  ai_prompt_fragment_template: string;
}

const ALL_PLATFORMS: Platform[] = ["youtube_shorts", "tiktok", "instagram_reels"];

export const SCENARIO_BLOCK_LIBRARY: ScenarioBlockTemplate[] = [
  {
    id: "wes_hook_symmetry_reveal",
    role: "hook",
    director_anchor: "wes_anderson",
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["unsettling_normal", "mystery_question"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build"],
    tags: ["symmetry", "clarity", "simplicity", "ritual"],
    structure_tags: ["chapter_tableau", "quest_parable", "relational_slice_of_life"],
    scenario_text_ko_template:
      "{subject}를 정중앙에 둔 완벽한 구도 속에서 {topic}을 시작한다. 모든 것이 질서정연한데, 아주 작은 어긋남 하나가 이 이야기를 끝까지 보게 만든다.",
    scenario_text_en_template:
      "Open on {subject} in a perfectly centered frame, then let one tiny mismatch make {topic} feel too important to ignore.",
    camera_cues: ["centered tableau", "measured push-in", "flat frontal composition"],
    audio_cues: ["retro curated cue", "crisp prop Foley", "brief silence before reveal"],
    caption_template: "Everything looks calm. So why does this feel off?",
    ai_prompt_fragment_template:
      "storybook symmetry, pastel editorial palette, centered subject, ritualized props, delicate whimsy",
  },
  {
    id: "wes_development_chapter_turn",
    role: "development",
    director_anchor: "wes_anderson",
    writer_anchor: "paulo_coelho",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["unsettling_normal", "mystery_question", "false_sincerity"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build"],
    tags: ["clarity", "trust", "precision", "family"],
    structure_tags: ["chapter_tableau", "quest_parable", "relational_slice_of_life"],
    scenario_text_ko_template:
      "{goal}을 복잡한 기능 설명이 아니라 작은 의식처럼 보여준다. {topic}이 {subject}의 하루를 어떻게 질서 있게 바꾸는지 차분하게 드러낸다.",
    scenario_text_en_template:
      "Treat {goal} less like a feature list and more like a chapter turn, showing how {topic} quietly restores order for {subject}.",
    camera_cues: ["chapter-card cut", "tableau pan", "prop detail insert"],
    audio_cues: ["light percussion", "page-turn accent", "measured room tone"],
    caption_template: "The trick is not speed. It's precision people can trust.",
    ai_prompt_fragment_template:
      "chapter-card rhythm, tidy object choreography, warm pastel contrast, precise prop storytelling",
  },
  {
    id: "wes_twist_order_break",
    role: "twist",
    director_anchor: "wes_anderson",
    writer_anchor: "agatha_christie",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["unsettling_normal", "mystery_question"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build"],
    tags: ["decision", "clarity", "risk", "trust"],
    structure_tags: ["chapter_tableau", "closed_circle_mystery"],
    scenario_text_ko_template:
      "중반부에서 {topic}이 없을 때 생기는 작은 붕괴를 보여준다. 정돈된 표면 아래 숨어 있던 마찰이 한 번에 드러나면서 메시지가 선명해진다.",
    scenario_text_en_template:
      "Midway through, reveal the quiet collapse that appears without {topic}, turning polished order into a clear before-and-after contrast.",
    camera_cues: ["sudden symmetry break", "insert on missing detail", "lateral correction move"],
    audio_cues: ["needle scratch accent", "muted room hum", "soft sting"],
    caption_template: "The real cost is the tiny friction nobody notices until it piles up.",
    ai_prompt_fragment_template:
      "broken symmetry, missing object detail, calm composition with hidden tension, editorial contrast",
  },
  {
    id: "wes_closer_tender_order",
    role: "closer",
    director_anchor: "wes_anderson",
    writer_anchor: "noh_hee_kyung",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["unsettling_normal", "false_sincerity", "mystery_question"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build"],
    tags: ["trust", "clarity", "healing", "simplicity"],
    structure_tags: ["chapter_tableau", "relational_slice_of_life", "quest_parable"],
    scenario_text_ko_template:
      "마지막은 큰 외침 대신 단정한 확신으로 끝낸다. {topic} 덕분에 {subject}가 더 단순하고 명확한 하루를 맞이한다는 감각을 남긴다.",
    scenario_text_en_template:
      "Close on a matter-of-fact image that lets {topic} feel like a small act of care, leaving {subject} with a simpler and clearer day.",
    camera_cues: ["centered final lock-off", "gentle pull-back", "balanced end frame"],
    audio_cues: ["soft resolved chord", "subtle ambient lift", "clean end stop"],
    caption_template: "Small order. Real relief.",
    ai_prompt_fragment_template:
      "balanced final tableau, gentle tenderness, clean object hierarchy, soft editorial closure",
  },
  {
    id: "edgar_hook_snap_interrupt",
    role: "hook",
    director_anchor: "edgar_wright",
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["pattern_interrupt", "visual_spectacle", "tone_bait_switch"],
    supported_pacing_profiles: ["fast_cut", "dramatic_build"],
    tags: ["speed", "momentum", "surprise", "chaos"],
    structure_tags: ["escalating_set_piece", "debate_escalation"],
    scenario_text_ko_template:
      "{topic}을 설명하지 말고 먼저 부딪치게 만든다. {subject}의 반복된 일상 리듬을 한 번에 끊어내며 영상이 즉시 앞으로 튀어나오게 한다.",
    scenario_text_en_template:
      "Do not explain {topic} first. Smash into {subject}'s routine and let a rhythmic interruption make the whole short lunge forward instantly.",
    camera_cues: ["whip pan", "snap zoom", "impact insert montage"],
    audio_cues: ["percussive hit", "needle-drop start", "comic whoosh"],
    caption_template: "Stop scrolling. This changes the rhythm immediately.",
    ai_prompt_fragment_template:
      "kinetic montage, whip-pan transitions, comic precision, rhythmic object cuts, bold contrast",
  },
  {
    id: "edgar_development_percussive_explainer",
    role: "development",
    director_anchor: "edgar_wright",
    writer_anchor: "aaron_sorkin",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["pattern_interrupt", "visual_spectacle", "mystery_question"],
    supported_pacing_profiles: ["fast_cut", "dramatic_build"],
    tags: ["momentum", "speed", "wit", "ambition"],
    structure_tags: ["escalating_set_piece", "debate_escalation"],
    scenario_text_ko_template:
      "{goal}의 핵심 장면들을 박자감 있게 압축한다. 기능 하나하나를 길게 설명하는 대신, {topic}이 어떻게 시간을 절약하는지 리듬으로 설득한다.",
    scenario_text_en_template:
      "Compress the core beats of {goal} into a percussive run, proving through rhythm rather than lectures how {topic} saves time for {subject}.",
    camera_cues: ["speed-ramped inserts", "match-cut gestures", "kinetic push"],
    audio_cues: ["syncopated clicks", "tight bass pulse", "hard-cut transitions"],
    caption_template: "Every beat removes one more wasted step.",
    ai_prompt_fragment_template:
      "percussive explainer montage, sharp graphic transitions, high-energy inserts, rhythmic precision",
  },
  {
    id: "edgar_twist_hidden_friction_combo",
    role: "twist",
    director_anchor: "edgar_wright",
    writer_anchor: "agatha_christie",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["pattern_interrupt", "tone_bait_switch", "mystery_question"],
    supported_pacing_profiles: ["fast_cut", "dramatic_build"],
    tags: ["surprise", "decision", "risk", "reveal"],
    structure_tags: ["escalating_set_piece", "closed_circle_mystery"],
    scenario_text_ko_template:
      "중간 전환점에서 진짜 적을 드러낸다. 문제는 바쁜 사람이 아니라 숨어 있는 마찰이고, {topic}은 그 마찰을 한 컷씩 제거하는 도구로 보이게 만든다.",
    scenario_text_en_template:
      "At the turn, reveal the real enemy: not the person, but the hidden friction. Then frame {topic} as the tool that slices that friction out beat by beat.",
    camera_cues: ["combo punch-in", "graphic contrast cut", "surprise insert"],
    audio_cues: ["drop-out silence", "re-entry hit", "foley accent stack"],
    caption_template: "The bottleneck was never obvious. That's the point.",
    ai_prompt_fragment_template:
      "sudden visual contrast, hidden bottleneck reveal, kinetic comic framing, rhythmic payoff",
  },
  {
    id: "edgar_closer_payoff_release",
    role: "closer",
    director_anchor: "edgar_wright",
    writer_anchor: "aaron_sorkin",
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["pattern_interrupt", "visual_spectacle", "tone_bait_switch"],
    supported_pacing_profiles: ["fast_cut", "dramatic_build"],
    tags: ["triumph", "momentum", "speed", "confidence"],
    structure_tags: ["escalating_set_piece", "debate_escalation"],
    scenario_text_ko_template:
      "결말은 한 번의 해방감으로 정리한다. {subject}가 멈추지 않고 앞으로 나아가고, {topic}이 그 추진력을 만드는 마지막 한 컷으로 끝낸다.",
    scenario_text_en_template:
      "Finish with a release beat that shows {subject} moving cleanly forward, turning {topic} into the final push that makes momentum feel inevitable.",
    camera_cues: ["hero push-through", "impact freeze", "clean exit frame"],
    audio_cues: ["resolved beat drop", "quick final sting", "tight stop"],
    caption_template: "Less drag. More momentum.",
    ai_prompt_fragment_template:
      "kinetic payoff frame, confident forward motion, sharp contrast, stylish release beat",
  },
  {
    id: "generic_hook_question_frame",
    role: "hook",
    director_anchor: null,
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["mystery_question", "curiosity", "question", "false_sincerity"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build", "fast_cut"],
    tags: ["clarity", "curiosity", "decision"],
    structure_tags: ["quest_parable", "closed_circle_mystery", "debate_escalation"],
    scenario_text_ko_template:
      "{topic}에 대한 가장 큰 질문을 먼저 던진다. {subject}의 일상 속 장면 하나로 시작해서 왜 이 문제가 지금 중요한지 바로 묻게 만든다.",
    scenario_text_en_template:
      "Lead with the biggest question around {topic}, using one slice of {subject}'s routine to make the stakes feel immediate.",
    camera_cues: ["direct push-in", "clean medium shot", "single reveal insert"],
    audio_cues: ["subtle pulse", "soft rise", "clean transition"],
    caption_template: "What changes when this finally works?",
    ai_prompt_fragment_template:
      "clean explainer framing, focused medium shot, immediate stakes, modern short-form clarity",
  },
  {
    id: "generic_development_clear_steps",
    role: "development",
    director_anchor: null,
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["mystery_question", "pattern_interrupt", "question", "curiosity"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build", "fast_cut"],
    tags: ["clarity", "trust", "focus"],
    structure_tags: ["quest_parable", "debate_escalation", "closed_circle_mystery"],
    scenario_text_ko_template:
      "{goal}의 핵심을 두세 단계로 보여준다. 보는 사람이 복잡한 설명보다 결과를 먼저 체감하도록 구성한다.",
    scenario_text_en_template:
      "Break {goal} into two or three crisp moves so the audience feels the result before they have to process the explanation.",
    camera_cues: ["step-by-step inserts", "clean screen focus", "result-first framing"],
    audio_cues: ["light click track", "minimal ambience", "subtle rise"],
    caption_template: "Make the value obvious before the details get heavy.",
    ai_prompt_fragment_template:
      "clear step-by-step visual language, modern product explainer, result-first composition",
  },
  {
    id: "generic_twist_before_after_truth",
    role: "twist",
    director_anchor: null,
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["mystery_question", "pattern_interrupt", "tone_bait_switch", "curiosity"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build", "fast_cut"],
    tags: ["comparison", "risk", "clarity"],
    structure_tags: ["quest_parable", "closed_circle_mystery", "debate_escalation"],
    scenario_text_ko_template:
      "중반에는 전후 대비를 강하게 만든다. {topic}이 없는 상태와 있는 상태를 붙여 보여주며 메시지를 단숨에 또렷하게 만든다.",
    scenario_text_en_template:
      "Use the middle beat to force a before-and-after contrast, making the value of {topic} obvious in one clean comparison.",
    camera_cues: ["split comparison", "detail contrast cut", "before-after reveal"],
    audio_cues: ["contrast sting", "brief mute", "clarity rise"],
    caption_template: "The difference is smaller than drama, but bigger than it looks.",
    ai_prompt_fragment_template:
      "before-and-after comparison, crisp contrast framing, practical stakes, concise reveal",
  },
  {
    id: "generic_closer_confident_cta",
    role: "closer",
    director_anchor: null,
    writer_anchor: null,
    supported_platforms: ALL_PLATFORMS,
    supported_hook_types: ["mystery_question", "pattern_interrupt", "tone_bait_switch", "curiosity"],
    supported_pacing_profiles: ["slow_burn", "dramatic_build", "fast_cut"],
    tags: ["trust", "clarity", "confidence"],
    structure_tags: ["quest_parable", "debate_escalation", "closed_circle_mystery"],
    scenario_text_ko_template:
      "마지막은 과장 대신 확신으로 닫는다. {topic}이 왜 지금 써볼 가치가 있는지 한 문장으로 남긴다.",
    scenario_text_en_template:
      "End with confidence instead of hype, leaving one clear line about why {topic} is worth trying now.",
    camera_cues: ["steady closing frame", "clean result shot", "simple end card"],
    audio_cues: ["resolved tone", "soft finish", "clean end"],
    caption_template: "Simple enough to try. Strong enough to keep.",
    ai_prompt_fragment_template:
      "clean final result shot, confident product close, concise modern outro, minimal clutter",
  },
];
