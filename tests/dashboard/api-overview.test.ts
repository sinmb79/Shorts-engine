import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { getDashboardOverview } from "../../dashboard/backend/api-overview.js";
import { PromptTracker } from "../../src/tracking/prompt-tracker.js";

test("getDashboardOverview returns recent runs and daily cost summary", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-overview-"));
  const dbPath = path.join(tempDir, "prompt-log.db");
  const tracker = new PromptTracker(dbPath);

  try {
    tracker.record({
      engine: "veo3",
      prompt_text: "overview prompt",
      request_id: "req_overview_1",
      platform: "youtube_shorts",
      corner: "explainer",
      duration_sec: 20,
      cost_usd: 0.2,
      quality_score: 0.9,
    });

    const overview = getDashboardOverview({ tracker });

    assert.equal(overview.recent_runs.length, 1);
    assert.equal(overview.daily_cost, 0.2);
    assert.equal(overview.engine_status["veo3"], 1);
  } finally {
    tracker.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
