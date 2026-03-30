import { analyzeEngineCommand } from "./analyze-engine-command.js";
import { configEngineCommand } from "./config-engine-command.js";
import { createEngineCommand } from "./create-engine-command.js";
import { dashboardEngineCommand } from "./dashboard-engine-command.js";
import { doctorEngineCommand } from "./doctor-engine-command.js";
import { EXIT_CODE_INTERNAL_ERROR } from "./exit-codes.js";
import { executeEngineCommand } from "./execute-engine-command.js";
import { promptEngineCommand } from "./prompt-engine-command.js";
import { publishEngineCommand } from "./publish-engine-command.js";
import { renderEngineCommand } from "./render-engine-command.js";
import { runEngineCommand } from "./run-engine-command.js";
import { statsEngineCommand } from "./stats-engine-command.js";
import { ttsEngineCommand } from "./tts-engine-command.js";
import { uploadEngineCommand } from "./upload-engine-command.js";
import { wizardEngineCommand } from "./wizard-engine-command.js";

export const CLI_USAGE_TEXT =
  "Usage: engine <run|prompt|create|wizard|init|execute|tts|upload|config|doctor|analyze|render|publish|stats|dashboard> [request.json] [--json] [--simulate]";

interface WritableLike {
  write(chunk: string | Uint8Array): unknown;
}

export interface CliIo {
  stdout?: WritableLike;
  stderr?: WritableLike;
}

export async function main(
  argv: string[],
  io: CliIo = {},
): Promise<number> {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const [command, ...rest] = argv;
  const flags = rest.filter((value) => value.startsWith("--"));
  const positionals = rest.filter((value) => !value.startsWith("--"));
  const json = flags.includes("--json");
  const simulate = flags.includes("--simulate");
  const dry_run = flags.includes("--dry-run");

  if (!command) {
    stderr.write(`${CLI_USAGE_TEXT}\n`);
    return EXIT_CODE_INTERNAL_ERROR;
  }

  const result = await executeCommand(command, positionals, { json, simulate, dry_run });
  stdout.write(result.output);
  return result.exitCode;
}

export function runAsProcess(argv: string[] = process.argv.slice(2)): void {
  void main(argv)
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error: unknown) => {
      process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
      process.exit(EXIT_CODE_INTERNAL_ERROR);
    });
}

async function executeCommand(
  commandName: string,
  positionals: string[],
  options: { json: boolean; simulate: boolean; dry_run: boolean },
) {
  if (commandName === "config") {
    return configEngineCommand({ json: options.json });
  }

  if (commandName === "doctor") {
    return doctorEngineCommand({ json: options.json });
  }

  if (commandName === "stats") {
    return statsEngineCommand({ json: options.json });
  }

  if (commandName === "dashboard") {
    return dashboardEngineCommand({ json: options.json });
  }

  if (commandName === "wizard" || commandName === "init") {
    const [outputPath] = positionals;
    const resolvedPath = outputPath ?? "my-request.json";
    return wizardEngineCommand(resolvedPath);
  }

  if (commandName === "execute") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine execute <request.json> [--dry-run] [--json]\n",
      };
    }
    return executeEngineCommand(requestPath, { json: options.json, dry_run: options.dry_run });
  }

  if (commandName === "tts") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine tts <request.json> [--dry-run] [--json]\n",
      };
    }
    return ttsEngineCommand(requestPath, { json: options.json, dry_run: options.dry_run });
  }

  if (commandName === "upload") {
    const [requestPath, videoPath] = positionals;
    if (!requestPath || !videoPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine upload <request.json> <video.mp4> [--dry-run] [--json]\n",
      };
    }
    return uploadEngineCommand(requestPath, videoPath, { json: options.json, dry_run: options.dry_run });
  }

  if (commandName === "create") {
    const [profileId, outputPath] = positionals;

    if (!profileId || !outputPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine create <profile> <output.json> [--json]\n",
      };
    }

    return createEngineCommand(profileId, outputPath, { json: options.json });
  }

  const [requestPath] = positionals;

  if (
    !requestPath
    || (commandName !== "run"
      && commandName !== "prompt"
      && commandName !== "analyze"
      && commandName !== "render"
      && commandName !== "publish")
  ) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `${CLI_USAGE_TEXT}\n`,
    };
  }

  if (commandName === "analyze") {
    return analyzeEngineCommand(requestPath, { json: options.json });
  }

  if (commandName === "render") {
    return renderEngineCommand(requestPath, { json: options.json });
  }

  if (commandName === "publish") {
    return publishEngineCommand(requestPath, { json: options.json });
  }

  return commandName === "prompt"
    ? promptEngineCommand(requestPath, { json: options.json })
    : runEngineCommand(requestPath, { json: options.json, simulate: options.simulate });
}
