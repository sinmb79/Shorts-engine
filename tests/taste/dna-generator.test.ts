import * as assert from "node:assert/strict";
import { test } from "node:test";

import { loadTasteCatalog } from "../../src/taste-db/catalog-loader.js";
import { computeStyleVectorFromEntries, generateTasteProfile } from "../../src/taste/dna-generator.js";

test("single-entry DNA preserves the selected reference values", async () => {
  const catalog = await loadTasteCatalog({ SHORTS_ENGINE_HOME: "non-existent-test-home" });
  const interstellar = catalog.movies.find((entry) => entry.id === "interstellar");

  assert.ok(interstellar);

  const dna = computeStyleVectorFromEntries([interstellar]);
  assert.equal(dna.camera.scale, interstellar.style_vector.camera.scale);
  assert.equal(dna.hook.type, interstellar.style_vector.hook.type);
});

test("generates a blended taste profile and ranks nearest presets", async () => {
  const catalog = await loadTasteCatalog({ SHORTS_ENGINE_HOME: "non-existent-test-home" });
  const profile = generateTasteProfile(
    {
      movies: ["interstellar", "parasite", "moonlight"],
      visual_styles: ["neon_noir", "lofi_chill"],
      authors: ["haruki_murakami_books"],
    },
    catalog,
    {
      profile_id: "taste_test_profile",
      now: new Date("2026-04-02T00:00:00.000Z"),
    },
  );

  assert.equal(profile.profile_id, "taste_test_profile");
  assert.equal(profile.selections.movies.length, 3);
  assert.ok(profile.computed_dna.camera.scale > 0 && profile.computed_dna.camera.scale < 1);
  assert.equal(Object.keys(profile.nearest_presets.directors).length, 3);
  assert.equal(Object.keys(profile.nearest_presets.writers).length, 3);
  assert.ok(
    Object.keys(profile.nearest_presets.directors).some((presetId) =>
      ["christopher_nolan", "bong_joon_ho", "denis_villeneuve"].includes(presetId),
    ),
  );
});
