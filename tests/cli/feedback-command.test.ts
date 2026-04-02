import * as assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { resolveQualityPaths } from "../../src/quality/quality-db.js";
import { runCli } from "../helpers/run-cli.js";

test("feedback stores a rating for a persisted scenario and updates evolution files", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-feedback-cli-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    const runResult = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"], { env });
    const runParsed = JSON.parse(runResult.stdout) as {
      scenario_plan?: { scenario_id?: string };
    };
    const scenarioId = runParsed.scenario_plan?.scenario_id;

    assert.equal(runResult.exitCode, 0);
    assert.equal(typeof scenarioId, "string");

    const feedbackResult = runCli(["feedback", scenarioId!, "--json"], {
      env,
      input: "5\ny\nhook strength, style fidelity\n\n",
    });
    const feedbackParsed = JSON.parse(feedbackResult.stdout) as {
      feedback?: {
        scenario_id?: string;
        overall_score?: number;
        taste_match?: boolean | null;
        good_aspects?: string[];
      };
      evolution?: {
        block_scores?: Array<{ block_id?: string }>;
        verified_combos?: Array<{ combo_key?: string }>;
      };
    };

    assert.equal(feedbackResult.exitCode, 0);
    assert.equal(feedbackParsed.feedback?.scenario_id, scenarioId);
    assert.equal(feedbackParsed.feedback?.overall_score, 5);
    assert.equal(feedbackParsed.feedback?.taste_match, true);
    assert.ok(feedbackParsed.feedback?.good_aspects?.includes("hook strength"));
    assert.ok((feedbackParsed.evolution?.block_scores?.length ?? 0) > 0);

    const paths = resolveQualityPaths(env);
    assert.equal(existsSync(paths.db_path), true);
    assert.equal(existsSync(paths.block_scores_path), true);
    assert.equal(existsSync(paths.verified_combos_path), true);

    const savedBlockScores = JSON.parse(readFileSync(paths.block_scores_path, "utf8")) as Array<{ rank?: string }>;
    assert.ok(savedBlockScores.some((record) => record.rank === "gold"));
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("feedback returns an error when the scenario id is unknown", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-feedback-cli-"));

  try {
    const result = runCli(["feedback", "missing-scenario", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
      input: "4\ny\nnice\nnone\n",
    });
    const parsed = JSON.parse(result.stdout) as { fatal_error?: string };

    assert.equal(result.exitCode, 1);
    assert.match(parsed.fatal_error ?? "", /Unknown scenario_id/);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
