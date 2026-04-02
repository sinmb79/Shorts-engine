import type {
  EmotionalTexture,
  EngineRequest,
  NarrativeBeat,
  NarrativeChecks,
  NarrativePayload,
  StudioDefinition,
  StudioId,
  StudioSceneArchetype,
} from "../domain/contracts.js";
import { loadStudioDefinition } from "./load-studio-definition.js";

interface NarrativeInput {
  studio_id: StudioId;
  topic: string;
  subject: string;
  goal: string;
  emotion: string;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "with",
  "into",
  "from",
  "that",
  "this",
  "their",
  "first",
  "time",
]);

export function resolveNarrativePayload(request: EngineRequest): NarrativePayload | null {
  if (request.narrative_payload) {
    return request.narrative_payload;
  }

  if (!request.studio_id) {
    return null;
  }

  return buildNarrativePayload({
    studio_id: request.studio_id,
    topic: request.intent.topic,
    subject: request.intent.subject,
    goal: request.intent.goal,
    emotion: request.intent.emotion,
  });
}

export function buildNarrativePayload(input: NarrativeInput): NarrativePayload {
  const studio = loadStudioDefinition(input.studio_id);
  const archetype = selectSceneArchetype(studio, input);
  const emotionalTexture = buildEmotionalTexture(archetype.emotional_texture, input.emotion);
  const keyProp = archetype.default_key_prop || deriveKeyProp(input.topic, input.subject);
  const beats = buildBeats(input, archetype, emotionalTexture, keyProp);
  const narrativeChecks = buildNarrativeChecks(beats, studio);

  return {
    studio_id: studio.studio_id,
    scene_archetype: archetype.name,
    philosophy_note: archetype.philosophy_note,
    emotional_texture: emotionalTexture,
    narrative_checks: narrativeChecks,
    key_prop: keyProp,
    key_silence_sec: deriveKeySilenceSeconds(emotionalTexture),
    beats,
  };
}

function selectSceneArchetype(
  studio: StudioDefinition,
  input: NarrativeInput,
): StudioSceneArchetype {
  const haystack = `${input.topic} ${input.goal} ${input.emotion}`.toLowerCase();
  const scored = studio.scene_archetypes.map((archetype) => ({
    archetype,
    score: (archetype.keywords || []).reduce(
      (total, keyword) => total + (haystack.includes(keyword.toLowerCase()) ? 1 : 0),
      0,
    ),
  }));

  scored.sort((left, right) => right.score - left.score);
  const selected = scored[0]?.archetype ?? studio.scene_archetypes[0];
  if (!selected) {
    throw new Error(`Studio ${studio.studio_id} has no scene archetypes`);
  }

  return selected;
}

function buildEmotionalTexture(base: EmotionalTexture, emotion: string): EmotionalTexture {
  const loweredEmotion = emotion.toLowerCase();
  const texture = { ...base };

  if (loweredEmotion.includes("wonder")) {
    texture.wonder = clamp(texture.wonder + 0.05);
  }

  if (loweredEmotion.includes("warm")) {
    texture.warmth = clamp(texture.warmth + 0.1);
  }

  if (loweredEmotion.includes("fear") || loweredEmotion.includes("tension")) {
    texture.tension = clamp(texture.tension + 0.1);
  }

  return texture;
}

function buildBeats(
  input: NarrativeInput,
  archetype: StudioSceneArchetype,
  emotionalTexture: EmotionalTexture,
  keyProp: string,
): NarrativeBeat[] {
  const subject = input.subject.trim();
  const topic = input.topic.trim();
  const goal = input.goal.trim();

  return [
    {
      beat_id: "beat_1",
      label: "hook",
      scene: `${subject} freezes for a breath as ${topic}. ${keyProp} stays close in hand while the frame holds.`,
      subtext: `${goal} begins before anyone can explain what is happening.`,
      emotional_texture: {
        tension: clamp(emotionalTexture.tension + 0.1),
        wonder: clamp(emotionalTexture.wonder - 0.1),
        warmth: emotionalTexture.warmth,
        silence: clamp(emotionalTexture.silence + 0.1),
      },
      philosophy_note: archetype.philosophy_note,
    },
    {
      beat_id: "beat_2",
      label: "encounter",
      scene: `${subject} keeps watching instead of fleeing, letting the unfamiliar detail of the moment come into focus around the ${keyProp}.`,
      subtext: archetype.meaning,
      emotional_texture: { ...emotionalTexture },
      philosophy_note: archetype.philosophy_note,
    },
    {
      beat_id: "beat_3",
      label: "shift",
      scene: `${subject} takes one careful step toward ${goal}, and the ${keyProp} turns from a shield into a witness.`,
      subtext: "The change is small on the surface, but the heart of the scene has already moved.",
      emotional_texture: {
        tension: clamp(emotionalTexture.tension - 0.25),
        wonder: clamp(emotionalTexture.wonder + 0.05),
        warmth: clamp(emotionalTexture.warmth + 0.35),
        silence: clamp(emotionalTexture.silence - 0.1),
      },
      philosophy_note: archetype.philosophy_note,
    },
  ];
}

function buildNarrativeChecks(
  beats: NarrativeBeat[],
  studio: StudioDefinition,
): NarrativeChecks {
  const openingBeat = beats[0];
  const closingBeat = beats[2] ?? beats[beats.length - 1];
  const combinedText = beats
    .flatMap((beat) => [beat.scene, beat.subtext, beat.philosophy_note])
    .join(" ")
    .toLowerCase();

  return {
    contrast: !!openingBeat
      && !!closingBeat
      && Math.abs(openingBeat.emotional_texture.tension - closingBeat.emotional_texture.tension) >= 0.2,
    specificity: beats.every((beat) => beat.scene.split(/\s+/).length >= 12),
    subtext: beats.every(
      (beat) => beat.subtext.trim().length > 0 && !beat.scene.includes(beat.subtext),
    ),
    forbidden_clear: studio.forbidden.every(
      (phrase) => !combinedText.includes(phrase.toLowerCase()),
    ),
  };
}

function deriveKeyProp(topic: string, subject: string): string {
  const token = `${topic} ${subject}`
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .find((value) => value.length >= 4 && !STOP_WORDS.has(value));

  return token ? `${token} keepsake` : "keepsake charm";
}

function deriveKeySilenceSeconds(texture: EmotionalTexture): number {
  if (texture.silence >= 0.7) {
    return 4;
  }

  if (texture.silence >= 0.45) {
    return 3;
  }

  return 2;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
