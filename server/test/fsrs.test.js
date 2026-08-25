'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  review,
  mapQualityToRating,
  retrievability,
  nextInterval,
} = require('../src/services/fsrs');

test('retrievability: t=S 时约为 0.9', () => {
  const r = retrievability(3.7145, 3.7145);
  assert.ok(Math.abs(r - 0.9) < 0.001, `期望≈0.9，实际 ${r}`);
});

test('nextInterval: r=0.9 时等于 stability', () => {
  const ivl = nextInterval(0.9, 3.7145);
  assert.ok(Math.abs(ivl - 3.7145) < 0.01, `期望≈3.71，实际 ${ivl}`);
});

test('新卡评分: good 初始化稳定性=w2、难度=w4', () => {
  const res = review(null, 3);
  assert.equal(res.retrievability, null);
  assert.ok(Math.abs(res.stability - 3.7145) < 0.001);
  assert.ok(Math.abs(res.difficulty - 5.1618) < 0.001);
});

test('新卡评分: easy 间隔大于 good 间隔', () => {
  const good = review(null, 3);
  const easy = review(null, 4);
  assert.ok(easy.interval > good.interval, `easy=${easy.interval} 应 > good=${good.interval}`);
});

test('成功复习: 稳定度上升，难度仍在 [1,10]', () => {
  const first = review(null, 3); // 新卡 good
  const state = {
    stability: first.stability,
    difficulty: first.difficulty,
    lastReviewAt: Date.now() - first.interval * 86400000,
  };
  const second = review(state, 3);
  assert.ok(second.stability > first.stability, `稳定度应上升: ${first.stability} -> ${second.stability}`);
  assert.ok(second.difficulty >= 1 && second.difficulty <= 10);
  assert.ok(second.interval > 0);
});

test('遗忘复习(again): 稳定度下降', () => {
  const first = review(null, 3);
  const state = {
    stability: first.stability,
    difficulty: first.difficulty,
    lastReviewAt: Date.now() - first.interval * 86400000,
  };
  const lapse = review(state, 1);
  assert.ok(lapse.stability < first.stability, `遗忘后稳定度应下降: ${first.stability} -> ${lapse.stability}`);
});

test('难度上限 10（连续 again 不溢出）', () => {
  let s = null;
  let last = null;
  for (let i = 0; i < 50; i++) {
    last = review(s, 1);
    s = { stability: last.stability, difficulty: last.difficulty, lastReviewAt: Date.now() };
  }
  assert.ok(last.difficulty <= 10, `难度应 ≤10，实际 ${last.difficulty}`);
});

test('mapQualityToRating: quality 0-5 映射', () => {
  assert.equal(mapQualityToRating(0), 1);
  assert.equal(mapQualityToRating(1), 1);
  assert.equal(mapQualityToRating(2), 1);
  assert.equal(mapQualityToRating(3), 2);
  assert.equal(mapQualityToRating(4), 3);
  assert.equal(mapQualityToRating(5), 4);
});
