import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveUploadAdapter,
  UPLOAD_ADAPTER_REGISTRY,
} from "../../../src/adapters/upload/upload-adapter-registry.js";

test("resolveUploadAdapter returns local for youtube_shorts when no credentials", async () => {
  const savedClientId = process.env["YOUTUBE_CLIENT_ID"];
  const savedToken = process.env["YOUTUBE_REFRESH_TOKEN"];
  delete process.env["YOUTUBE_CLIENT_ID"];
  delete process.env["YOUTUBE_REFRESH_TOKEN"];

  const adapter = await resolveUploadAdapter("youtube_shorts");
  assert.equal(adapter.name, "local");

  if (savedClientId !== undefined) process.env["YOUTUBE_CLIENT_ID"] = savedClientId;
  if (savedToken !== undefined) process.env["YOUTUBE_REFRESH_TOKEN"] = savedToken;
});

test("resolveUploadAdapter returns local for tiktok when no credentials", async () => {
  const saved = process.env["TIKTOK_ACCESS_TOKEN"];
  delete process.env["TIKTOK_ACCESS_TOKEN"];

  const adapter = await resolveUploadAdapter("tiktok");
  assert.equal(adapter.name, "local");

  if (saved !== undefined) process.env["TIKTOK_ACCESS_TOKEN"] = saved;
});

test("resolveUploadAdapter returns local for instagram_reels when no credentials", async () => {
  const savedToken = process.env["INSTAGRAM_ACCESS_TOKEN"];
  const savedId = process.env["INSTAGRAM_ACCOUNT_ID"];
  delete process.env["INSTAGRAM_ACCESS_TOKEN"];
  delete process.env["INSTAGRAM_ACCOUNT_ID"];

  const adapter = await resolveUploadAdapter("instagram_reels");
  assert.equal(adapter.name, "local");

  if (savedToken !== undefined) process.env["INSTAGRAM_ACCESS_TOKEN"] = savedToken;
  if (savedId !== undefined) process.env["INSTAGRAM_ACCOUNT_ID"] = savedId;
});

test("UPLOAD_ADAPTER_REGISTRY contains all adapter names", () => {
  const names = Object.keys(UPLOAD_ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("youtube"));
  assert.ok(names.includes("tiktok"));
  assert.ok(names.includes("instagram"));
});

test("resolveUploadAdapter always returns an adapter (local fallback)", async () => {
  const adapter = await resolveUploadAdapter("youtube_shorts");
  assert.ok(typeof adapter.name === "string");
  assert.ok(typeof adapter.upload === "function");
});
