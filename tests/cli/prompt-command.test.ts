import { test } from "node:test";
import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";

import { runCli } from "../helpers/run-cli.js";
import { seedTasteProfile } from "../helpers/seed-taste-profile.js";

test("prints structured JSON for prompt --json", () => {
  const result = runCli(["prompt", "tests/fixtures/valid-low-cost-request.json", "--json"]);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    engine?: string;
    main_prompt?: string;
    params?: { duration_sec?: number };
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.engine, "local");
  assert.equal(parsed.params?.duration_sec, 20);
  assert.match(parsed.main_prompt ?? "", /AI meeting note tool/);
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

test("includes taste-derived style anchors in the prompt when a profile exists", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-prompt-taste-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    await seedTasteProfile(env, {
      profile_id: "taste_prompt_integration",
    });
    const result = runCli(["prompt", "tests/fixtures/valid-low-cost-request.json", "--json"], {
      env,
    });
    const parsed = JSON.parse(result.stdout) as {
      main_prompt?: string;
      style_descriptor?: string;
    };

    assert.equal(result.exitCode, 0);
    assert.match(parsed.main_prompt ?? "", /Style source: taste profile taste_prompt_integration/);
    assert.match(parsed.main_prompt ?? "", /Director anchor: wes_anderson/);
    assert.match(parsed.main_prompt ?? "", /Color palette:/);
    assert.match(parsed.main_prompt ?? "", /Scenario beat hook:/);
    assert.match(parsed.style_descriptor ?? "", /dramatic_build|fast_cut|slow_burn/);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("applies test-mode LLM refinement when --llm is enabled", () => {
  const result = runCli(
    [
      "prompt",
      "tests/fixtures/valid-low-cost-request.json",
      "--json",
      "--llm",
      "--provider",
      "openai",
    ],
    {
      env: {
        SHORTS_ENGINE_TEST_LLM_RESPONSE: JSON.stringify({
          main_prompt: "Refined cinematic prompt",
          negative_prompt: "avoid blur",
          style_descriptor: "crisp editorial motion",
        }),
      },
    },
  );
  const parsed = JSON.parse(result.stdout) as {
    main_prompt?: string;
    negative_prompt?: string;
    style_descriptor?: string;
    warnings?: string[];
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.main_prompt, "Refined cinematic prompt");
  assert.equal(parsed.negative_prompt, "avoid blur");
  assert.equal(parsed.style_descriptor, "crisp editorial motion");
  assert.ok(parsed.warnings?.includes("llm_refined_with_openai"));
});
