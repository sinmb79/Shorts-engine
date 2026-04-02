import { insertFeedbackRecord, loadGeneratedScenario, type FeedbackRecord } from "./quality-db.js";
import { runEvolutionEngine, type EvolutionSnapshot } from "./evolution-engine.js";

export interface FeedbackSubmissionInput {
  scenario_id: string;
  overall_score: number;
  good_aspects: string[];
  bad_aspects: string[];
  taste_match: boolean | null;
}

export interface FeedbackSubmissionResult {
  feedback: FeedbackRecord;
  evolution: EvolutionSnapshot;
}

export async function submitFeedback(
  input: FeedbackSubmissionInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackSubmissionResult> {
  if (!Number.isFinite(input.overall_score) || input.overall_score < 1 || input.overall_score > 5) {
    throw new Error("overall_score must be between 1 and 5.");
  }

  const scenario = await loadGeneratedScenario(input.scenario_id, env);
  if (!scenario) {
    throw new Error(`Unknown scenario_id: ${input.scenario_id}`);
  }

  const feedback = await insertFeedbackRecord(
    {
      scenario_id: input.scenario_id,
      overall_score: Math.round(input.overall_score * 10) / 10,
      good_aspects: normalizeAspectList(input.good_aspects),
      bad_aspects: normalizeAspectList(input.bad_aspects),
      taste_match: input.taste_match,
    },
    env,
  );
  const evolution = await runEvolutionEngine(env);

  return {
    feedback,
    evolution,
  };
}

function normalizeAspectList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
