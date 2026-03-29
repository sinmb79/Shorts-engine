import { test } from "node:test";
import * as assert from "node:assert/strict";

import { runCli } from "../helpers/run-cli.js";

test("prints structured JSON for run --json", () => {
  const result = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"]);
  const parsed = JSON.parse(result.stdout) as {
    request_id?: string;
    validation?: { valid?: boolean };
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.validation?.valid, true);
  assert.equal(typeof parsed.request_id, "string");
});

test("returns exit code 2 for validation failures", () => {
  const result = runCli(["run", "tests/fixtures/invalid-request.json", "--json"]);

  assert.equal(result.exitCode, 2);
});

test("returns the same request_id for the same input across runs", () => {
  const firstRun = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"]);
  const secondRun = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"]);
  const firstParsed = JSON.parse(firstRun.stdout) as { request_id?: string };
  const secondParsed = JSON.parse(secondRun.stdout) as { request_id?: string };

  assert.equal(firstRun.exitCode, 0);
  assert.equal(secondRun.exitCode, 0);
  assert.equal(firstParsed.request_id, secondParsed.request_id);
});
