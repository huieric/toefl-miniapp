'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { updateSM2, needsSameDayReview, sortByReviewPriority } = require('../src/services/sm2');

test('updateSM2: quality>=3 递增 repetitions 与 interval', () => {
  const r1 = updateSM2(2.5, 0, 0, 4);
  assert.equal(r1.repetitions, 1);
  assert.equal(r1.interval, 1);

  const r2 = updateSM2(r1.easiness, r1.interval, r1.repetitions, 4);
  assert.equal(r2.repetitions, 2);
  assert.equal(r2.interval, 6);

  const r3 = updateSM2(r2.easiness, r2.interval, r2.repetitions, 5);
  assert.equal(r3.repetitions, 3);
  assert.ok(r3.interval >= 6, `interval 应继续增长，实际 ${r3.interval}`);
});

test('updateSM2: quality<3 重置 repetitions 与 interval', () => {
  const r = updateSM2(2.5, 6, 2, 2);
  assert.equal(r.repetitions, 0);
  assert.equal(r.interval, 1);
});

test('updateSM2: easiness 下限 1.3', () => {
  const r = updateSM2(1.3, 0, 0, 0);
  assert.equal(r.easiness, 1.3);
});

test('needsSameDayReview: quality<3 需要当日复习', () => {
  assert.equal(needsSameDayReview(2), true);
  assert.equal(needsSameDayReview(4), false);
});

test('sortByReviewPriority: 按 next_review_at 升序', () => {
  const items = [
    { next_review_at: '2026-06-10T00:00:00.000Z' },
    { next_review_at: '2026-06-01T00:00:00.000Z' },
    { next_review_at: '2026-06-05T00:00:00.000Z' },
  ];
  const sorted = sortByReviewPriority(items);
  assert.equal(sorted[0].next_review_at, '2026-06-01T00:00:00.000Z');
  assert.equal(sorted[2].next_review_at, '2026-06-10T00:00:00.000Z');
});
