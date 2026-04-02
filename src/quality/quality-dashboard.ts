import { countGeneratedScenarios, listFeedbackRecords } from "./quality-db.js";
import {
  runEvolutionEngine,
  type BlockScoreRecord,
  type EvolutionSnapshot,
  type VerifiedComboRecord,
} from "./evolution-engine.js";

export interface QualityDashboard {
  schema_version: string;
  total_scenarios_generated: number;
  total_feedback_received: number;
  average_score: number | null;
  block_health: {
    gold: number;
    normal: number;
    flagged: number;
    retired: number;
  };
  taste_dna_accuracy: number | null;
  top_combos: VerifiedComboRecord[];
  top_blocks: BlockScoreRecord[];
  last_dna_refinement: EvolutionSnapshot["dna_refinement"];
}

export async function buildQualityDashboard(
  env: NodeJS.ProcessEnv = process.env,
): Promise<QualityDashboard> {
  const [totalScenariosGenerated, feedback, evolution] = await Promise.all([
    countGeneratedScenarios(env),
    listFeedbackRecords(env),
    runEvolutionEngine(env),
  ]);

  return {
    schema_version: "0.2.0",
    total_scenarios_generated: totalScenariosGenerated,
    total_feedback_received: feedback.length,
    average_score: computeAverageScore(feedback),
    block_health: summarizeBlockHealth(evolution),
    taste_dna_accuracy: computeTasteAccuracy(feedback),
    top_combos: evolution.verified_combos,
    top_blocks: evolution.block_scores.slice(0, 5),
    last_dna_refinement: evolution.dna_refinement,
  };
}

function computeAverageScore(
  feedback: Array<{ overall_score: number }>,
): number | null {
  if (feedback.length === 0) {
    return null;
  }

  const average = feedback.reduce((sum, record) => sum + record.overall_score, 0) / feedback.length;
  return Number(average.toFixed(2));
}

function computeTasteAccuracy(
  feedback: Array<{ taste_match: boolean | null }>,
): number | null {
  const matched = feedback.filter((record) => record.taste_match !== null);
  if (matched.length === 0) {
    return null;
  }

  const successCount = matched.filter((record) => record.taste_match).length;
  return Number(((successCount / matched.length) * 100).toFixed(1));
}

function summarizeBlockHealth(evolution: EvolutionSnapshot) {
  return evolution.block_scores.reduce(
    (summary, block) => {
      summary[block.rank] += 1;
      return summary;
    },
    {
      gold: 0,
      normal: 0,
      flagged: 0,
      retired: 0,
    },
  );
}
