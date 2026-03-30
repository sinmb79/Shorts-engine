import { test } from "node:test";
import * as assert from "node:assert/strict";

import { composeSearchQuery } from "../../src/prompt/search-query-composer.js";

test("composeSearchQuery returns vocabulary-driven stock search terms", () => {
  const composed = composeSearchQuery({
    sentence: "인공지능과 자동화로 만드는 미래 앱",
    count: 4,
    engine: "pexels",
  });

  assert.equal(composed.engine_format, "pexels");
  assert.deepEqual(composed.metadata.search_queries, [
    "robot brain",
    "digital mind",
    "AI hologram",
    "gears mechanism",
  ]);
});
