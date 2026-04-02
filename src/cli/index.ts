#!/usr/bin/env node

import { analyzeEngineCommand } from "./analyze-engine-command.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
} from "./exit-codes.js";
import { configEngineCommand } from "./config-engine-command.js";
import { createEngineCommand } from "./create-engine-command.js";
import { doctorEngineCommand } from "./doctor-engine-command.js";
import { promptEngineCommand } from "./prompt-engine-command.js";
import { publishEngineCommand } from "./publish-engine-command.js";
import { renderEngineCommand } from "./render-engine-command.js";
import { runEngineCommand } from "./run-engine-command.js";
import { scenarioEngineCommand } from "./scenario-engine-command.js";
import { studiosEngineCommand } from "./studios-engine-command.js";
import { wizardEngineCommand } from "./wizard-engine-command.js";
import { executeEngineCommand } from "./execute-engine-command.js";
import { ttsEngineCommand } from "./tts-engine-command.js";
import { uploadEngineCommand } from "./upload-engine-command.js";

const args = process.argv.slice(2);
const [command, ...rest] = args;
const flags = rest.filter((value) => value.startsWith("--"));
const positionals = rest.filter((value) => !value.startsWith("--"));
const json = flags.includes("--json");
const simulate = flags.includes("--simulate");

if (!command) {
  process.stderr.write(
    "Usage: engine <run|prompt|create|wizard|execute|tts|upload|config|doctor|analyze|render|publish|scenario|studios> [request.json] [--json] [--simulate]\n",
  );
  process.exit(EXIT_CODE_INTERNAL_ERROR);
}

const dry_run = flags.includes("--dry-run");
const result = await executeCommand(command, positionals, rest, { json, simulate, dry_run });
process.stdout.write(result.output);
process.exit(result.exitCode);

async function executeCommand(
  commandName: string,
  positionals: string[],
  rawArgs: string[],
  options: { json: boolean; simulate: boolean; dry_run: boolean },
) {
  if (commandName === "scenario") {
    return scenarioEngineCommand(rawArgs, { json: options.json });
  }

  if (commandName === "studios") {
    return studiosEngineCommand(rawArgs, { json: options.json });
  }

  if (commandName === "config") {
    return configEngineCommand({ json: options.json });
  }

  if (commandName === "doctor") {
    return doctorEngineCommand({ json: options.json });
  }

  if (commandName === "wizard") {
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
      output: "Usage: engine <run|prompt|create|wizard|execute|tts|upload|config|doctor|analyze|render|publish|scenario|studios> [request.json] [--json] [--simulate]\n",
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
