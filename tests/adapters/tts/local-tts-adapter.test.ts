import { test } from "node:test";
import * as assert from "node:assert/strict";
import { LocalTtsAdapter } from "../../../src/adapters/tts/local-tts-adapter.js";

test("local TTS adapter is always available", async () => {
  const adapter = new LocalTtsAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("local TTS adapter returns dry_run status", async () => {
  const adapter = new LocalTtsAdapter();
  const result = await adapter.synthesize(
    {
      text: "Hello world",
      language: "en",
      voice_style: "neutral",
      duration_hint_sec: 15,
    },
    { dry_run: false },
  );
  assert.equal(result.status, "dry_run");
  assert.equal(result.output_path, undefined);
  assert.equal(typeof result.metadata, "object");
});

test("local TTS adapter name is 'local'", () => {
  const adapter = new LocalTtsAdapter();
  assert.equal(adapter.name, "local");
});
