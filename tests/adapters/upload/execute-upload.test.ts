// tests/adapters/upload/execute-upload.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { UploadAdapter } from "../../../src/adapters/upload/upload-adapter.js";
import {
  executeUpload,
  buildUploadRequest,
} from "../../../src/execute/execute-upload.js";
import { loadFixture } from "../../helpers/load-fixture.js";
import type { EngineRequest } from "../../../src/domain/contracts.js";
import { resolvePlanningContext } from "../../../src/cli/resolve-planning-context.js";

function makeMockUploadAdapter(name: string): UploadAdapter {
  return {
    name,
    platform: "youtube_shorts",
    async isAvailable() { return true; },
    async upload(_request, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

test("executeUpload returns dry_run result", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = await resolvePlanningContext(request);
  const mockAdapter = makeMockUploadAdapter("mock");

  const result = await executeUpload(context, "test.mp4", {
    dry_run: true,
    resolveUploadAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.status, "dry_run");
  assert.equal(result.adapter, "mock");
});

test("executeUpload sets platform from context", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = await resolvePlanningContext(request);
  const mockAdapter = makeMockUploadAdapter("mock");

  const result = await executeUpload(context, "test.mp4", {
    dry_run: true,
    resolveUploadAdapter: async () => mockAdapter,
  });

  assert.ok(
    result.platform === "youtube_shorts" ||
    result.platform === "tiktok" ||
    result.platform === "instagram_reels",
  );
});

test("buildUploadRequest returns valid UploadRequest", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = await resolvePlanningContext(request);

  const uploadRequest = buildUploadRequest(context, "/tmp/test.mp4");

  assert.equal(uploadRequest.video_path, "/tmp/test.mp4");
  assert.equal(typeof uploadRequest.title, "string");
  assert.ok(uploadRequest.title.length > 0);
  assert.ok(Array.isArray(uploadRequest.hashtags));
  assert.ok(
    uploadRequest.platform === "youtube_shorts" ||
    uploadRequest.platform === "tiktok" ||
    uploadRequest.platform === "instagram_reels",
  );
});
