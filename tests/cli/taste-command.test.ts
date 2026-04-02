import * as assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { runCli } from "../helpers/run-cli.js";
import { seedTasteProfile } from "../helpers/seed-taste-profile.js";

test("taste show returns a null profile before onboarding", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-taste-cli-"));

  try {
    const result = runCli(["taste", "show", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
    });
    const parsed = JSON.parse(result.stdout) as { profile?: unknown };

    assert.equal(result.exitCode, 0);
    assert.equal(parsed.profile, null);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("taste onboarding creates and persists a profile", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-taste-cli-"));

  try {
    const result = runCli(["taste", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
      input: "1,2,3\n1,2\n\n",
    });
    const parsed = JSON.parse(result.stdout) as {
      action?: string;
      profile?: {
        profile_id?: string;
        selections?: {
          movies?: string[];
          visual_styles?: string[];
          authors?: string[];
        };
      };
      profile_path?: string;
    };

    assert.equal(result.exitCode, 0);
    assert.equal(parsed.action, "saved_profile");
    assert.equal(parsed.profile?.selections?.movies?.length, 3);
    assert.equal(parsed.profile?.selections?.visual_styles?.length, 2);
    assert.equal(parsed.profile?.selections?.authors?.length, 0);

    const savedProfile = JSON.parse(readFileSync(parsed.profile_path!, "utf8")) as {
      profile_id?: string;
    };
    assert.equal(savedProfile.profile_id, parsed.profile?.profile_id);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("taste add creates a custom entry and taste reset removes the saved profile", () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-taste-cli-"));

  try {
    const onboarding = runCli(["taste", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
      input: "1,2,3\n1,2\n\n",
    });
    assert.equal(onboarding.exitCode, 0);

    const addResult = runCli(["taste", "add", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
      input: "2\nReflective Neon Essays\n\nessay, reflective\n1\n2\n4\n4\n1\n",
    });
    const addParsed = JSON.parse(addResult.stdout) as {
      action?: string;
      custom_entry?: { id?: string; category?: string };
      custom_entries_path?: string;
    };

    assert.equal(addResult.exitCode, 0);
    assert.equal(addParsed.action, "add_custom_entry");
    assert.equal(addParsed.custom_entry?.id, "custom_reflective_neon_essays");
    assert.equal(addParsed.custom_entry?.category, "visual_style");

    const customEntries = JSON.parse(readFileSync(addParsed.custom_entries_path!, "utf8")) as Array<{ id?: string }>;
    assert.ok(customEntries.some((entry) => entry.id === "custom_reflective_neon_essays"));

    const resetResult = runCli(["taste", "reset", "--json"], {
      env: { SHORTS_ENGINE_HOME: tempHome },
    });
    const resetParsed = JSON.parse(resetResult.stdout) as { removed?: boolean };

    assert.equal(resetResult.exitCode, 0);
    assert.equal(resetParsed.removed, true);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test("taste refine updates the saved profile from feedback heuristics", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-taste-refine-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    await seedTasteProfile(env, {
      profile_id: "taste_refine_cli",
    });

    const runResult = runCli(["run", "tests/fixtures/valid-low-cost-request.json", "--json"], {
      env,
    });
    const runParsed = JSON.parse(runResult.stdout) as {
      scenario_plan?: { scenario_id?: string };
    };

    assert.equal(runResult.exitCode, 0);

    const feedbackResult = runCli(["feedback", runParsed.scenario_plan?.scenario_id ?? "", "--json"], {
      env,
      input: "2\nn\n\ntoo slow\n",
    });
    assert.equal(feedbackResult.exitCode, 0);

    const refineResult = runCli(["taste", "refine", "--json"], { env });
    const refineParsed = JSON.parse(refineResult.stdout) as {
      action?: string;
      considered_feedback?: number;
      adjustments?: Array<{ kind?: string; target?: string }>;
    };

    assert.equal(refineResult.exitCode, 0);
    assert.equal(refineParsed.action, "refined_profile");
    assert.equal(refineParsed.considered_feedback, 1);
    assert.ok((refineParsed.adjustments?.length ?? 0) > 0);
    assert.ok(
      refineParsed.adjustments?.some((adjustment) => adjustment.kind === "editing_pace"),
    );
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
