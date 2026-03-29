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

const args = process.argv.slice(2);
const [command, ...rest] = args;
const flags = rest.filter((value) => value.startsWith("--"));
const positionals = rest.filter((value) => !value.startsWith("--"));
const json = flags.includes("--json");
const simulate = flags.includes("--simulate");

if (!command) {
  process.stderr.write(
    "Usage: engine <run|prompt|create|config|doctor|analyze|render|publish> [request.json] [--json] [--simulate]\n",
  );
  process.exit(EXIT_CODE_INTERNAL_ERROR);
}

const result = await executeCommand(command, positionals, { json, simulate });
process.stdout.write(result.output);
process.exit(result.exitCode);

async function executeCommand(
  commandName: string,
  positionals: string[],
  options: { json: boolean; simulate: boolean },
) {
  if (commandName === "config") {
    return configEngineCommand({ json: options.json });
  }

  if (commandName === "doctor") {
    return doctorEngineCommand({ json: options.json });
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
      output: "Usage: engine <run|prompt|create|config|doctor|analyze|render|publish> [request.json] [--json] [--simulate]\n",
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
