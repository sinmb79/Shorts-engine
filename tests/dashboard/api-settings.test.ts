import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  readDashboardSettings,
  updateDashboardSettings,
} from "../../dashboard/backend/api-settings.js";

test("readDashboardSettings and updateDashboardSettings work against config files", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-dashboard-settings-"));
  const configDir = path.join(tempDir, "config");

  try {
    await mkdir(configDir, { recursive: true });
    await writeFile(path.join(configDir, "engine.json"), "{\n  \"name\": \"before\"\n}\n", "utf8");
    await writeFile(path.join(configDir, "user-profile.json"), "{\n  \"language\": \"ko\"\n}\n", "utf8");

    const before = await readDashboardSettings(tempDir);
    assert.match(before["engine.json"] ?? "", /before/);

    await updateDashboardSettings(tempDir, {
      "engine.json": "{\n  \"name\": \"after\"\n}\n",
    });

    const after = await readDashboardSettings(tempDir);
    assert.match(after["engine.json"] ?? "", /after/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
