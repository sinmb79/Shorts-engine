export type Platform = "youtube_shorts" | "tiktok" | "instagram_reels";

export type BudgetTier = "low" | "balanced" | "high";

export type QualityTier = "low" | "balanced" | "premium";

export type PreferredEngine = "cache" | "local" | "gpu" | "sora" | "premium";
export type ExecutionBackend = "cache" | "local" | "gpu" | "premium";

export interface EngineIntent {
  topic: string;
  subject: string;
  goal: string;
  emotion: string;
  platform: Platform;
  theme: string;
  duration_sec: number;
}

export interface EngineConstraints {
  language: string;
  budget_tier: BudgetTier;
  quality_tier: QualityTier;
  visual_consistency_required: boolean;
  content_policy_safe: boolean;
}

export interface EngineStyle {
  hook_type: string;
  pacing_profile: string;
  caption_style: string;
  camera_language: string;
}

export interface EngineBackend {
  preferred_engine: PreferredEngine;
  allow_fallback: boolean;
  batch_size?: number;
  gpu_available?: boolean;
}

export interface EngineOutput {
  type: string;
}

export interface EngineRequest {
  version: string;
  intent: EngineIntent;
  constraints: EngineConstraints;
  style: EngineStyle;
  backend: EngineBackend;
  output: EngineOutput;
}

export interface NormalizedRequestDerived {
  resolved_platform_profile: Platform;
  resolved_duration_sec: number;
  resolved_aspect_ratio: "9:16";
  premium_allowed: boolean;
}

export interface NormalizedRequest {
  base: EngineRequest;
  derived: NormalizedRequestDerived;
}

export interface ScoringResult {
  candidate_score: number;
  quality_tier_score: number;
  premium_eligibility_score: number;
  cost_risk_score: number;
}

export interface RoutingDecision {
  selected_backend: ExecutionBackend;
  fallback_backend: Exclude<ExecutionBackend, "cache"> | null;
  premium_allowed: boolean;
  reason_codes: string[];
}

export type ExecutionNodeType =
  | "policy"
  | "adapter"
  | "formatter"
  | "quality"
  | "candidate";

export interface ExecutionPlanNode {
  node_id: string;
  node_type: ExecutionNodeType;
  backend: ExecutionBackend;
  estimated_cost: number;
  actual_cost: number;
  retry_cost: number;
  cost_efficiency_score: number;
  retry_count: number;
  fallback_node: string | null;
  skip_allowed: boolean;
  failure_severity: ErrorSeverity;
}

export interface ExecutionPlan {
  nodes: ExecutionPlanNode[];
  edges: [string, string][];
}

export type PipelineStatus =
  | "success"
  | "success_with_fallback"
  | "partial_success"
  | "blocked"
  | "skipped_low_priority";

export interface RecoveryPath {
  trigger_node: string;
  failure_code: PolicyNodeErrorCode;
  attempts: string[];
  final_status: PipelineStatus;
}

export interface RecoverySimulation {
  normal_path: string[];
  recovery_paths: RecoveryPath[];
}

export interface EngineRunResult {
  schema_version: string;
  request_id: string;
  validation: ValidationResult;
  normalized_request: NormalizedRequest | null;
  scoring: ScoringResult | null;
  routing: RoutingDecision | null;
  execution_plan: ExecutionPlan | null;
  recovery_simulation: RecoverySimulation | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: EngineError[];
}

export type PipelineStage =
  | "validate"
  | "normalize"
  | "score"
  | "route"
  | "build_execution_plan"
  | "simulate_recovery"
  | "render_output";

export type PipelineErrorCode =
  | "validation_error"
  | "normalization_error"
  | "scoring_error"
  | "routing_error"
  | "plan_build_error"
  | "simulation_error";

export type PolicyNodeErrorCode =
  | "timeout"
  | "unavailable_backend"
  | "policy_blocked"
  | "cost_limit_exceeded"
  | "quality_below_threshold";

export type EngineErrorCode = PipelineErrorCode | PolicyNodeErrorCode;

export type ErrorSeverity = "info" | "warning" | "error";

export interface EngineError {
  code: EngineErrorCode;
  message: string;
  stage: PipelineStage;
  node_id: string | null;
  severity: ErrorSeverity;
  retryable: boolean;
  details: Record<string, unknown>;
}
