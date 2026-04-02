import { test } from "node:test";
import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";

import type { EngineRequest } from "../../src/domain/contracts.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import {
  applyNovelIntentOverrides,
  resolveNovelShortsPlan,
} from "../../src/novel/resolve-novel-shorts-plan.js";
import { resolvePlatformOutputSpec } from "../../src/platform/resolve-platform-output-spec.js";
import { weaveScenarioPlan } from "../../src/scenario/block-weaver.js";
import { resolveStyleResolution } from "../../src/style/style-engine.js";
import { loadTasteCatalog } from "../../src/taste-db/catalog-loader.js";
import { generateTasteProfile } from "../../src/taste/dna-generator.js";
import { loadFixture } from "../helpers/load-fixture.js";

test("weaves a four-scene generic scenario when no taste profile exists", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalizedRequest = normalizeRequest(request);
  const novelShortsPlan = resolveNovelShortsPlan(normalizedRequest);
  const effectiveRequest = applyNovelIntentOverrides(normalizedRequest, novelShortsPlan);
  const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
  const styleResolution = resolveStyleResolution(request, null);
  const scenarioPlan = weaveScenarioPlan({
    effectiveRequest,
    platformOutputSpec,
    styleResolution,
    novelShortsPlan,
  });

  assert.equal(scenarioPlan.director_anchor, null);
  assert.equal(scenarioPlan.scenes.length, 4);
  assert.equal(scenarioPlan.blocks_used[0], "generic_hook_question_frame");
  assert.equal(
    scenarioPlan.scenes.reduce((sum, scene) => sum + scene.duration_sec, 0),
    effectiveRequest.derived.resolved_duration_sec,
  );
});

test("weaves a Wes Anderson flavored scenario from the seeded taste DNA", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const normalizedRequest = normalizeRequest(request);
  const novelShortsPlan = resolveNovelShortsPlan(normalizedRequest);
  const effectiveRequest = applyNovelIntentOverrides(normalizedRequest, novelShortsPlan);
  const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
  const catalog = await loadTasteCatalog();
  const tasteProfile = generateTasteProfile(
    {
      movies: ["grand_budapest_hotel", "amelie", "spirited_away"],
      visual_styles: ["ghibli_dreamscape", "luxury_editorial"],
      authors: ["paulo_coelho_books"],
    },
    catalog,
    {
      profile_id: "taste_block_weaver",
      now: new Date("2026-04-02T00:00:00.000Z"),
    },
  );
  const styleResolution = resolveStyleResolution(request, tasteProfile);
  const scenarioPlan = weaveScenarioPlan({
    effectiveRequest,
    platformOutputSpec,
    styleResolution,
    novelShortsPlan,
  });

  assert.equal(scenarioPlan.director_anchor, "wes_anderson");
  assert.equal(scenarioPlan.hook_decision.hook_type, "pattern_interrupt");
  assert.equal(scenarioPlan.blocks_used[0], "wes_hook_symmetry_reveal");
  assert.match(scenarioPlan.summary, /wes_anderson/);
  assert.match(scenarioPlan.scenes[0]?.caption_text ?? "", /calm/i);
});

test("learned block scores can override default generic selection", async () => {
  const tempHome = mkdtempSync(path.join(process.cwd(), "tmp-weaver-learned-"));

  try {
    writeFileSync(
      path.join(tempHome, "block-scores.json"),
      `${JSON.stringify(
        [
          {
            block_id: "edgar_hook_snap_interrupt",
            average_score: 4.8,
            feedback_count: 20,
            rank: "gold",
          },
          {
            block_id: "generic_hook_question_frame",
            average_score: 1.8,
            feedback_count: 20,
            rank: "retired",
          },
        ],
        null,
        2,
      )}\n`,
      "utf8",
    );
    writeFileSync(path.join(tempHome, "verified-combos.json"), "[]\n", "utf8");

    const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
    const normalizedRequest = normalizeRequest(request);
    const novelShortsPlan = resolveNovelShortsPlan(normalizedRequest);
    const effectiveRequest = applyNovelIntentOverrides(normalizedRequest, novelShortsPlan);
    const platformOutputSpec = resolvePlatformOutputSpec(effectiveRequest);
    const styleResolution = resolveStyleResolution(request, null);
    const scenarioPlan = weaveScenarioPlan({
      effectiveRequest,
      platformOutputSpec,
      styleResolution,
      novelShortsPlan,
      env: { SHORTS_ENGINE_HOME: tempHome },
    });

    assert.equal(scenarioPlan.blocks_used[0], "edgar_hook_snap_interrupt");
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
