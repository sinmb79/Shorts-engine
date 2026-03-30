// tests/adapters/tts/tts-adapter-registry.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveTtsAdapter,
  TTS_ADAPTER_REGISTRY,
} from "../../../src/adapters/tts/tts-adapter-registry.js";

test("resolveTtsAdapter returns local for 'local' backend", async () => {
  const adapter = await resolveTtsAdapter("local");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter returns local for 'gpu' backend", async () => {
  const adapter = await resolveTtsAdapter("gpu");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter returns local for 'cache' backend", async () => {
  const adapter = await resolveTtsAdapter("cache");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter falls back to local when sora backend has no OPENAI_API_KEY", async () => {
  const saved = process.env["OPENAI_API_KEY"];
  delete process.env["OPENAI_API_KEY"];
  const adapter = await resolveTtsAdapter("sora");
  assert.equal(adapter.name, "local");
  if (saved !== undefined) process.env["OPENAI_API_KEY"] = saved;
});

test("resolveTtsAdapter falls back to edge_tts when premium API providers are unavailable", async () => {
  const keys = ["ELEVENLABS_API_KEY", "OPENAI_API_KEY", "GOOGLE_TTS_API_KEY"];
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  const adapter = await resolveTtsAdapter("premium");
  assert.equal(adapter.name, "edge_tts");
  for (const k of keys) {
    if (saved[k] !== undefined) process.env[k] = saved[k];
  }
});

test("TTS_ADAPTER_REGISTRY contains all four adapter names", () => {
  const names = Object.keys(TTS_ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("edge_tts"));
  assert.ok(names.includes("elevenlabs"));
  assert.ok(names.includes("openai_tts"));
  assert.ok(names.includes("google_tts"));
});
