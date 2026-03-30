import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { PromptTracker } from "../../src/tracking/prompt-tracker.js";

test("PromptTracker records entries, returns filtered history, and calculates stats", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-tracker-"));
  const dbPath = path.join(tempDir, "prompt-log.db");
  const tracker = new PromptTracker(dbPath);

  try {
    tracker.record({
      engine: "veo3",
      prompt_text: "prompt one",
      request_id: "req_1",
      platform: "youtube_shorts",
      corner: "explainer",
      duration_sec: 20,
      cost_usd: 0.12,
      quality_score: 0.82,
      micro_signals: "{\"hook_strength\":0.8}",
    });
    tracker.record({
      engine: "local",
      prompt_text: "prompt two",
      request_id: "req_2",
      platform: "tiktok",
      duration_sec: 15,
      cost_usd: 0,
    });

    const history = tracker.getHistory();
    const veoHistory = tracker.getHistory("veo3");
    const stats = tracker.getStats();

    assert.equal(history.length, 2);
    assert.equal(veoHistory.length, 1);
    assert.equal(veoHistory[0]?.engine, "veo3");
    assert.equal(stats.total, 2);
    assert.equal(stats.by_engine["veo3"], 1);
    assert.equal(stats.by_engine["local"], 1);
    assert.equal(stats.avg_cost, 0.06);
  } finally {
    tracker.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
