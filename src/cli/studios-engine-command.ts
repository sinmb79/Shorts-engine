import { listStudioDefinitions, loadStudioDefinition } from "../scenario/load-studio-definition.js";
import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS } from "./exit-codes.js";
import { renderStudioDetailOutput, renderStudiosListOutput } from "./render-studios-output.js";

export async function studiosEngineCommand(
  args: string[],
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  if (args.includes("--list")) {
    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderStudiosListOutput(listStudioDefinitions(), options.json),
    };
  }

  const studioId = readFlagValue(args, "--show");
  if (!studioId) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: "Usage: engine studios --list [--json] | engine studios --show <studio_id> [--json]\n",
    };
  }

  try {
    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderStudioDetailOutput(loadStudioDefinition(studioId as never), options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify(
            { fatal_error: error instanceof Error ? error.message : "Unknown error" },
            null,
            2,
          )
        : `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}

function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}
