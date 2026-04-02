import type {
  AnalyzeResult,
  LearningState,
  MotionPlan,
  PlatformOutputSpec,
  QualityGateResult,
  RoutingDecision,
  ScoringResult,
} from "../domain/contracts.js";

export function buildAnalysisReport(input: {
  requestId: string;
  learningState: LearningState;
  motionPlan: MotionPlan;
  platformOutputSpec: PlatformOutputSpec;
  qualityGate: QualityGateResult;
  routing: RoutingDecision;
  scoring: ScoringResult;
}): AnalyzeResult {
  const {
    requestId,
    learningState,
    motionPlan,
    platformOutputSpec,
    qualityGate,
    routing,
    scoring,
  } = input;

  return {
    schema_version: "0.1",
    request_id: requestId,
    readiness: {
      prompt: qualityGate.pass,
      render: motionPlan.motion_sequence.length > 0 && qualityGate.pass,
      publish: platformOutputSpec.warnings.length < 5 && qualityGate.pass,
    },
    risk_summary: {
      quality_score: roundScore(qualityGate.overall_score / 100),
      cost_risk_score: scoring.cost_risk_score,
      learning_confidence: learningState.confidence,
    },
    quality_gate: {
      overall_score: qualityGate.overall_score,
      pass: qualityGate.pass,
      weakest_dimensions: [...qualityGate.retry_plan.focus_dimensions],
    },
    warning_count:
      platformOutputSpec.warnings.length +
      motionPlan.warnings.length +
      qualityGate.warnings.length,
    recommended_backend: routing.selected_backend,
  };
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
