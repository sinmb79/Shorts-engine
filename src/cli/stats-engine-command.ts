import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS } from "./exit-codes.js";
import { PromptTracker } from "../tracking/prompt-tracker.js";

export async function statsEngineCommand(
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  const tracker = new PromptTracker();

  try {
    const stats = tracker.getStats();

    if (options.json) {
      return {
        exitCode: EXIT_CODE_SUCCESS,
        output: `${JSON.stringify(stats, null, 2)}\n`,
      };
    }

    const lines = [
      `Tracked prompts: ${stats.total}`,
      `Average cost: ${stats.avg_cost}`,
      `By engine: ${Object.keys(stats.by_engine).length === 0 ? "none" : JSON.stringify(stats.by_engine)}`,
    ];

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: `${lines.join("\n")}\n`,
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  } finally {
    tracker.close();
  }
}
