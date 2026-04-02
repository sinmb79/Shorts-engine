import { writeFile } from "node:fs/promises";

import { resolveTtsAdapter } from "../adapters/tts/tts-adapter-registry.js";
import { persistGeneratedScenario } from "../quality/persist-generated-scenario.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { loadEngineRequest } from "./load-engine-request.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import {
  executeTts,
  type ExecuteTtsResult,
} from "../execute/execute-tts.js";

function renderTtsOutput(result: ExecuteTtsResult, json: boolean): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;

  const lines: string[] = [
    `TTS Result (dry_run: ${result.dry_run})`,
    `Executed at: ${result.executed_at}`,
    `Nodes: ${result.summary.total} total / ${result.summary.success} success / ${result.summary.dry_run} dry_run / ${result.summary.error} error`,
    "",
  ];

  for (const node of result.nodes) {
    lines.push(`  [${node.status}] ${node.node_id} → adapter: ${node.adapter}`);
    if (node.output_path) lines.push(`    output: ${node.output_path}`);
    if (node.error) lines.push(`    error: ${node.error}`);
  }

  return lines.join("\n") + "\n";
}

export async function ttsEngineCommand(
  requestPath: string,
  options: { json: boolean; dry_run: boolean; trend_aware?: boolean },
): Promise<{ exitCode: number; output: string }> {
  try {
    const loaded = await loadEngineRequest(requestPath);

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: `Validation failed: ${loaded.validation.errors.map((e) => e.message).join(", ")}\n`,
      };
    }

    const context = await resolvePlanningContext(loaded.request, {
      trend_aware: options.trend_aware ?? false,
    });
    await persistGeneratedScenario(context);
    const result = await executeTts(context, {
      dry_run: options.dry_run,
      resolveTtsAdapter,
    });

    const outputPath = requestPath.replace(/\.json$/, ".tts-result.json");
    try {
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    } catch {
      // writeFile failure does not affect exit code or output
    }

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderTtsOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
