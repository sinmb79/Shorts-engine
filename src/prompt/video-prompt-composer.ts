import type { EngineIntent } from "../domain/contracts.js";
import { preprocessKorean } from "./korean-preprocessor.js";
import { buildNegativeVisualPrompt, sentenceToVisualQueries } from "./visual-vocabulary.js";
import type { ComposedPrompt } from "./composed-prompt.js";

export interface CornerStyle {
  corner?: string;
  motion_hint?: string;
  source_language?: string;
  style_overrides?: Record<string, string>;
  search_queries?: string[];
}

export type VisualTranslator = (koreanConcept: string, corner?: string) => string;

export function composeVideoPrompt(
  intent: EngineIntent,
  engine: string,
  visualVocab: VisualTranslator,
  cornerStyle?: CornerStyle,
): ComposedPrompt {
  const normalizedEngine = normalizePromptEngine(engine);
  const sourceLanguage = cornerStyle?.source_language ?? detectSourceLanguage(intent);
  const rawIntent = buildRawIntent(intent, sourceLanguage);
  const visualDescription = visualVocab(
    [intent.topic, intent.subject, intent.goal, intent.theme].join(" "),
    cornerStyle?.corner,
  );
  const queries =
    cornerStyle?.search_queries ??
    sentenceToVisualQueries([intent.topic, intent.goal, intent.theme].join(" "), 3);
  const motionHint = humanizeMotionHint(cornerStyle?.motion_hint);
  const novelHighlight = cornerStyle?.style_overrides?.["novel_highlight"];

  switch (normalizedEngine) {
    case "kling_free":
      return {
        raw_intent: rawIntent,
        visual_description: [
          `${visualDescription}.`,
          `Subject: ${intent.subject}.`,
          `Goal: ${intent.goal}.`,
          `Emotion: ${intent.emotion}.`,
          `Camera: smooth movement, vertical 9:16 format.`,
          `Style: cinematic, vibrant.`,
          ...(novelHighlight ? [`Novel highlight: ${novelHighlight}.`] : []),
        ].join(" "),
        negative_prompt: buildNegativeVisualPrompt(["text overlay", "subtitles", "watermark"]),
        engine_format: "kling_free",
        metadata: buildMetadata(sourceLanguage, cornerStyle, queries),
      };
    case "veo3":
      return {
        raw_intent: rawIntent,
        visual_description: [
          `Subject: ${intent.subject}.`,
          `Action: ${intent.goal}.`,
          `Setting: ${visualDescription}.`,
          `Mood: ${intent.emotion}.`,
          `Format: vertical 9:16 portrait video.`,
          `Camera: ${motionHint}.`,
          `Audio: subtle ambient sound supporting ${intent.theme}.`,
          `Duration: ${intent.duration_sec} second short clip.`,
          ...(novelHighlight ? [`Novel highlight: ${novelHighlight}.`] : []),
        ].join(" "),
        negative_prompt: buildNegativeVisualPrompt(["caption burn-in", "logo watermark"]),
        engine_format: "veo3",
        metadata: buildMetadata(sourceLanguage, cornerStyle, queries),
      };
    case "seedance2":
      return {
        raw_intent: rawIntent,
        visual_description: [
          visualDescription,
          intent.subject,
          intent.goal,
          `${intent.emotion} mood`,
          `${intent.theme} theme`,
          "vertical 9:16",
          motionHint,
          ...queries,
          "cinematic",
          "4k",
          "professional",
          ...(novelHighlight ? [`novel highlight ${novelHighlight}`] : []),
        ].join(", "),
        negative_prompt: buildNegativeVisualPrompt(["watermark", "subtitle text", "bad anatomy"]),
        engine_format: "seedance2",
        metadata: buildMetadata(sourceLanguage, cornerStyle, queries),
      };
    case "runway":
      return {
        raw_intent: rawIntent,
        visual_description: [
          `Cinematic vertical short video about ${intent.topic}.`,
          `Subject: ${intent.subject}.`,
          `Visual world: ${visualDescription}.`,
          `Camera movement: ${motionHint}.`,
          `Tone: ${intent.emotion}, ${intent.theme}.`,
          ...(novelHighlight ? [`Novel highlight: ${novelHighlight}.`] : []),
        ].join(" "),
        negative_prompt: buildNegativeVisualPrompt(["text overlay", "stuttered motion"]),
        engine_format: "runway",
        metadata: buildMetadata(sourceLanguage, cornerStyle, queries),
      };
    case "ffmpeg_slides":
    default:
      return {
        raw_intent: rawIntent,
        visual_description: [
          "FFmpeg slide plan",
          `title=${intent.topic}`,
          `subject=${intent.subject}`,
          `slide_1=${queries[0] ?? intent.topic}`,
          `slide_2=${queries[1] ?? intent.goal}`,
          `slide_3=${queries[2] ?? intent.theme}`,
          `narration=${rawIntent}`,
          ...(novelHighlight ? [`Novel highlight: ${novelHighlight}`] : []),
          `aspect_ratio=9:16`,
          `duration_sec=${intent.duration_sec}`,
        ].join(" | "),
        negative_prompt: buildNegativeVisualPrompt(["flicker", "cropped text"]),
        engine_format: "ffmpeg_slides",
        metadata: buildMetadata(sourceLanguage, cornerStyle, queries),
      };
  }
}

function buildRawIntent(intent: EngineIntent, sourceLanguage: string): string {
  const raw = [
    intent.topic,
    intent.subject,
    intent.goal,
    intent.emotion,
    intent.theme,
  ].join(". ");

  return sourceLanguage === "ko" ? preprocessKorean(raw) : raw;
}

function buildMetadata(
  sourceLanguage: string,
  cornerStyle: CornerStyle | undefined,
  queries: string[],
): ComposedPrompt["metadata"] {
  return {
    source_language: sourceLanguage,
    ...(cornerStyle?.corner ? { corner: cornerStyle.corner } : {}),
    ...(cornerStyle?.style_overrides
      ? { style_overrides: cornerStyle.style_overrides }
      : {}),
    search_queries: queries,
  };
}

function humanizeMotionHint(motionHint: string | undefined): string {
  if (!motionHint) {
    return "smooth vertical camera move";
  }

  return motionHint.replaceAll("_", " ");
}

function normalizePromptEngine(engine: string): "kling_free" | "veo3" | "seedance2" | "runway" | "ffmpeg_slides" {
  if (engine === "kling" || engine === "kling_free") {
    return "kling_free";
  }

  if (engine === "veo3") {
    return "veo3";
  }

  if (engine === "seedance2") {
    return "seedance2";
  }

  if (engine === "runway") {
    return "runway";
  }

  return "ffmpeg_slides";
}

function detectSourceLanguage(intent: EngineIntent): string {
  return [intent.topic, intent.subject, intent.goal, intent.emotion, intent.theme].some(
    (value) => /[가-힣]/u.test(value),
  )
    ? "ko"
    : "en";
}
