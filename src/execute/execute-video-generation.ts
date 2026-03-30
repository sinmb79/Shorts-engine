import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { VideoGenerationAdapter, VideoGenerationPrompt } from "../adapters/video/video-generation-adapter.js";
import type { ExecutionBackend } from "../domain/contracts.js";
import { resolveAdapter as defaultResolveAdapter } from "../adapters/video/adapter-registry.js";
import { aggregateScore, scoreMicroSignals } from "../quality/micro-signals.js";
import { createRequestId } from "../shared/request-id.js";
import type { PromptTrackerLike } from "../tracking/prompt-tracker.js";

export interface ExecuteNodeResult {
  node_id: string;
  adapter: string;
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteVideoResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  nodes: ExecuteNodeResult[];
  summary: {
    total: number;
    success: number;
    dry_run: number;
    error: number;
  };
}

export interface ExecuteOptions {
  dry_run: boolean;
  requestId?: string;
  promptTracker?: PromptTrackerLike;
  resolveAdapter?: (backend: ExecutionBackend) => Promise<VideoGenerationAdapter>;
}

export function buildPromptFromPlanningContext(
  context: PlanningContext,
): VideoGenerationPrompt {
  const spec = context.platform_output_spec;
  const motion = context.motion_plan;
  const motionNote = motion.motion_sequence[0]?.motion;

  const prompt: VideoGenerationPrompt = {
    text_prompt: context.effective_request.base.intent.topic,
    duration_sec: spec.effective_duration_sec,
    aspect_ratio: "9:16",
    style_tags: [
      context.effective_request.base.style.pacing_profile,
      context.effective_request.base.style.hook_type,
    ],
  };

  if (motionNote !== undefined) {
    prompt.motion_notes = motionNote;
  }

  return prompt;
}

export async function executeVideoGeneration(
  context: PlanningContext,
  options: ExecuteOptions,
): Promise<ExecuteVideoResult> {
  const resolve = options.resolveAdapter ?? defaultResolveAdapter;
  const prompt = buildPromptFromPlanningContext(context);
  const requestId = options.requestId ?? createRequestId(context.effective_request.base);
  const microSignals = scoreMicroSignals(context);
  const qualityScore = aggregateScore(microSignals);
  const nodes: ExecuteNodeResult[] = [];

  for (const [index, node] of context.execution_plan.nodes.entries()) {
    const adapter = await resolve(node.backend);
    const result = await adapter.generate(prompt, { dry_run: options.dry_run });

    const nodeResult: ExecuteNodeResult = {
      node_id: node.node_id,
      adapter: adapter.name,
      status: result.status,
      metadata: result.metadata,
    };

    if (result.output_path !== undefined) {
      nodeResult.output_path = result.output_path;
    }

    if (result.error !== undefined) {
      nodeResult.error = result.error;
    }

    nodes.push(nodeResult);

    options.promptTracker?.record({
      engine: adapter.name,
      prompt_text: [
        prompt.text_prompt,
        `motion:${prompt.motion_notes ?? "n/a"}`,
        `styles:${prompt.style_tags.join(",")}`,
      ].join(" | "),
      request_id: requestId,
      platform: context.effective_request.base.intent.platform,
      corner: context.effective_request.base.intent.theme,
      duration_sec: prompt.duration_sec,
      cost_usd: Number((node.estimated_cost ?? 0).toFixed(2)),
      quality_score: qualityScore,
      micro_signals: JSON.stringify(microSignals),
    });
  }

  const summary = {
    total: nodes.length,
    success: nodes.filter((n) => n.status === "success").length,
    dry_run: nodes.filter((n) => n.status === "dry_run").length,
    error: nodes.filter((n) => n.status === "error").length,
  };

  return {
    schema_version: "0.1",
    executed_at: new Date().toISOString(),
    dry_run: options.dry_run,
    nodes,
    summary,
  };
}
