#!/usr/bin/env node

import {
  EXIT_CODE_INTERNAL_ERROR,
} from "./exit-codes.js";
import { runEngineCommand } from "./run-engine-command.js";

const args = process.argv.slice(2);
const [command, requestPath, ...flags] = args;

if (command !== "run" || !requestPath) {
  process.stderr.write(
    "Usage: engine run <request.json> [--json] [--simulate]\n",
  );
  process.exit(EXIT_CODE_INTERNAL_ERROR);
}

const json = flags.includes("--json");
const simulate = flags.includes("--simulate");

const result = await runEngineCommand(requestPath, { json, simulate });
process.stdout.write(result.output);
process.exit(result.exitCode);
