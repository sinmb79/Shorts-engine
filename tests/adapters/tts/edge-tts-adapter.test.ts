import { test } from "node:test";
import * as assert from "node:assert/strict";

import { EdgeTtsAdapter } from "../../../src/adapters/tts/edge-tts-adapter.js";

test("edge TTS adapter is available without API keys", async () => {
  const adapter = new EdgeTtsAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("edge TTS adapter returns dry_run metadata", async () => {
  const adapter = new EdgeTtsAdapter();
  const result = await adapter.synthesize(
    {
      text: "Hello world",
      language: "en",
      voice_style: "neutral",
      duration_hint_sec: 15,
    },
    { dry_run: true },
  );

  assert.equal(result.status, "dry_run");
  assert.equal(result.metadata["adapter"], "edge_tts");
});
