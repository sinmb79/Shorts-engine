import { test } from "node:test";
import * as assert from "node:assert/strict";

test("default config asset loader returns all four bundled config texts", async () => {
  const module = await import("../../src/config/default-config-assets.js");

  assert.deepEqual(module.DEFAULT_CONFIG_FILE_NAMES, [
    "engine.json",
    "shorts-config.json",
    "prompt-styles.json",
    "user-profile.json",
  ]);

  const engineText = await module.getDefaultConfigAssetText("engine.json");
  const shortsText = await module.getDefaultConfigAssetText("shorts-config.json");
  const promptStylesText = await module.getDefaultConfigAssetText("prompt-styles.json");
  const userProfileText = await module.getDefaultConfigAssetText("user-profile.json");

  assert.match(engineText, /"video_generation"/);
  assert.match(shortsText, /"assets"/);
  assert.match(promptStylesText, /"caption_template"/);
  assert.match(userProfileText, /"daily_cost_limit_usd"/);
});
