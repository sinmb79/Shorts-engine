import { test } from "node:test";
import * as assert from "node:assert/strict";

import { runCli } from "../helpers/run-cli.js";

test("prints the available studio catalog for studios --list --json", () => {
  const result = runCli(["studios", "--list", "--json"]);
  const parsed = JSON.parse(result.stdout) as Array<{ studio_id?: string }>;

  assert.equal(result.exitCode, 0);
  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.some((entry) => entry.studio_id === "ghibli"), true);
  assert.equal(parsed.some((entry) => entry.studio_id === "hail_mary"), true);
  assert.equal(parsed.some((entry) => entry.studio_id === "jang_hang_jun"), true);
});

test("prints a studio definition for studios --show --json", () => {
  const result = runCli(["studios", "--show", "ghibli", "--json"]);
  const parsed = JSON.parse(result.stdout) as {
    studio_id?: string;
    display_name?: string;
    scene_archetypes?: unknown[];
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.studio_id, "ghibli");
  assert.equal(typeof parsed.display_name, "string");
  assert.equal(Array.isArray(parsed.scene_archetypes), true);
});
