import { test } from "node:test";
import * as assert from "node:assert/strict";

import { buildAnalysisReport } from "../../src/analyze/build-analysis-report.js";
import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { loadFixture } from "../helpers/load-fixture.js";
import { createResolvedConfig } from "../helpers/resolved-config.js";

test("buildAnalysisReport includes micro signals and hook analysis", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const planningContext = resolvePlanningContext(request, createResolvedConfig());

  const report = buildAnalysisReport({
    requestId: "req_test_123",
    planningContext,
  });

  assert.equal(report.schema_version, "0.1");
  assert.equal(report.request_id, "req_test_123");
  assert.equal(typeof report.micro_signals.hook_strength, "number");
  assert.equal(typeof report.hook_analysis.type, "string");
  assert.ok(report.hook_analysis.suggestions.length > 0);
});
