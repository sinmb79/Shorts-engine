import { writeFile } from "node:fs/promises";

import {
  listFeedbackRecords,
  resolveQualityPaths,
  type FeedbackRecord,
} from "./quality-db.js";
import { refineTasteProfileFromFeedback, type DnaAdjustment } from "./dna-refiner.js";

export type BlockRank = "gold" | "normal" | "flagged" | "retired";

export interface BlockScoreRecord {
  block_id: string;
  average_score: number;
  feedback_count: number;
  rank: BlockRank;
}

export interface VerifiedComboRecord {
  combo_key: string;
  blocks: string[];
  average_score: number;
  feedback_count: number;
}

export interface EvolutionSnapshot {
  generated_at: string;
  total_feedback: number;
  block_scores: BlockScoreRecord[];
  verified_combos: VerifiedComboRecord[];
  dna_refinement: {
    applied: boolean;
    considered_feedback: number;
    adjustments: DnaAdjustment[];
  };
}

export async function runEvolutionEngine(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EvolutionSnapshot> {
  const feedback = await listFeedbackRecords(env);
  const dnaRefinement = await refineTasteProfileFromFeedback(env);
  const snapshot: EvolutionSnapshot = {
    generated_at: new Date().toISOString(),
    total_feedback: feedback.length,
    block_scores: buildBlockScores(feedback),
    verified_combos: buildVerifiedCombos(feedback),
    dna_refinement: {
      applied: dnaRefinement.applied,
      considered_feedback: dnaRefinement.considered_feedback,
      adjustments: dnaRefinement.adjustments,
    },
  };
  const paths = resolveQualityPaths(env);

  await Promise.all([
    writeFile(paths.block_scores_path, `${JSON.stringify(snapshot.block_scores, null, 2)}\n`, "utf8"),
    writeFile(paths.verified_combos_path, `${JSON.stringify(snapshot.verified_combos, null, 2)}\n`, "utf8"),
  ]);

  return snapshot;
}

function buildBlockScores(feedback: FeedbackRecord[]): BlockScoreRecord[] {
  const blockStats = new Map<string, { total: number; count: number }>();

  for (const record of feedback) {
    for (const blockId of record.blocks_used) {
      const current = blockStats.get(blockId) ?? { total: 0, count: 0 };
      current.total += record.overall_score;
      current.count += 1;
      blockStats.set(blockId, current);
    }
  }

  return [...blockStats.entries()]
    .map(([blockId, stats]) => {
      const averageScore = roundScore(stats.total / stats.count);

      return {
        block_id: blockId,
        average_score: averageScore,
        feedback_count: stats.count,
        rank: resolveBlockRank(averageScore, stats.count),
      };
    })
    .sort((left, right) => {
      if (right.average_score !== left.average_score) {
        return right.average_score - left.average_score;
      }

      return right.feedback_count - left.feedback_count;
    });
}

function buildVerifiedCombos(feedback: FeedbackRecord[]): VerifiedComboRecord[] {
  const comboStats = new Map<string, { total: number; count: number; blocks: string[] }>();

  for (const record of feedback) {
    if (record.overall_score < 4 || record.blocks_used.length === 0) {
      continue;
    }

    const blocks = [...new Set(record.blocks_used)];
    const comboKey = blocks.join(" + ");
    const current = comboStats.get(comboKey) ?? { total: 0, count: 0, blocks };
    current.total += record.overall_score;
    current.count += 1;
    comboStats.set(comboKey, current);
  }

  return [...comboStats.entries()]
    .map(([comboKey, stats]) => ({
      combo_key: comboKey,
      blocks: [...stats.blocks],
      average_score: roundScore(stats.total / stats.count),
      feedback_count: stats.count,
    }))
    .sort((left, right) => {
      if (right.average_score !== left.average_score) {
        return right.average_score - left.average_score;
      }

      return right.feedback_count - left.feedback_count;
    })
    .slice(0, 5);
}

function resolveBlockRank(averageScore: number, feedbackCount: number): BlockRank {
  if (averageScore >= 4) {
    return "gold";
  }

  if (averageScore >= 3) {
    return "normal";
  }

  if (averageScore < 2 && feedbackCount >= 10) {
    return "retired";
  }

  return "flagged";
}

function roundScore(value: number): number {
  return Number(value.toFixed(2));
}
