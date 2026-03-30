// tests/adapters/tts/execute-tts.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { TtsAdapter } from "../../../src/adapters/tts/tts-adapter.js";
import {
  executeTts,
  buildTtsRequestFromContext,
} from "../../../src/execute/execute-tts.js";
import { loadFixture } from "../../helpers/load-fixture.js";
import { createResolvedConfig } from "../../helpers/resolved-config.js";
import type { EngineRequest } from "../../../src/domain/contracts.js";
import { resolvePlanningContext } from "../../../src/cli/resolve-planning-context.js";

function makeMockTtsAdapter(name: string): TtsAdapter {
  return {
    name,
    async isAvailable() { return true; },
    async synthesize(_request, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

test("executeTts returns result for all nodes", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());
  const mockAdapter = makeMockTtsAdapter("mock");

  const result = await executeTts(context, {
    dry_run: true,
    resolveTtsAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.ok(result.nodes.length > 0);
  assert.ok(result.summary.total > 0);
  assert.equal(result.summary.error, 0);
});

test("executeTts summary counts dry_run correctly", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());
  const mockAdapter = makeMockTtsAdapter("mock");

  const result = await executeTts(context, {
    dry_run: true,
    resolveTtsAdapter: async () => mockAdapter,
  });

  assert.equal(result.summary.dry_run, result.nodes.length);
  assert.equal(result.summary.success, 0);
});

test("buildTtsRequestFromContext returns valid TtsRequest", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());

  const ttsRequest = buildTtsRequestFromContext(context);

  assert.equal(typeof ttsRequest.text, "string");
  assert.ok(ttsRequest.text.length > 0);
  assert.equal(typeof ttsRequest.language, "string");
  assert.ok(["neutral", "energetic", "dramatic"].includes(ttsRequest.voice_style));
  assert.equal(typeof ttsRequest.duration_hint_sec, "number");
});
