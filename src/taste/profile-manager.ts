import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import * as path from "node:path";

import type { TasteEntry, TasteProfile } from "../taste-db/schema.js";

export interface TastePaths {
  home_dir: string;
  profile_path: string;
  custom_entries_path: string;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function resolveShortsEngineHomeDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env["SHORTS_ENGINE_HOME"];
  if (configured && configured.trim() !== "") {
    return path.resolve(configured);
  }

  return path.join(homedir(), ".shorts-engine");
}

export function resolveTastePaths(env: NodeJS.ProcessEnv = process.env): TastePaths {
  const homeDir = resolveShortsEngineHomeDir(env);
  return {
    home_dir: homeDir,
    profile_path: path.join(homeDir, "taste-profile.json"),
    custom_entries_path: path.join(homeDir, "custom-entries.json"),
  };
}

async function ensureTasteHomeDir(env: NodeJS.ProcessEnv = process.env) {
  await mkdir(resolveTastePaths(env).home_dir, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function loadTasteProfile(
  env: NodeJS.ProcessEnv = process.env,
): Promise<TasteProfile | null> {
  const profile = await readJsonFile<TasteProfile>(resolveTastePaths(env).profile_path);
  return profile ? structuredClone(profile) : null;
}

export async function saveTasteProfile(
  profile: TasteProfile,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  await ensureTasteHomeDir(env);
  const { profile_path: profilePath } = resolveTastePaths(env);
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  return profilePath;
}

export async function resetTasteProfile(
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const { profile_path: profilePath } = resolveTastePaths(env);

  try {
    await rm(profilePath, { force: false });
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

export async function loadCustomEntries(
  env: NodeJS.ProcessEnv = process.env,
): Promise<TasteEntry[]> {
  const entries = await readJsonFile<TasteEntry[]>(resolveTastePaths(env).custom_entries_path);
  return entries ? structuredClone(entries) : [];
}

export async function saveCustomEntry(
  entry: TasteEntry,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  await ensureTasteHomeDir(env);

  const { custom_entries_path: customEntriesPath } = resolveTastePaths(env);
  const existingEntries = await loadCustomEntries(env);
  const filteredEntries = existingEntries.filter((candidate) => candidate.id !== entry.id);
  const nextEntries = [...filteredEntries, entry];

  await writeFile(customEntriesPath, `${JSON.stringify(nextEntries, null, 2)}\n`, "utf8");
  return customEntriesPath;
}
