// src/cli/upload-engine-command.ts
import { writeFile } from "node:fs/promises";

import { resolveUploadAdapter } from "../adapters/upload/upload-adapter-registry.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { loadEngineRequest } from "./load-engine-request.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import {
  executeUpload,
  type ExecuteUploadResult,
} from "../execute/execute-upload.js";

function renderUploadOutput(result: ExecuteUploadResult, json: boolean): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;

  const lines: string[] = [
    `Upload Result (dry_run: ${result.dry_run})`,
    `Executed at: ${result.executed_at}`,
    `Platform: ${result.platform} | Adapter: ${result.adapter} | Status: ${result.status}`,
  ];

  if (result.post_url) lines.push(`URL: ${result.post_url}`);
  if (result.post_id) lines.push(`Post ID: ${result.post_id}`);
  if (result.error) lines.push(`Error: ${result.error}`);

  return lines.join("\n") + "\n";
}

export async function uploadEngineCommand(
  requestPath: string,
  videoPath: string,
  options: { json: boolean; dry_run: boolean },
): Promise<{ exitCode: number; output: string }> {
  try {
    const loaded = await loadEngineRequest(requestPath);

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: `Validation failed: ${loaded.validation.errors.map((e) => e.message).join(", ")}\n`,
      };
    }

    const context = resolvePlanningContext(loaded.request);
    const result = await executeUpload(context, videoPath, {
      dry_run: options.dry_run,
      resolveUploadAdapter,
    });

    const outputPath = requestPath.replace(/\.json$/, ".upload-result.json");
    try {
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    } catch {
      // writeFile failure does not affect exit code or output
    }

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderUploadOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
