import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { runCli } from "../helpers/run-cli.js";

test("quality dashboard summarizes persisted feedback in JSON", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-quality-cli-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    const runResult = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"], { env });
    const runParsed = JSON.parse(runResult.stdout) as {
      scenario_plan?: { scenario_id?: string };
    };

    assert.equal(runResult.exitCode, 0);

    const feedbackResult = runCli(["feedback", runParsed.scenario_plan?.scenario_id ?? "", "--json"], {
      env,
      input: "5\ny\nstyle fidelity, pacing\n\n",
    });
    assert.equal(feedbackResult.exitCode, 0);

    const qualityResult = runCli(["quality", "--json"], { env });
    const qualityParsed = JSON.parse(qualityResult.stdout) as {
      total_scenarios_generated?: number;
      total_feedback_received?: number;
      average_score?: number | null;
      taste_dna_accuracy?: number | null;
      top_combos?: Array<{ combo_key?: string }>;
      block_health?: { gold?: number };
    };

    assert.equal(qualityResult.exitCode, 0);
    assert.equal(qualityParsed.total_scenarios_generated, 1);
    assert.equal(qualityParsed.total_feedback_received, 1);
    assert.equal(qualityParsed.average_score, 5);
    assert.equal(qualityParsed.taste_dna_accuracy, 100);
    assert.ok((qualityParsed.top_combos?.length ?? 0) > 0);
    assert.ok((qualityParsed.block_health?.gold ?? 0) > 0);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("quality dashboard prints a readable empty-state summary", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-quality-cli-"));

  try {
    const result = runCli(["quality"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
    });

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /Total scenarios generated: 0/);
    assert.match(result.stdout, /Average score: n\/a/);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
