import { test } from "node:test";
import * as assert from "node:assert/strict";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { loadFixture } from "../helpers/load-fixture.js";
import { validateEngineRequest } from "../../src/domain/request-schema.js";

test("validates a well-formed engine request fixture", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const result = validateEngineRequest(request);

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("returns validation_error when version is missing", () => {
  const result = validateEngineRequest({});

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, "validation_error");
});
