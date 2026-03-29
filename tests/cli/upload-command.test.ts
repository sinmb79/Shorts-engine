// tests/cli/upload-command.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { runCli } from "../helpers/run-cli.js";

test("engine upload --dry-run returns success and JSON output", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/valid-low-cost-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
    "--json",
  ]);

  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    dry_run?: boolean;
    platform?: string;
    status?: string;
  };
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.dry_run, true);
  assert.ok(typeof parsed.platform === "string");
  assert.equal(parsed.status, "dry_run");
});

test("engine upload --dry-run prints human-readable summary", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/valid-low-cost-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /dry.run/i);
  assert.match(result.stdout, /platform/i);
});

test("engine upload returns error for invalid request", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/invalid-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
  ]);

  assert.notEqual(result.exitCode, 0);
});
