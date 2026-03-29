import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import { routeRequest } from "../../src/domain/route-request.js";
import { scoreRequest } from "../../src/domain/score-request.js";
import { buildExecutionPlan } from "../../src/simulation/build-execution-plan.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("builds a node and edge execution plan", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);
  const plan = buildExecutionPlan(normalized, routing);

  assert.ok(plan.nodes.length > 0);
  assert.ok(plan.edges.length > 0);
  assert.equal(plan.nodes[0]?.node_id, "prompt_normalizer");
  assert.equal(plan.edges[0]?.[0], "prompt_normalizer");
});

test("only references fallback nodes that exist in the plan", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);
  const plan = buildExecutionPlan(normalized, routing);
  const nodeIds = new Set(plan.nodes.map((node) => node.node_id));

  for (const node of plan.nodes) {
    if (node.fallback_node !== null) {
      assert.equal(nodeIds.has(node.fallback_node), true, node.fallback_node);
    }
  }
});
