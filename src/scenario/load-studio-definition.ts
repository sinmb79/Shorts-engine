import { existsSync, readFileSync, readdirSync } from "node:fs";
import * as path from "node:path";

import type { StudioDefinition, StudioId } from "../domain/contracts.js";

const STUDIO_ROOT = path.resolve(process.cwd(), "studios");

export function listStudioDefinitions(): StudioDefinition[] {
  if (!existsSync(STUDIO_ROOT)) {
    return [];
  }

  return readdirSync(STUDIO_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadStudioDefinition(entry.name as StudioId));
}

export function loadStudioDefinition(studioId: StudioId): StudioDefinition {
  const studioPath = path.resolve(STUDIO_ROOT, studioId, "studio.json");

  if (!existsSync(studioPath)) {
    throw new Error(`Unknown studio definition: ${studioId}`);
  }

  const parsed = JSON.parse(readFileSync(studioPath, "utf8")) as StudioDefinition;

  if (!parsed?.studio_id || !Array.isArray(parsed.scene_archetypes)) {
    throw new Error(`Invalid studio definition: ${studioId}`);
  }

  return parsed;
}
