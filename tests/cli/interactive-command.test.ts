import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { seedTasteProfile } from "../helpers/seed-taste-profile.js";
import { runCli } from "../helpers/run-cli.js";

test("interactive builds a formatted short from prompts and saved taste DNA", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-interactive-cli-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    await seedTasteProfile(env, {
      profile_id: "interactive_profile",
    });

    const result = runCli(["interactive"], {
      env,
      input: "1\n\n\n\n\n\n\n",
    });

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /Template: Recipe 30s/);
    assert.match(result.stdout, /Taste profile: interactive_profile/);
    assert.match(result.stdout, /Build a 30-second youtube_shorts short/);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
