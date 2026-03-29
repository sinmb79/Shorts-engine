import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import { routeRequest } from "../../src/domain/route-request.js";
import { scoreRequest } from "../../src/domain/score-request.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("blocks premium routing when candidate score is below threshold", async () => {
  const request = await loadFixture<EngineRequest>("premium-blocked-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.equal(routing.premium_allowed, false);
  assert.equal(routing.selected_backend, "local");
  assert.equal(routing.fallback_backend, "gpu");
  assert.match(
    routing.reason_codes.join(","),
    /candidate_score_below_premium_threshold/,
  );
});

test("keeps low-cost requests on the local backend", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.equal(scoring.candidate_score >= 0, true);
  assert.equal(routing.selected_backend, "local");
  assert.match(routing.reason_codes.join(","), /local_backend_available/);
});

test("disables fallback backend when the request forbids fallback", async () => {
  const request = await loadFixture<EngineRequest>("no-fallback-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.equal(routing.selected_backend, "local");
  assert.equal(routing.fallback_backend, null);
});

test("routes to gpu when batch_size >= 5 and gpu_available is true", async () => {
  const request = await loadFixture<EngineRequest>("batch-gpu-request.json");
  const normalized = normalizeRequest(request);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.equal(routing.selected_backend, "gpu");
  assert.match(routing.reason_codes.join(","), /batch_gpu_preferred/);
});

test("Rule C triggers at exact boundary batch_size === 5", async () => {
  const request = await loadFixture<EngineRequest>("batch-gpu-request.json");
  const atBoundary: EngineRequest = {
    ...request,
    backend: { ...request.backend, batch_size: 5 },
  };
  const normalized = normalizeRequest(atBoundary);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.equal(routing.selected_backend, "gpu");
  assert.match(routing.reason_codes.join(","), /batch_gpu_preferred/);
});

test("Rule C does not trigger when batch_size is below threshold", async () => {
  const request = await loadFixture<EngineRequest>("batch-gpu-request.json");
  const belowThreshold: EngineRequest = {
    ...request,
    backend: { ...request.backend, batch_size: 4 },
  };
  const normalized = normalizeRequest(belowThreshold);
  const scoring = scoreRequest(normalized);
  const routing = routeRequest(normalized, scoring);

  assert.notEqual(routing.selected_backend, "gpu");
  assert.doesNotMatch(routing.reason_codes.join(","), /batch_gpu_preferred/);
});
