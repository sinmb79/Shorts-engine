import * as assert from "node:assert/strict";
import { test } from "node:test";

import { loadTasteCatalog } from "../../src/taste-db/catalog-loader.js";
import { validateTasteEntry } from "../../src/taste-db/schema.js";

test("loads the seeded taste catalog with expected starter counts", async () => {
  const catalog = await loadTasteCatalog({ SHORTS_ENGINE_HOME: "non-existent-test-home" });

  assert.equal(catalog.movies.length, 20);
  assert.equal(catalog.visual_styles.length, 10);
  assert.equal(catalog.authors.length, 10);
  assert.equal(catalog.custom.length, 0);
});

test("reports schema errors for out-of-range vectors", () => {
  const errors = validateTasteEntry({
    id: "broken",
    title: { ko: "broken", en: "broken" },
    category: "movie",
    genre: ["test"],
    style_vector: {
      camera: {
        scale: 2,
        movement_energy: 0.2,
        closeup_ratio: 0.3,
        primary_movements: ["slow_push"],
        signature: "broken",
      },
      editing: {
        pace: 0.4,
        cut_rhythm: "steady",
        cross_cutting: false,
        time_manipulation: false,
      },
      color: {
        temperature: 0.4,
        saturation: 0.4,
        palette: ["gray"],
        mood: "flat",
      },
      audio: {
        music_style: "none",
        music_intensity: 0.1,
        silence_usage: 0.9,
        sfx_style: "none",
      },
      narrative: {
        structure: "flat",
        emotion_arc: "flat",
        pacing: "flat",
        theme_keywords: ["test"],
      },
      hook: {
        type: "none",
        first_3sec: "none",
        retention: "none",
      },
    },
    maps_to_presets: {
      directors: { christopher_nolan: 0.4 },
      writers: { haruki_murakami: 0.4 },
    },
  });

  assert.ok(errors.some((error) => error.includes("camera.scale")));
});
