import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { loadFixture } from "../helpers/load-fixture.js";
import { runCli } from "../helpers/run-cli.js";
import { writeJson, writeRuntimeConfigSet } from "../helpers/runtime-config-fixture.js";

test("prints structured JSON for prompt --json", () => {
  const result = runCli(["prompt", "tests/fixtures/valid-low-cost-request.json", "--json"]);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    engine?: string;
    main_prompt?: string;
    params?: { duration_sec?: number };
    resolved_config?: unknown;
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.engine, "local");
  assert.equal(parsed.params?.duration_sec, 20);
  assert.match(parsed.main_prompt ?? "", /AI meeting note tool/);
  assert.equal("resolved_config" in parsed, false);
});

test("includes novel-derived prompt details for novel requests", () => {
  const result = runCli(["prompt", "tests/fixtures/novel-cliffhanger-request.json", "--json"]);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    main_prompt?: string;
    params?: { duration_sec?: number };
    style_descriptor?: string;
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.params?.duration_sec, 25);
  assert.match(parsed.main_prompt ?? "", /Novel highlight:/);
  assert.match(parsed.style_descriptor ?? "", /cliffhanger/);
});

test("prints human-readable prompt output", () => {
  const result = runCli(["prompt", "tests/fixtures/valid-low-cost-request.json"]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /Engine: local/);
  assert.match(result.stdout, /Main prompt:/);
});

test("prompt command loads runtime config before prompt composition", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-engine-prompt-"));
  const requestPath = path.join(tempDir, "requests", "request.json");
  const request = await loadFixture("valid-low-cost-request.json");

  try {
    await writeRuntimeConfigSet(tempDir);
    await writeFile(path.join(tempDir, "config", "user-profile.json"), "{ invalid json\n", "utf8");
    await writeJson(requestPath, request);

    const result = runCli(["prompt", requestPath], { cwd: tempDir });

    assert.equal(result.exitCode, 1);
    assert.match(result.stdout, /Fatal error: 설정 파일 JSON 형식이 올바르지 않습니다/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
