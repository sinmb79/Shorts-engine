import { mkdtemp, rm, stat } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { writeDefaultConfigSet } from "../../src/config/write-default-config-set.js";

test("writeDefaultConfigSet creates the default runtime config files", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-config-scaffold-"));

  try {
    await writeDefaultConfigSet(tempDir);

    await stat(path.join(tempDir, "config", "engine.json"));
    await stat(path.join(tempDir, "config", "shorts-config.json"));
    await stat(path.join(tempDir, "config", "prompt-styles.json"));
    await stat(path.join(tempDir, "config", "user-profile.json"));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
