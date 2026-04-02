import { test } from "node:test";
import * as assert from "node:assert/strict";

import { runCli } from "../helpers/run-cli.js";

test("prints the narrative payload contract for scenario --json", () => {
  const result = runCli([
    "scenario",
    "--studio",
    "ghibli",
    "--topic",
    "A lonely traveler meets a strange forest spirit for the first time",
    "--json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    studio_id?: string;
    scene_archetype?: string;
    philosophy_note?: string;
    emotional_texture?: { wonder?: number };
    beats?: unknown[];
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.studio_id, "ghibli");
  assert.equal(typeof parsed.scene_archetype, "string");
  assert.equal(typeof parsed.philosophy_note, "string");
  assert.equal(typeof parsed.emotional_texture?.wonder, "number");
  assert.equal(Array.isArray(parsed.beats), true);
});
