import type { CaptionTemplate } from "../domain/contracts.js";

export const CAPTION_TEMPLATES: Record<string, CaptionTemplate> = {
  hormozi: {
    id: "hormozi",
    font_family: "Pretendard Bold",
    font_size: 48,
    position: "center",
    background: "none",
    text_color: "#FFFFFF",
    stroke_color: "#000000",
    stroke_width: 4,
    animation: "word_by_word",
    max_chars_per_line: 12,
  },
  tiktok_viral: {
    id: "tiktok_viral",
    font_family: "Pretendard",
    font_size: 32,
    position: "bottom_center",
    background: "rgba(0,0,0,0.6)",
    text_color: "#FFFFFF",
    stroke_color: "none",
    stroke_width: 0,
    animation: "karaoke",
    max_chars_per_line: 18,
  },
  brand_4thpath: {
    id: "brand_4thpath",
    font_family: "Pretendard Light",
    font_size: 36,
    position: "bottom_center",
    background: "rgba(10,10,26,0.8)",
    text_color: "#00D4FF",
    stroke_color: "none",
    stroke_width: 0,
    animation: "typewriter",
    max_chars_per_line: 15,
  },
};

export function selectCaptionTemplate(
  cornerStyle?: string,
  requestStyle?: string,
): CaptionTemplate {
  if (requestStyle && requestStyle in CAPTION_TEMPLATES) {
    return CAPTION_TEMPLATES[requestStyle]!;
  }

  const normalizedCorner = cornerStyle?.trim().toLowerCase() ?? "";

  if (
    normalizedCorner.includes("viral") ||
    normalizedCorner.includes("cinematic") ||
    normalizedCorner.includes("entertainment") ||
    normalizedCorner.includes("shorts")
  ) {
    return CAPTION_TEMPLATES["tiktok_viral"]!;
  }

  if (
    normalizedCorner.includes("analysis") ||
    normalizedCorner.includes("brand") ||
    normalizedCorner.includes("data") ||
    normalizedCorner.includes("finance")
  ) {
    return CAPTION_TEMPLATES["brand_4thpath"]!;
  }

  if (
    normalizedCorner.includes("explainer") ||
    normalizedCorner.includes("education") ||
    normalizedCorner.includes("tutorial") ||
    normalizedCorner.includes("how-to")
  ) {
    return CAPTION_TEMPLATES["hormozi"]!;
  }

  return CAPTION_TEMPLATES["tiktok_viral"]!;
}
