import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { refineTasteProfileFromFeedback } from "../../src/quality/dna-refiner.js";
import { insertFeedbackRecord, recordGeneratedScenario } from "../../src/quality/quality-db.js";
import { seedTasteProfile } from "../helpers/seed-taste-profile.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("dna refiner nudges the saved profile from mismatch feedback", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-dna-refiner-"));
  const env = { SHORTS_ENGINE_HOME: tempHome };

  try {
    await seedTasteProfile(env, {
      profile_id: "dna_refiner_profile",
    });
    const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
    const planningContext = await resolvePlanningContext(request, { env });
    await recordGeneratedScenario(planningContext, env);
    await insertFeedbackRecord(
      {
        scenario_id: planningContext.scenario_plan.scenario_id,
        overall_score: 2,
        good_aspects: [],
        bad_aspects: ["too slow", "needs pace"],
        taste_match: false,
      },
      env,
    );

    const result = await refineTasteProfileFromFeedback(env, { force: true });

    assert.equal(result.applied, true);
    assert.equal(result.considered_feedback, 1);
    assert.ok(result.adjustments.some((adjustment) => adjustment.kind === "editing_pace"));
    assert.ok(result.profile);
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
