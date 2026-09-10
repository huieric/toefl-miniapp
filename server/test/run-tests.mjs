import { review, mapQualityToRating, retrievability, nextInterval } from '../src/services/fsrs.js';
import { updateSM2, needsSameDayReview, sortByReviewPriority } from '../src/services/sm2.js';
import { normalizeAnswer, parseAnswerKeyBlock, guessQuestionType, parseQuestions } from '../src/services/pdf-parser.js';

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; }
  catch (e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

// FSRS
test('retrievability: t=S 时≈0.9', () => {
  const r = retrievability(3.7145, 3.7145);
  if (Math.abs(r - 0.9) >= 0.001) throw new Error('期望≈0.9，实际 ' + r);
});

test('nextInterval: r=0.9 时=stability', () => {
  const ivl = nextInterval(0.9, 3.7145);
  if (Math.abs(ivl - 3.7145) >= 0.01) throw new Error('期望≈3.71，实际 ' + ivl);
});

test('新卡 good: S=w2, D=w4', () => {
  const res = review(null, 3);
  if (res.retrievability !== null) throw new Error('retrievability should be null');
  if (Math.abs(res.stability - 3.7145) >= 0.001) throw new Error('stability mismatch');
  if (Math.abs(res.difficulty - 5.1618) >= 0.001) throw new Error('difficulty mismatch');
});

test('新卡 easy interval > good interval', () => {
  const good = review(null, 3);
  const easy = review(null, 4);
  if (easy.interval <= good.interval) throw new Error('easy should > good');
});

test('成功复习: 稳定度上升', () => {
  const first = review(null, 3);
  const state = { stability: first.stability, difficulty: first.difficulty, lastReviewAt: Date.now() - first.interval * 86400000 };
  const second = review(state, 3);
  if (second.stability <= first.stability) throw new Error('stability should increase');
});

test('遗忘复习: 稳定度下降', () => {
  const first = review(null, 3);
  const state = { stability: first.stability, difficulty: first.difficulty, lastReviewAt: Date.now() - first.interval * 86400000 };
  const lapse = review(state, 1);
  if (lapse.stability >= first.stability) throw new Error('stability should decrease');
});

test('难度上限 10', () => {
  let s = null;
  let last = null;
  for (let i = 0; i < 50; i++) {
    last = review(s, 1);
    s = { stability: last.stability, difficulty: last.difficulty, lastReviewAt: Date.now() };
  }
  if (last.difficulty > 10) throw new Error('difficulty > 10');
});

test('mapQualityToRating', () => {
  if (mapQualityToRating(0) !== 1) throw new Error('0->1');
  if (mapQualityToRating(4) !== 3) throw new Error('4->3');
  if (mapQualityToRating(5) !== 4) throw new Error('5->4');
});

// SM2
test('SM2 quality>=3: 递增', () => {
  const r1 = updateSM2(2.5, 0, 0, 4);
  if (r1.repetitions !== 1) throw new Error('reps=0+1=1, got ' + r1.repetitions);
});

test('SM2 quality<3: 重置', () => {
  const r = updateSM2(2.5, 6, 2, 2);
  if (r.repetitions !== 0) throw new Error('reps should reset to 0, got ' + r.repetitions);
  if (r.interval !== 1) throw new Error('interval should reset to 1, got ' + r.interval);
});

test('needsSameDayReview', () => {
  if (!needsSameDayReview(2)) throw new Error('quality<3 should need review');
  if (needsSameDayReview(4)) throw new Error('quality>=3 should not need review');
});

// PDF Parser
test('normalizeAnswer: B -> B', () => {
  if (normalizeAnswer('B') !== 'B') throw new Error('normalize B');
});

test('normalizeAnswer: array [A,B] -> A,B', () => {
  if (normalizeAnswer(['A', 'B']) !== 'A,B') throw new Error('normalize array');
});

test('guessQuestionType', () => {
  if (guessQuestionType('The word "x" is closest in meaning to') !== 'vocabulary') throw new Error('vocab');
  if (guessQuestionType('What can be inferred about') !== 'inference') throw new Error('inference');
  if (guessQuestionType('Why does the author mention') !== 'purpose') throw new Error('purpose');
});

test('parseQuestions: 提取选项', () => {
  const block = '1\nThe word "x" is closest in meaning to\nA. first option\nB. second option\nC. third option\nD. fourth option\n';
  const qs = parseQuestions(block);
  if (qs.length !== 1) throw new Error('expected 1 question, got ' + qs.length);
  if (qs[0].options.length !== 4) throw new Error('expected 4 options, got ' + qs[0].options.length);
  if (qs[0].options[0].label !== 'A') throw new Error('first label should be A');
});

console.log('\n' + '='.repeat(30));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
