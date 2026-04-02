import { existsSync, readFileSync } from "node:fs";

import { resolveQualityPaths } from "../quality/quality-db.js";
import type { BlockScoreRecord, VerifiedComboRecord } from "../quality/evolution-engine.js";

export interface ScenarioEvolutionHints {
  block_scores: Record<string, BlockScoreRecord>;
  verified_combos: VerifiedComboRecord[];
}

export function loadScenarioEvolutionHints(
  env: NodeJS.ProcessEnv = process.env,
): ScenarioEvolutionHints {
  const paths = resolveQualityPaths(env);
  const blockScores = existsSync(paths.block_scores_path)
    ? parseBlockScores(readFileSync(paths.block_scores_path, "utf8"))
    : {};
  const verifiedCombos = existsSync(paths.verified_combos_path)
    ? parseVerifiedCombos(readFileSync(paths.verified_combos_path, "utf8"))
    : [];

  return {
    block_scores: blockScores,
    verified_combos: verifiedCombos,
  };
}

function parseBlockScores(raw: string): Record<string, BlockScoreRecord> {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    parsed
      .filter((entry): entry is BlockScoreRecord => {
        return typeof entry === "object" && entry !== null && typeof (entry as { block_id?: unknown }).block_id === "string";
      })
      .map((entry) => [entry.block_id, entry]),
  );
}

function parseVerifiedCombos(raw: string): VerifiedComboRecord[] {
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is VerifiedComboRecord => {
        return typeof entry === "object"
          && entry !== null
          && typeof (entry as { combo_key?: unknown }).combo_key === "string"
          && Array.isArray((entry as { blocks?: unknown }).blocks);
      })
    : [];
}
