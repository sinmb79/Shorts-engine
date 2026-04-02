import * as assert from "node:assert/strict";
import { test } from "node:test";

import { buildCustomTasteEntry } from "../../src/taste/custom-entry.js";

test("builds a custom taste entry from structured selections", () => {
  const entry = buildCustomTasteEntry({
    category: "visual_style",
    title: "Reflective Neon Essays",
    year: null,
    genres: ["essay", "reflective"],
    mood: "dreamy",
    pace: "balanced",
    color: "neon",
    emotion: "wonder",
    hook: "mystery_question",
  });

  assert.equal(entry.id, "custom_reflective_neon_essays");
  assert.equal(entry.category, "visual_style");
  assert.equal(entry.style_vector.color.saturation, 0.92);
  assert.equal(entry.style_vector.hook.type, "mystery_question");
  assert.equal(entry.maps_to_presets.writers.paulo_coelho, 0.35);
});
