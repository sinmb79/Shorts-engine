import { test } from "node:test";
import * as assert from "node:assert/strict";

import { VeoAdapter } from "../../../src/adapters/video/veo-adapter.js";

test("veo adapter is unavailable without GEMINI_API_KEY", async () => {
  const saved = process.env["GEMINI_API_KEY"];
  delete process.env["GEMINI_API_KEY"];

  try {
    const adapter = new VeoAdapter();
    assert.equal(await adapter.isAvailable(), false);
  } finally {
    if (saved !== undefined) {
      process.env["GEMINI_API_KEY"] = saved;
    }
  }
});

test("veo adapter returns dry_run status", async () => {
  const adapter = new VeoAdapter();
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
  assert.equal(result.metadata["adapter"], "veo3");
});

test("veo adapter name is 'veo3'", () => {
  const adapter = new VeoAdapter();
  assert.equal(adapter.name, "veo3");
});
