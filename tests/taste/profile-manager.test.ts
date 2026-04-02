import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { loadTasteCatalog } from "../../src/taste-db/catalog-loader.js";
import { generateTasteProfile } from "../../src/taste/dna-generator.js";
import {
  loadTasteProfile,
  resetTasteProfile,
  saveTasteProfile,
} from "../../src/taste/profile-manager.js";

test("saves, loads, and resets the taste profile in the configured home directory", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-taste-home-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    const catalog = await loadTasteCatalog(env);
    const profile = generateTasteProfile(
      {
        movies: ["interstellar", "parasite", "moonlight"],
        visual_styles: ["ghibli_dreamscape", "lofi_chill"],
        authors: [],
      },
      catalog,
      {
        profile_id: "taste_profile_storage_test",
        now: new Date("2026-04-02T00:00:00.000Z"),
      },
    );

    const savedPath = await saveTasteProfile(profile, env);
    const loadedProfile = await loadTasteProfile(env);

    assert.match(savedPath, /taste-profile\.json$/);
    assert.equal(loadedProfile?.profile_id, "taste_profile_storage_test");
    assert.equal(loadedProfile?.selections.movies.length, 3);

    const removed = await resetTasteProfile(env);
    const afterReset = await loadTasteProfile(env);

    assert.equal(removed, true);
    assert.equal(afterReset, null);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
