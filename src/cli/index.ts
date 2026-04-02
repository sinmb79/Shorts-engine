#!/usr/bin/env node

import { analyzeEngineCommand } from "./analyze-engine-command.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
} from "./exit-codes.js";
import { configEngineCommand } from "./config-engine-command.js";
import { createEngineCommand } from "./create-engine-command.js";
import { doctorEngineCommand } from "./doctor-engine-command.js";
import { feedbackEngineCommand } from "./feedback-engine-command.js";
import { formatEngineCommand } from "./format-engine-command.js";
import { interactiveEngineCommand } from "./interactive-engine-command.js";
import { promptEngineCommand } from "./prompt-engine-command.js";
import { publishEngineCommand } from "./publish-engine-command.js";
import { qualityEngineCommand } from "./quality-engine-command.js";
import { renderEngineCommand } from "./render-engine-command.js";
import { runEngineCommand } from "./run-engine-command.js";
import { tasteEngineCommand } from "./taste-engine-command.js";
import { wizardEngineCommand } from "./wizard-engine-command.js";
import { executeEngineCommand } from "./execute-engine-command.js";
import { ttsEngineCommand } from "./tts-engine-command.js";
import { uploadEngineCommand } from "./upload-engine-command.js";

const args = process.argv.slice(2);
const [command, ...rest] = args;
const parsedArgs = parseCommandArgs(rest);
const json = parsedArgs.flags.has("--json");
const simulate = parsedArgs.flags.has("--simulate");

if (!command) {
  process.stderr.write(
    "Usage: engine <run|prompt|create|wizard|interactive|execute|tts|upload|config|doctor|analyze|render|publish|taste|feedback|quality|format> [request.json] [--json] [--simulate]\n",
  );
  process.exit(EXIT_CODE_INTERNAL_ERROR);
}

const dry_run = parsedArgs.flags.has("--dry-run");
const llm = parsedArgs.flags.has("--llm");
const trend_aware = parsedArgs.flags.has("--trend-aware");
const result = await executeCommand(command, parsedArgs.positionals, {
  json,
  simulate,
  dry_run,
  llm,
  trend_aware,
  provider: parsedArgs.values.get("--provider") ?? null,
  output: parsedArgs.values.get("--output") ?? null,
  template: parsedArgs.values.get("--template") ?? null,
});
process.stdout.write(result.output);
process.exit(result.exitCode);

async function executeCommand(
  commandName: string,
  positionals: string[],
  options: {
    json: boolean;
    simulate: boolean;
    dry_run: boolean;
    llm: boolean;
    trend_aware: boolean;
    provider: string | null;
    output: string | null;
    template: string | null;
  },
) {
  if (commandName === "config") {
    return configEngineCommand({ json: options.json });
  }

  if (commandName === "doctor") {
    return doctorEngineCommand({ json: options.json });
  }

  if (commandName === "taste") {
    return tasteEngineCommand(positionals, { json: options.json });
  }

  if (commandName === "feedback") {
    return feedbackEngineCommand(positionals, { json: options.json });
  }

  if (commandName === "quality") {
    return qualityEngineCommand({ json: options.json });
  }

  if (commandName === "interactive") {
    return interactiveEngineCommand({
      json: options.json,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "format") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine format <request.json> [--output kling|runway|veo|pika|capcut|generic|human|all] [--llm] [--provider <name>] [--json]\n",
      };
    }
    return formatEngineCommand(requestPath, {
      json: options.json,
      llm: options.llm,
      provider: options.provider,
      output: options.output,
      trend_aware: options.trend_aware,
    });
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
    return executeEngineCommand(requestPath, {
      json: options.json,
      dry_run: options.dry_run,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "tts") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine tts <request.json> [--dry-run] [--json]\n",
      };
    }
    return ttsEngineCommand(requestPath, {
      json: options.json,
      dry_run: options.dry_run,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "upload") {
    const [requestPath, videoPath] = positionals;
    if (!requestPath || !videoPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine upload <request.json> <video.mp4> [--dry-run] [--json]\n",
      };
    }
    return uploadEngineCommand(requestPath, videoPath, {
      json: options.json,
      dry_run: options.dry_run,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "create") {
    if (options.template) {
      const [outputPath] = positionals;

      if (!outputPath) {
        return {
          exitCode: EXIT_CODE_INTERNAL_ERROR,
          output: "Usage: engine create --template <template-id> <output.json> [--json]\n",
        };
      }

      return createEngineCommand(options.template, outputPath, {
        json: options.json,
        source: "template",
      });
    }

    const [profileId, outputPath] = positionals;

    if (!profileId || !outputPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine create <profile> <output.json> [--json]\n",
      };
    }

    return createEngineCommand(profileId, outputPath, {
      json: options.json,
      source: "profile",
    });
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
      output: "Usage: engine <run|prompt|create|wizard|interactive|execute|tts|upload|config|doctor|analyze|render|publish|taste|feedback|quality|format> [request.json] [--json] [--simulate]\n",
    };
  }

  if (commandName === "analyze") {
    return analyzeEngineCommand(requestPath, {
      json: options.json,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "render") {
    return renderEngineCommand(requestPath, {
      json: options.json,
      llm: options.llm,
      provider: options.provider,
      trend_aware: options.trend_aware,
    });
  }

  if (commandName === "publish") {
    return publishEngineCommand(requestPath, {
      json: options.json,
      llm: options.llm,
      provider: options.provider,
      trend_aware: options.trend_aware,
    });
  }

  return commandName === "prompt"
    ? promptEngineCommand(requestPath, {
        json: options.json,
        llm: options.llm,
        provider: options.provider,
        trend_aware: options.trend_aware,
      })
    : runEngineCommand(requestPath, {
        json: options.json,
        simulate: options.simulate,
        llm: options.llm,
        provider: options.provider,
        trend_aware: options.trend_aware,
      });
}

function parseCommandArgs(tokens: string[]): {
  flags: Set<string>;
  values: Map<string, string>;
  positionals: string[];
} {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const positionals: string[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!;
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const [rawFlag, inlineValue] = token.split("=", 2);
    const flag = rawFlag!;
    if (inlineValue !== undefined) {
      values.set(flag, inlineValue);
      continue;
    }

    const next = tokens[index + 1];
    if (
      (flag === "--provider" || flag === "--output" || flag === "--template")
      && next
      && !next.startsWith("--")
    ) {
      values.set(flag, next);
      index += 1;
      continue;
    }

    flags.add(flag);
  }

  return { flags, values, positionals };
}
