import assert from "node:assert/strict";
import test from "node:test";
import { apps } from "../src/data/apps.js";
test("영양 분석 자료는 사진·텍스트 분석을 제공하는 새 공개 사이트로 연결한다", () => {
  const matches = apps.filter(app => app.id === "growth-meal-ai");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].url, "https://growth-meal-ai-foodchecker.imsangyun1269.chatgpt.site/");
  assert.match(matches[0].description, /텍스트/);
  assert.ok(apps.some(app => app.id === "science-unit-game"), "다른 수업 자료를 유지한다");
});
