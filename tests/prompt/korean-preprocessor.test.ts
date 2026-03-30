import { test } from "node:test";
import * as assert from "node:assert/strict";

import { preprocessKorean } from "../../src/prompt/korean-preprocessor.js";

test("preprocessKorean expands acronyms, numbers, percentages, and units", () => {
  const processed = preprocessKorean(
    "AI와 ChatGPT로 1,234명을 100% 만족시킨 3km 러닝 앱",
  );

  assert.match(processed, /에이아이와/);
  assert.match(processed, /챗지피티로/);
  assert.match(processed, /천이백삼십사 명/);
  assert.match(processed, /백 퍼센트/);
  assert.match(processed, /삼 킬로미터/);
});

test("preprocessKorean cleans URLs and emails for TTS-safe output", () => {
  const processed = preprocessKorean(
    "문의는 help@example.com 또는 https://openai.com/docs 에서 확인!!",
  );

  assert.doesNotMatch(processed, /help@example\.com/);
  assert.doesNotMatch(processed, /https?:\/\//);
  assert.match(processed, /이메일 주소/);
  assert.match(processed, /링크/);
  assert.equal(processed, "문의는 이메일 주소 또는 링크에서 확인!");
});
