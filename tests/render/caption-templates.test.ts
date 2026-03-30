import { test } from "node:test";
import * as assert from "node:assert/strict";

import { selectCaptionTemplate } from "../../src/render/caption-templates.js";

test("selectCaptionTemplate prefers an explicit request style before corner fallback", () => {
  const template = selectCaptionTemplate("explainer", "tiktok_viral");

  assert.equal(template.id, "tiktok_viral");
});

test("selectCaptionTemplate resolves viral corner to tiktok_viral", () => {
  const template = selectCaptionTemplate("viral");

  assert.equal(template.id, "tiktok_viral");
  assert.equal(template.animation, "karaoke");
});
