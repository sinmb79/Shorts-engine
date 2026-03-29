import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import { routeRequest } from "../../src/domain/route-request.js";
import { scoreRequest } from "../../src/domain/score-request.js";
import { buildExecutionPlan } from "../../src/simulation/build-execution-plan.js";
import { simulateRecovery } from "../../src/simulation/simulate-recovery.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("returns normal and recovery paths for fallback fixtures", async () => {
  const request = await loadFixture<EngineRequest>("fallback-path-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);
  const plan = buildExecutionPlan(normalized, routing);
  const recovery = simulateRecovery(plan);

  assert.ok(recovery.normal_path.length > 0);
  assert.ok(recovery.recovery_paths.length > 0);
  assert.equal(recovery.recovery_paths[0]?.trigger_node, "tool_adapter");
});

test("does not emit fallback recovery paths when fallback is disabled", async () => {
  const request = await loadFixture<EngineRequest>("no-fallback-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);
  const plan = buildExecutionPlan(normalized, routing);
  const recovery = simulateRecovery(plan);

  assert.equal(recovery.recovery_paths.length, 0);
});
