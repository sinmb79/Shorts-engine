import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import * as path from "node:path";

import type { Platform } from "../domain/contracts.js";

export interface TrendContext {
  enabled: boolean;
  source_path: string;
  keywords: string[];
  hashtags: string[];
  warnings: string[];
}

interface NormalizedTrendEntry {
  keyword: string;
  hashtag: string | null;
  platforms: Platform[];
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function resolveTrendIndexPath(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.SHORTS_ENGINE_TRENDS_PATH;
  if (configured && configured.trim() !== "") {
    return path.resolve(configured);
  }

  return path.join(homedir(), ".22b", "trends", "index.json");
}

export async function loadTrendContext(input: {
  enabled: boolean;
  platform: Platform;
  topic: string;
  env?: NodeJS.ProcessEnv;
}): Promise<TrendContext | null> {
  const env = input.env ?? process.env;
  if (!input.enabled) {
    return null;
  }

  const sourcePath = resolveTrendIndexPath(env);

  try {
    const raw = await readFile(sourcePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const entries = extractTrendEntries(parsed)
      .filter((entry) => entry.platforms.length === 0 || entry.platforms.includes(input.platform));
    const prioritized = prioritizeTrendEntries(entries, input.topic);
    const keywords = unique(prioritized.map((entry) => entry.keyword).filter(Boolean)).slice(0, 3);
    const hashtags = unique(
      prioritized
        .map((entry) => entry.hashtag ?? toHashtag(entry.keyword))
        .filter(Boolean),
    ).slice(0, 5);

    return {
      enabled: true,
      source_path: sourcePath,
      keywords,
      hashtags,
      warnings: keywords.length > 0 ? ["trend_keywords_applied"] : ["trend_index_present_but_empty"],
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {
        enabled: true,
        source_path: sourcePath,
        keywords: [],
        hashtags: [],
        warnings: ["trend_index_missing"],
      };
    }

    return {
      enabled: true,
      source_path: sourcePath,
      keywords: [],
      hashtags: [],
      warnings: ["trend_index_invalid"],
    };
  }
}

function extractTrendEntries(value: unknown): NormalizedTrendEntry[] {
  const records = resolveTrendRecords(value);
  return records
    .map(normalizeTrendEntry)
    .filter((entry): entry is NormalizedTrendEntry => entry !== null);
}

function resolveTrendRecords(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["trends", "items", "keywords", "entries"]) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeTrendEntry(value: unknown): NormalizedTrendEntry | null {
  if (typeof value === "string" && value.trim() !== "") {
    return {
      keyword: value.trim(),
      hashtag: toHashtag(value),
      platforms: [],
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const keyword = resolveStringField(value, ["keyword", "name", "title", "query"]);
  if (!keyword) {
    return null;
  }

  return {
    keyword,
    hashtag: resolveStringField(value, ["hashtag", "tag"]) ?? toHashtag(keyword),
    platforms: resolvePlatforms(value),
  };
}

function resolvePlatforms(record: Record<string, unknown>): Platform[] {
  const rawPlatforms = Array.isArray(record.platforms)
    ? record.platforms
    : record.platform !== undefined
      ? [record.platform]
      : [];

  return rawPlatforms.filter(
    (value): value is Platform =>
      value === "youtube_shorts" || value === "tiktok" || value === "instagram_reels",
  );
}

function prioritizeTrendEntries(entries: NormalizedTrendEntry[], topic: string): NormalizedTrendEntry[] {
  const topicTokens = new Set(
    topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );

  return [...entries].sort((left, right) => {
    const leftScore = topicTokens.has(left.keyword.toLowerCase()) ? 1 : 0;
    const rightScore = topicTokens.has(right.keyword.toLowerCase()) ? 1 : 0;
    return rightScore - leftScore;
  });
}

function resolveStringField(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function toHashtag(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

  return normalized ? `#${normalized}` : "#shorts";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
