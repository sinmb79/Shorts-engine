import { createInterface } from "node:readline";

import { submitFeedback } from "../quality/feedback-tracker.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
} from "./exit-codes.js";
import { renderFeedbackOutput } from "./render-feedback-output.js";

function usage(): string {
  return "Usage: engine feedback <scenario-id> [--json]\n";
}

interface FeedbackPromptSession {
  ask(question: string): Promise<string>;
  close(): void;
}

function createFeedbackInterface(): FeedbackPromptSession {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return {
    ask(question: string) {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    },
    close() {
      rl.close();
    },
  };
}

async function createBufferedFeedbackSession(): Promise<FeedbackPromptSession> {
  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }

  const answers = chunks.join("").split(/\r?\n/);
  let index = 0;

  return {
    async ask() {
      const value = answers[index] ?? "";
      index += 1;
      return value;
    },
    close() {
      return;
    },
  };
}

async function createFeedbackSession(): Promise<FeedbackPromptSession> {
  return process.stdin.isTTY ? createFeedbackInterface() : createBufferedFeedbackSession();
}

export async function feedbackEngineCommand(
  positionals: string[],
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  const [scenarioId] = positionals;

  if (!scenarioId) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: usage(),
    };
  }

  const session = await createFeedbackSession();

  try {
    const overallScore = Number.parseFloat(await session.ask("Overall score (1-5): "));
    const tasteMatchAnswer = (await session.ask("Did it match your taste? (y/n/skip): "))
      .trim()
      .toLowerCase();
    const goodAspects = parseAspectList(await session.ask("Good aspects (comma-separated): "));
    const badAspects = parseAspectList(await session.ask("Bad aspects (comma-separated): "));

    const result = await submitFeedback({
      scenario_id: scenarioId,
      overall_score: overallScore,
      taste_match: parseTasteMatch(tasteMatchAnswer),
      good_aspects: goodAspects,
      bad_aspects: badAspects,
    });

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderFeedbackOutput(result, options.json),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: options.json
        ? JSON.stringify({ fatal_error: message }, null, 2)
        : `${message}\n`,
    };
  } finally {
    session.close();
  }
}

function parseAspectList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTasteMatch(value: string): boolean | null {
  if (value === "y" || value === "yes") {
    return true;
  }

  if (value === "n" || value === "no") {
    return false;
  }

  return null;
}
