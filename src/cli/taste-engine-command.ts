import { createInterface } from "node:readline";

import { runCustomEntryWizard } from "../taste/custom-entry.js";
import { runTasteOnboarding } from "../taste/onboarding.js";
import {
  createBufferedTastePromptSession,
  createReadlineTastePromptSession,
} from "../taste/prompt-session.js";
import {
  loadTasteProfile,
  resetTasteProfile,
  resolveTastePaths,
} from "../taste/profile-manager.js";
import { refineTasteProfileFromFeedback } from "../quality/dna-refiner.js";
import { TASTE_SCHEMA_VERSION, type TasteCommandOutput } from "../taste/types.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
} from "./exit-codes.js";
import { renderTasteOutput } from "./render-taste-output.js";

function usage(): string {
  return "Usage: engine taste [show|reset|add|refine] [--json]\n";
}

function createTasteInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stderr,
  });
}

async function createTasteSession() {
  if (process.stdin.isTTY) {
    const rl = createTasteInterface();
    return {
      session: createReadlineTastePromptSession(rl),
      close() {
        rl.close();
      },
    };
  }

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }

  return {
    session: createBufferedTastePromptSession(chunks.join("")),
    close() {
      return;
    },
  };
}

export async function tasteEngineCommand(
  positionals: string[],
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  const [subcommand] = positionals;
  const tastePaths = resolveTastePaths();

  try {
    if (!subcommand) {
      const promptSession = await createTasteSession();

      try {
        const result = await runTasteOnboarding(promptSession.session);
        const output: TasteCommandOutput = {
          schema_version: TASTE_SCHEMA_VERSION,
          action: "saved_profile",
          profile: result.profile,
          profile_path: result.profile_path,
          catalog_counts: result.catalog_counts,
        };

        return {
          exitCode: EXIT_CODE_SUCCESS,
          output: renderTasteOutput(output, options.json),
        };
      } finally {
        promptSession.close();
      }
    }

    if (subcommand === "show") {
      const profile = await loadTasteProfile();
      const output: TasteCommandOutput = {
        schema_version: TASTE_SCHEMA_VERSION,
        action: "show_profile",
        profile,
        profile_path: tastePaths.profile_path,
      };

      return {
        exitCode: EXIT_CODE_SUCCESS,
        output: renderTasteOutput(output, options.json),
      };
    }

    if (subcommand === "reset") {
      const removed = await resetTasteProfile();
      const output: TasteCommandOutput = {
        schema_version: TASTE_SCHEMA_VERSION,
        action: "reset_profile",
        profile: null,
        profile_path: tastePaths.profile_path,
        removed,
      };

      return {
        exitCode: EXIT_CODE_SUCCESS,
        output: renderTasteOutput(output, options.json),
      };
    }

    if (subcommand === "add") {
      const promptSession = await createTasteSession();

      try {
        const result = await runCustomEntryWizard(promptSession.session);
        const output: TasteCommandOutput = {
          schema_version: TASTE_SCHEMA_VERSION,
          action: "add_custom_entry",
          profile: null,
          profile_path: tastePaths.profile_path,
          custom_entry: result.entry,
          custom_entries_path: result.custom_entries_path,
        };

        return {
          exitCode: EXIT_CODE_SUCCESS,
          output: renderTasteOutput(output, options.json),
        };
      } finally {
        promptSession.close();
      }
    }

    if (subcommand === "refine") {
      const result = await refineTasteProfileFromFeedback(process.env, { force: true });
      const output: TasteCommandOutput = {
        schema_version: TASTE_SCHEMA_VERSION,
        action: "refined_profile",
        profile: result.profile,
        profile_path: tastePaths.profile_path,
        adjustments: result.adjustments,
        considered_feedback: result.considered_feedback,
      };

      return {
        exitCode: EXIT_CODE_SUCCESS,
        output: renderTasteOutput(output, options.json),
      };
    }

    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: usage(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify({ fatal_error: message }, null, 2)
        : `${message}\n`,
    };
  }
}
