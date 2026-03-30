import type {
  AnalyzeResult,
} from "../domain/contracts.js";
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import { analyzeHook } from "../quality/hook-optimizer.js";
import { aggregateScore, scoreMicroSignals } from "../quality/micro-signals.js";

export function buildAnalysisReport(input: {
  requestId: string;
  planningContext: PlanningContext;
}): AnalyzeResult {
  const { requestId, planningContext } = input;
  const microSignals = scoreMicroSignals(planningContext);
  const hookAnalysis = analyzeHook(planningContext);

  return {
    schema_version: "0.1",
    request_id: requestId,
    readiness: {
      prompt: true,
      render: planningContext.motion_plan.motion_sequence.length > 0,
      publish: planningContext.platform_output_spec.warnings.length < 5,
    },
    risk_summary: {
      quality_score: roundScore(
        (
          planningContext.scoring.candidate_score +
          planningContext.scoring.quality_tier_score +
          aggregateScore(microSignals)
        ) / 3,
      ),
      cost_risk_score: planningContext.scoring.cost_risk_score,
      learning_confidence: planningContext.learning_state.confidence,
    },
    micro_signals: microSignals,
    hook_analysis: hookAnalysis,
    warning_count:
      planningContext.platform_output_spec.warnings.length +
      planningContext.motion_plan.warnings.length,
    recommended_backend: planningContext.routing.selected_backend,
  };
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
