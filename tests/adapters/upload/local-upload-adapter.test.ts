import { test } from "node:test";
import * as assert from "node:assert/strict";
import { LocalUploadAdapter } from "../../../src/adapters/upload/local-upload-adapter.js";

test("local upload adapter is always available", async () => {
  const adapter = new LocalUploadAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("local upload adapter returns dry_run status", async () => {
  const adapter = new LocalUploadAdapter();
  const result = await adapter.upload(
    {
      video_path: "/tmp/test.mp4",
      title: "Test",
      description: "Test description",
      hashtags: ["#test"],
      platform: "youtube_shorts",
    },
    { dry_run: false },
  );
  assert.equal(result.status, "dry_run");
  assert.equal(result.post_url, undefined);
  assert.equal(result.post_id, undefined);
  assert.equal(typeof result.metadata, "object");
});

test("local upload adapter name is 'local'", () => {
  const adapter = new LocalUploadAdapter();
  assert.equal(adapter.name, "local");
});
