import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveAdapter,
  ADAPTER_REGISTRY,
} from "../../../src/adapters/video/adapter-registry.js";

test("resolveAdapter returns local adapter for 'local' backend", async () => {
  const adapter = await resolveAdapter("local");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter returns local adapter for 'gpu' backend", async () => {
  const adapter = await resolveAdapter("gpu");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter returns local adapter for 'cache' backend", async () => {
  const adapter = await resolveAdapter("cache");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter falls back to local when sora API key is absent", async () => {
  const adapter = await resolveAdapter("sora");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter falls back to local when premium backends are all unavailable", async () => {
  const keys = ["KLING_API_KEY", "GEMINI_API_KEY", "FAL_API_KEY", "RUNWAY_API_KEY"];
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  const adapter = await resolveAdapter("premium");
  assert.equal(adapter.name, "local");
  for (const k of keys) {
    if (saved[k] !== undefined) process.env[k] = saved[k] as string;
  }
});

test("resolveAdapter prefers veo3 in premium cascade when only GEMINI_API_KEY is set", async () => {
  const keys = ["KLING_API_KEY", "GEMINI_API_KEY", "FAL_API_KEY", "RUNWAY_API_KEY"];
  const saved: Record<string, string | undefined> = {};

  for (const key of keys) {
    saved[key] = process.env[key];
    delete process.env[key];
  }

  process.env["GEMINI_API_KEY"] = "test-gemini";

  try {
    const adapter = await resolveAdapter("premium");
    assert.equal(adapter.name, "veo3");
  } finally {
    for (const key of keys) {
      if (saved[key] !== undefined) {
        process.env[key] = saved[key] as string;
      } else {
        delete process.env[key];
      }
    }
  }
});

test("resolveAdapter prefers seedance2 in premium cascade when only FAL_API_KEY is set", async () => {
  const keys = ["KLING_API_KEY", "GEMINI_API_KEY", "FAL_API_KEY", "RUNWAY_API_KEY"];
  const saved: Record<string, string | undefined> = {};

  for (const key of keys) {
    saved[key] = process.env[key];
    delete process.env[key];
  }

  process.env["FAL_API_KEY"] = "test-fal";

  try {
    const adapter = await resolveAdapter("premium");
    assert.equal(adapter.name, "seedance2");
  } finally {
    for (const key of keys) {
      if (saved[key] !== undefined) {
        process.env[key] = saved[key] as string;
      } else {
        delete process.env[key];
      }
    }
  }
});

test("ADAPTER_REGISTRY contains local, runway, kling, veo3, and seedance2 adapters", () => {
  const names = Object.keys(ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("runway"));
  assert.ok(names.includes("kling"));
  assert.ok(names.includes("veo3"));
  assert.ok(names.includes("seedance2"));
  assert.equal(names.includes("sora"), false);
});
