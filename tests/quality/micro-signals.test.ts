import { test } from "node:test";
import * as assert from "node:assert/strict";

import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";
import { aggregateScore, scoreMicroSignals } from "../../src/quality/micro-signals.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { loadFixture } from "../helpers/load-fixture.js";
import { createResolvedConfig } from "../helpers/resolved-config.js";

test("motion plan with repeated moves scores low on motion_variation", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const planningContext = resolvePlanningContext(request, createResolvedConfig());

  planningContext.motion_plan.motion_sequence = planningContext.motion_plan.motion_sequence.map(
    (assignment) => ({
      ...assignment,
      motion: "zoom_in",
    }),
  );

  const signals = scoreMicroSignals(planningContext);

  assert.ok(signals.motion_variation < 0.45);
  assert.ok(aggregateScore(signals) >= 0);
  assert.ok(aggregateScore(signals) <= 1);
});
