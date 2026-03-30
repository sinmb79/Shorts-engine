import { test } from "node:test";
import * as assert from "node:assert/strict";

import { SeedanceAdapter } from "../../../src/adapters/video/seedance-adapter.js";

test("seedance adapter is unavailable without FAL_API_KEY", async () => {
  const saved = process.env["FAL_API_KEY"];
  delete process.env["FAL_API_KEY"];

  try {
    const adapter = new SeedanceAdapter();
    assert.equal(await adapter.isAvailable(), false);
  } finally {
    if (saved !== undefined) {
      process.env["FAL_API_KEY"] = saved;
    }
  }
});

test("seedance adapter returns dry_run status", async () => {
  const adapter = new SeedanceAdapter();
  const result = await adapter.generate(
    {
      text_prompt: "A cinematic launch trailer",
      duration_sec: 15,
      aspect_ratio: "9:16",
      style_tags: ["cinematic"],
    },
    { dry_run: true },
  );

  assert.equal(result.status, "dry_run");
  assert.equal(result.metadata["adapter"], "seedance2");
});

test("seedance adapter name is 'seedance2'", () => {
  const adapter = new SeedanceAdapter();
  assert.equal(adapter.name, "seedance2");
});
