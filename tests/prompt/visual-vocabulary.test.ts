import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  sentenceToVisualQueries,
  translateToVisual,
} from "../../src/prompt/visual-vocabulary.js";

test("translateToVisual returns cinematic English for Korean concepts", () => {
  const translated = translateToVisual("서울 골목의 비 내리는 밤");

  assert.match(translated, /narrow Seoul alleyway/);
  assert.match(translated, /heavy rain/);
  assert.match(translated, /cinematic/);
});

test("sentenceToVisualQueries returns matched visual phrases before generic fallback", () => {
  const queries = sentenceToVisualQueries("인공지능과 자동화로 만드는 미래 앱", 4);

  assert.deepEqual(queries, [
    "robot brain",
    "digital mind",
    "AI hologram",
    "gears mechanism",
  ]);
});
