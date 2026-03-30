import { test } from "node:test";
import * as assert from "node:assert/strict";

import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";
import { analyzeHook } from "../../src/quality/hook-optimizer.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { loadFixture } from "../helpers/load-fixture.js";
import { createResolvedConfig } from "../helpers/resolved-config.js";

test("question hook scores higher than a plain statement hook", async () => {
  const baseRequest = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const questionRequest: EngineRequest = {
    ...baseRequest,
    intent: {
      ...baseRequest.intent,
      goal: "why are creators switching tools?",
    },
    style: {
      ...baseRequest.style,
      hook_type: "question",
    },
  };
  const statementRequest: EngineRequest = {
    ...baseRequest,
    intent: {
      ...baseRequest.intent,
      goal: "creators are switching tools quickly",
    },
    style: {
      ...baseRequest.style,
      hook_type: "statement",
    },
  };

  const questionAnalysis = analyzeHook(
    resolvePlanningContext(questionRequest, createResolvedConfig()),
  );
  const statementAnalysis = analyzeHook(
    resolvePlanningContext(statementRequest, createResolvedConfig()),
  );

  assert.equal(questionAnalysis.type, "question");
  assert.ok(questionAnalysis.score > statementAnalysis.score);
});
