import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { getDashboardCostBreakdown } from "../../dashboard/backend/api-cost.js";
import { PromptTracker } from "../../src/tracking/prompt-tracker.js";

test("getDashboardCostBreakdown returns daily, weekly, and monthly summaries", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-cost-"));
  const dbPath = path.join(tempDir, "prompt-log.db");
  const tracker = new PromptTracker(dbPath);

  try {
    tracker.record({
      engine: "veo3",
      prompt_text: "cost prompt",
      request_id: "req_cost_1",
      platform: "youtube_shorts",
      duration_sec: 20,
      cost_usd: 0.3,
    });

    const cost = getDashboardCostBreakdown({ tracker });

    assert.equal(cost.daily.total_cost, 0.3);
    assert.equal(cost.weekly.total_cost, 0.3);
    assert.equal(cost.monthly.total_cost, 0.3);
    assert.equal(cost.daily.by_engine["veo3"], 0.3);
  } finally {
    tracker.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
