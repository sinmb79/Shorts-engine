import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createDashboardServer } from "../../dashboard/backend/server.js";

test("createDashboardServer serves overview API responses", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-server-"));
  const server = createDashboardServer({
    rootDir: tempDir,
    promptDbPath: path.join(tempDir, "prompt-log.db"),
  });

  try {
    const listening = await server.start(0);
    const response = await fetch(`${listening.url}/api/overview`);
    const parsed = await response.json() as { recent_runs?: unknown[]; engine_status?: Record<string, number> };

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(parsed.recent_runs));
    assert.equal(typeof parsed.engine_status, "object");
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
