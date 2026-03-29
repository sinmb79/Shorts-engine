// src/execute/execute-tts.ts
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { TtsAdapter, TtsRequest, VoiceStyle } from "../adapters/tts/tts-adapter.js";
import type { ExecutionBackend } from "../domain/contracts.js";
import { resolveTtsAdapter as defaultResolveTtsAdapter } from "../adapters/tts/tts-adapter-registry.js";

export interface TtsNodeResult {
  node_id: string;
  adapter: string;
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteTtsResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  nodes: TtsNodeResult[];
  summary: {
    total: number;
    success: number;
    dry_run: number;
    error: number;
  };
}

export interface ExecuteTtsOptions {
  dry_run: boolean;
  output_dir?: string;
  resolveTtsAdapter?: (backend: ExecutionBackend) => Promise<TtsAdapter>;
}

const VOICE_STYLE_MAP: Record<string, VoiceStyle> = {
  curiosity: "neutral",
  question: "neutral",
  surprise: "energetic",
  cliffhanger: "dramatic",
};

export function buildTtsRequestFromContext(context: PlanningContext): TtsRequest {
  const intent = context.effective_request.base.intent;
  const constraints = context.effective_request.base.constraints;
  const hookType = context.effective_request.base.style.hook_type;

  return {
    text: `${intent.topic}. ${intent.goal}. ${intent.emotion}.`,
    language: constraints.language,
    voice_style: VOICE_STYLE_MAP[hookType] ?? "neutral",
    duration_hint_sec: context.platform_output_spec.effective_duration_sec,
  };
}

export async function executeTts(
  context: PlanningContext,
  options: ExecuteTtsOptions,
): Promise<ExecuteTtsResult> {
  const resolve = options.resolveTtsAdapter ?? defaultResolveTtsAdapter;
  const ttsRequest = buildTtsRequestFromContext(context);
  const nodes: TtsNodeResult[] = [];

  for (const node of context.execution_plan.nodes) {
    const adapter = await resolve(node.backend);
    const result = await adapter.synthesize(ttsRequest, {
      dry_run: options.dry_run,
      ...(options.output_dir !== undefined ? { output_dir: options.output_dir } : {}),
    });

    nodes.push({
      node_id: node.node_id,
      adapter: adapter.name,
      status: result.status,
      ...(result.output_path !== undefined ? { output_path: result.output_path } : {}),
      ...(result.error !== undefined ? { error: result.error } : {}),
      metadata: result.metadata,
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
