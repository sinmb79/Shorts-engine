import { mkdtemp, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { runCli } from "../helpers/run-cli.js";

test("engine dashboard returns startup metadata in test mode", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-cli-"));

  try {
    const result = runCli(["dashboard", "--json"], {
      cwd: tempDir,
      env: {
        SHORTS_ENGINE_DASHBOARD_ONCE: "1",
        SHORTS_ENGINE_DASHBOARD_NO_OPEN: "1",
        SHORTS_ENGINE_DASHBOARD_PORT: "0",
      },
    });
    const parsed = JSON.parse(result.stdout) as {
      started?: boolean;
      url?: string;
      frontend_dir?: string;
    };

    assert.equal(result.exitCode, 0);
    assert.equal(parsed.started, true);
    assert.match(parsed.url ?? "", /^http:\/\/127\.0\.0\.1:/);
    assert.match(parsed.frontend_dir ?? "", /dashboard[\\/]frontend/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
