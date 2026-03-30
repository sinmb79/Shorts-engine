import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { getDashboardAnalytics } from "../../dashboard/backend/api-analytics.js";
import { PromptTracker } from "../../src/tracking/prompt-tracker.js";

test("getDashboardAnalytics returns stats and quality trend", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-analytics-"));
  const dbPath = path.join(tempDir, "prompt-log.db");
  const tracker = new PromptTracker(dbPath);

  try {
    tracker.record({
      engine: "veo3",
      prompt_text: "analytics prompt",
      request_id: "req_analytics_1",
      platform: "youtube_shorts",
      duration_sec: 20,
      cost_usd: 0.15,
      quality_score: 0.84,
    });

    const analytics = getDashboardAnalytics({ tracker });

    assert.equal(analytics.stats.total, 1);
    assert.equal(analytics.quality_trend.length, 1);
    assert.equal(analytics.quality_trend[0]?.quality_score, 0.84);
  } finally {
    tracker.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
