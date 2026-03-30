import { readFile } from "node:fs/promises";
import * as path from "node:path";

import type { EngineRequest } from "../domain/contracts.js";
import {
  resolveConfig,
  type EngineConfig,
  type PromptStyleDefinition,
  type PromptStylesConfig,
  type ResolvedConfig,
  type ShortsConfig,
  type UserProfile,
} from "../config/config-resolver.js";

export interface LoadedRuntimeConfig {
  config_root: string;
  engine_config: EngineConfig;
  shorts_config: ShortsConfig;
  prompt_styles_config: PromptStylesConfig;
  user_profile: UserProfile;
  resolved_config: ResolvedConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function toConfigRelative(fileName: string): string {
  return `config/${fileName}`;
}

function createMissingFileError(fileName: string): Error {
  return new Error(`필수 설정 파일이 없습니다: ${toConfigRelative(fileName)}`);
}

function createInvalidJsonError(fileName: string): Error {
  return new Error(`설정 파일 JSON 형식이 올바르지 않습니다: ${toConfigRelative(fileName)}`);
}

function createInvalidShapeError(fileName: string): Error {
  return new Error(`설정 파일 형식이 올바르지 않습니다: ${toConfigRelative(fileName)}`);
}

function isPromptStyleDefinition(value: unknown): value is PromptStyleDefinition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.caption_template) &&
    isStringArray(value.color_palette) &&
    isString(value.video_style) &&
    isStringArray(value.motion_preference) &&
    isString(value.tone)
  );
}

function isEngineConfig(value: unknown): value is EngineConfig {
  if (!isRecord(value)) {
    return false;
  }

  const tts = value.tts;
  const videoGeneration = value.video_generation;

  return (
    isRecord(tts) &&
    isString(tts.provider) &&
    isRecord(tts.options) &&
    isRecord(videoGeneration) &&
    isString(videoGeneration.provider) &&
    isRecord(videoGeneration.options)
  );
}

function isShortsConfig(value: unknown): value is ShortsConfig {
  if (!isRecord(value)) {
    return false;
  }

  const schedule = value.schedule;
  const inputDirs = value.input_dirs;
  const assets = value.assets;

  return (
    typeof value.enabled === "boolean" &&
    isRecord(schedule) &&
    isString(schedule.frequency) &&
    isStringArray(schedule.times) &&
    typeof schedule.max_per_day === "number" &&
    isRecord(inputDirs) &&
    isRecord(assets)
  );
}

function isPromptStylesConfig(value: unknown): value is PromptStylesConfig {
  if (!isRecord(value)) {
    return false;
  }

  if (!isRecord(value.corners) || !isPromptStyleDefinition(value.default)) {
    return false;
  }

  return Object.values(value.corners).every((entry) => isPromptStyleDefinition(entry));
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!isRecord(value)) {
    return false;
  }

  if ("budget" in value && value.budget !== undefined && !isRecord(value.budget)) {
    return false;
  }

  if ("defaults" in value && value.defaults !== undefined && !isRecord(value.defaults)) {
    return false;
  }

  return true;
}

async function readJsonFile(filePath: string, fileName: string): Promise<unknown> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw createMissingFileError(fileName);
    }

    throw error;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw createInvalidJsonError(fileName);
  }
}

function validateConfig<T>(
  value: unknown,
  fileName: string,
  predicate: (candidate: unknown) => candidate is T,
): T {
  if (!predicate(value)) {
    throw createInvalidShapeError(fileName);
  }

  return value;
}

async function findNearestConfigRoot(requestPath: string): Promise<string> {
  let currentDir = path.resolve(path.dirname(requestPath));
  const { root } = path.parse(currentDir);

  while (true) {
    const engineConfigPath = path.join(currentDir, "config", "engine.json");

    try {
      await readFile(engineConfigPath, "utf8");
      return currentDir;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw createInvalidJsonError("engine.json");
      }
    }

    if (currentDir === root) {
      throw new Error(
        `설정 루트를 찾을 수 없습니다. 요청 파일 상위 경로에 config/engine.json 이 필요합니다: ${requestPath}`,
      );
    }

    currentDir = path.dirname(currentDir);
  }
}

export async function loadRuntimeConfig(
  requestPath: string,
  request: EngineRequest,
): Promise<LoadedRuntimeConfig> {
  const configRoot = await findNearestConfigRoot(requestPath);
  const configDir = path.join(configRoot, "config");

  const engineConfig = validateConfig(
    await readJsonFile(path.join(configDir, "engine.json"), "engine.json"),
    "engine.json",
    isEngineConfig,
  );
  const shortsConfig = validateConfig(
    await readJsonFile(path.join(configDir, "shorts-config.json"), "shorts-config.json"),
    "shorts-config.json",
    isShortsConfig,
  );
  const promptStylesConfig = validateConfig(
    await readJsonFile(path.join(configDir, "prompt-styles.json"), "prompt-styles.json"),
    "prompt-styles.json",
    isPromptStylesConfig,
  );
  const userProfile = validateConfig(
    await readJsonFile(path.join(configDir, "user-profile.json"), "user-profile.json"),
    "user-profile.json",
    isUserProfile,
  );

  return {
    config_root: configRoot,
    engine_config: engineConfig,
    shorts_config: shortsConfig,
    prompt_styles_config: promptStylesConfig,
    user_profile: userProfile,
    resolved_config: resolveConfig(request, userProfile, engineConfig),
  };
}
