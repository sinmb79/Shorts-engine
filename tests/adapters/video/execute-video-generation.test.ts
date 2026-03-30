import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { VideoGenerationAdapter } from "../../../src/adapters/video/video-generation-adapter.js";
import {
  executeVideoGeneration,
  buildPromptFromPlanningContext,
} from "../../../src/execute/execute-video-generation.js";
import type { PromptTrackerLike } from "../../../src/tracking/prompt-tracker.js";
import { loadFixture } from "../../helpers/load-fixture.js";
import { createResolvedConfig } from "../../helpers/resolved-config.js";
import type { EngineRequest } from "../../../src/domain/contracts.js";
import { resolvePlanningContext } from "../../../src/cli/resolve-planning-context.js";

function makeMockAdapter(name: string): VideoGenerationAdapter {
  return {
    name,
    async isAvailable() { return true; },
    async generate(_prompt, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

function createTrackerSpy() {
  const records: Array<Record<string, unknown>> = [];
  const tracker: PromptTrackerLike = {
    record(entry) {
      records.push(entry);
    },
    getHistory() {
      return [];
    },
    getStats() {
      return { total: 0, by_engine: {}, avg_cost: 0 };
    },
    close() {},
  };

  return { tracker, records };
}

test("executeVideoGeneration returns result for all nodes", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());
  const mockAdapter = makeMockAdapter("mock");

  const result = await executeVideoGeneration(context, {
    dry_run: true,
    resolveAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.ok(result.nodes.length > 0);
  assert.ok(result.summary.total > 0);
  assert.equal(result.summary.error, 0);
});

test("executeVideoGeneration summary counts dry_run correctly", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());
  const mockAdapter = makeMockAdapter("mock");

  const result = await executeVideoGeneration(context, {
    dry_run: true,
    resolveAdapter: async () => mockAdapter,
  });

  assert.equal(result.summary.dry_run, result.nodes.length);
  assert.equal(result.summary.success, 0);
});

test("executeVideoGeneration records prompt tracker entries after generation attempts", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());
  const mockAdapter = makeMockAdapter("mock");
  const { tracker, records } = createTrackerSpy();

  await executeVideoGeneration(context, {
    dry_run: true,
    resolveAdapter: async () => mockAdapter,
    promptTracker: tracker,
  });

  assert.ok(records.length > 0);
  assert.equal(records[0]?.["engine"], "mock");
  assert.equal(records[0]?.["platform"], "youtube_shorts");
});

test("buildPromptFromPlanningContext returns valid prompt", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request, createResolvedConfig());

  const prompt = buildPromptFromPlanningContext(context);

  assert.equal(typeof prompt.text_prompt, "string");
  assert.ok(prompt.text_prompt.length > 0);
  assert.equal(typeof prompt.duration_sec, "number");
  assert.equal(prompt.aspect_ratio, "9:16");
  assert.ok(Array.isArray(prompt.style_tags));
});
