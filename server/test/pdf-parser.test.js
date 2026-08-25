'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { _internals } = require('../src/services/pdf-parser');
const { normalizeAnswer, parseAnswerKeyBlock, guessQuestionType, parseQuestions } = _internals;

test('normalizeAnswer: 统一答案标签格式', () => {
  assert.equal(normalizeAnswer('B'), 'B');
  assert.equal(normalizeAnswer('A,B,C'), 'A,B,C');
  assert.equal(normalizeAnswer(['A', 'B']), 'A,B');
});

test('parseAnswerKeyBlock: 从答案块提取字母序列', () => {
  const block = '\n1 - Answers\nA C B D A\n';
  const answers = parseAnswerKeyBlock(block);
  assert.ok(answers.length >= 4, `答案数应 >=4，实际 ${answers.length}`);
  assert.equal(answers[0], 'A');
});

test('guessQuestionType: 题型识别', () => {
  assert.equal(guessQuestionType('The word "x" is closest in meaning to'), 'vocabulary');
  assert.equal(guessQuestionType('What can be inferred about'), 'inference');
  assert.equal(guessQuestionType('Why does the author mention'), 'purpose');
  assert.equal(guessQuestionType('Which best summarizes'), 'summary');
  assert.equal(guessQuestionType('Which of the following is NOT'), 'negative');
  assert.equal(guessQuestionType('Where would the sentence best fit'), 'insertion');
  assert.equal(guessQuestionType('What does "it" refer to'), 'reference');
  assert.equal(guessQuestionType('According to paragraph 2'), 'detail');
});

test('parseQuestions: 解析题干与四个选项', () => {
  const block = '1\nThe word "x" is closest in meaning to\nA. first option\nB. second option\nC. third option\nD. fourth option\n';
  const qs = parseQuestions(block);
  assert.equal(qs.length, 1);
  assert.equal(qs[0].options.length, 4);
  assert.equal(qs[0].options[0].label, 'A');
  assert.equal(qs[0].options[0].text, 'first option');
});
