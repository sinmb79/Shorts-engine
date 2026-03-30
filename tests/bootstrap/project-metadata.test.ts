import { test } from "node:test";
import * as assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package metadata and gitignore guardrails exist", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    type?: string;
    scripts?: Record<string, string>;
  };
  const gitignore = await readFile(".gitignore", "utf8");
  const readme = await readFile("README.md", "utf8");

  assert.equal(packageJson.type, "module");
  assert.equal(typeof packageJson.scripts?.test, "string");
  assert.match(gitignore, /node_modules\//);
  assert.match(gitignore, /\.env/);
  assert.match(gitignore, /\.pfx/);
  assert.match(readme, /engine stats/);
  assert.match(readme, /engine dashboard/);
  assert.match(readme, /engine init/);
  assert.match(readme, /edge_tts/);
  assert.match(readme, /Prompt Tracker/i);
  assert.match(readme, /Dashboard/i);
});
