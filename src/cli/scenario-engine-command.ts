import { buildNarrativePayload } from "../scenario/build-narrative-payload.js";
import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS } from "./exit-codes.js";
import { renderScenarioOutput } from "./render-scenario-output.js";

export async function scenarioEngineCommand(
  args: string[],
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  const studioId = readFlagValue(args, "--studio");
  const topic = readFlagValue(args, "--topic");

  if (!studioId || !topic) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: "Usage: engine scenario --studio <studio_id> --topic <topic> [--subject <subject>] [--goal <goal>] [--emotion <emotion>] [--json]\n",
    };
  }

  const subject = readFlagValue(args, "--subject") ?? topic;
  const goal = readFlagValue(args, "--goal") ?? "turn tension into a clear emotional shift";
  const emotion = readFlagValue(args, "--emotion") ?? "wonder";

  try {
    const payload = buildNarrativePayload({
      studio_id: studioId as never,
      topic,
      subject,
      goal,
      emotion,
    });

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderScenarioOutput(payload, options.json),
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
