// src/execute/execute-upload.ts
import type { Platform } from "../domain/contracts.js";
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { UploadAdapter, UploadRequest } from "../adapters/upload/upload-adapter.js";
import { resolveUploadAdapter as defaultResolveUploadAdapter } from "../adapters/upload/upload-adapter-registry.js";

export interface ExecuteUploadResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  platform: Platform;
  adapter: string;
  status: "success" | "error" | "dry_run";
  post_url?: string;
  post_id?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteUploadOptions {
  dry_run: boolean;
  resolveUploadAdapter?: (platform: Platform) => Promise<UploadAdapter>;
}

export function buildUploadRequest(
  context: PlanningContext,
  videoPath: string,
): UploadRequest {
  const intent = context.effective_request.base.intent;
  const platform = context.platform_output_spec.platform;

  const hashtags = [
    `#${intent.theme.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `#${intent.platform.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `#${intent.topic.split(" ").slice(0, 2).join("").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  ].filter((h): h is string => Boolean(h));

  return {
    video_path: videoPath,
    title: intent.topic,
    description: `${intent.goal}. Theme: ${intent.theme}.`,
    hashtags,
    platform,
  };
}

export async function executeUpload(
  context: PlanningContext,
  videoPath: string,
  options: ExecuteUploadOptions,
): Promise<ExecuteUploadResult> {
  const resolve = options.resolveUploadAdapter ?? defaultResolveUploadAdapter;
  const uploadRequest = buildUploadRequest(context, videoPath);
  const adapter = await resolve(uploadRequest.platform);
  const result = await adapter.upload(uploadRequest, { dry_run: options.dry_run });

  return {
    schema_version: "0.1",
    executed_at: new Date().toISOString(),
    dry_run: options.dry_run,
    platform: uploadRequest.platform,
    adapter: adapter.name,
    status: result.status,
    ...(result.post_url !== undefined ? { post_url: result.post_url } : {}),
    ...(result.post_id !== undefined ? { post_id: result.post_id } : {}),
    ...(result.error !== undefined ? { error: result.error } : {}),
    metadata: result.metadata,
  };
}
