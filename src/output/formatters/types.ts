import type { PlanningContext } from "../../cli/resolve-planning-context.js";
import type {
  LlmRefinementSummary,
  Platform,
  PromptResult,
  PublishPlan,
  RenderPlan,
} from "../../domain/contracts.js";

export type OutputFormatName =
  | "kling"
  | "runway"
  | "veo"
  | "pika"
  | "capcut"
  | "generic"
  | "human";

export interface FormatterContext {
  planningContext: PlanningContext;
  promptResult: PromptResult;
  renderPlan: RenderPlan;
  publishPlan: PublishPlan;
  llmRefinement: LlmRefinementSummary | null;
}

export interface FormattedOutput {
  format: OutputFormatName;
  title: string;
  description: string;
  content: string;
  copy_ready: boolean;
  metadata: {
    scenario_id: string;
    platform: Platform;
    duration_sec: number;
    hashtags: string[];
    warnings: string[];
    llm_status: LlmRefinementSummary["status"] | "offline";
  };
}
