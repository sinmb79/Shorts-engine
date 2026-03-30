import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { PromptTracker } from "../../src/tracking/prompt-tracker.js";
import { runCli } from "../helpers/run-cli.js";

test("prints prompt tracker statistics in JSON", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-stats-"));
  const dbPath = path.join(tempDir, "prompt-log.db");
  const tracker = new PromptTracker(dbPath);

  try {
    tracker.record({
      engine: "veo3",
      prompt_text: "prompt one",
      request_id: "req_stats_1",
      platform: "youtube_shorts",
      duration_sec: 20,
      cost_usd: 0.1,
    });
    tracker.record({
      engine: "local",
      prompt_text: "prompt two",
      request_id: "req_stats_2",
      platform: "tiktok",
      duration_sec: 15,
      cost_usd: 0,
    });
    tracker.close();

    const result = runCli(["stats", "--json"], {
      env: { SHORTS_ENGINE_PROMPT_DB_PATH: dbPath },
    });
    const parsed = JSON.parse(result.stdout) as {
      total?: number;
      avg_cost?: number;
      by_engine?: Record<string, number>;
    };

    assert.equal(result.exitCode, 0);
    assert.equal(parsed.total, 2);
    assert.equal(parsed.avg_cost, 0.05);
    assert.equal(parsed.by_engine?.["veo3"], 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
