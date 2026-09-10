'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const aiScoring = require('../src/services/ai-scoring');

const originalPost = axios.post;

function mockAI(content) {
  axios.post = async () => ({ data: { choices: [{ message: { content } }] } });
}
function mockThrow(msg) {
  axios.post = async () => { throw new Error(msg); };
}
function restore() {
  axios.post = originalPost;
}

test.afterEach(restore);

test('scoreWriting: 解析 AI 返回 JSON 并限制分数 0-30', async () => {
  mockAI(JSON.stringify({ score: 24, development: 23, organization: 25, languageUse: 24, mechanics: 22, feedback: '不错', suggestions: ['改进'] }));
  const r = await aiScoring.scoreWriting('题目', '文章', 'independent', { apiKey: 'sk-test' });
  assert.equal(r.score, 24);
  assert.equal(r.detail.development, 23);
  assert.ok(Array.isArray(r.suggestions));
  // 分数越界钳制
  mockAI(JSON.stringify({ score: 999, feedback: 'x' }));
  const r2 = await aiScoring.scoreWriting('题目', '文章', 'independent', { apiKey: 'sk-test' });
  assert.equal(r2.score, 30);
  mockAI(JSON.stringify({ score: -5, feedback: 'x' }));
  const r3 = await aiScoring.scoreWriting('题目', '文章', 'independent', { apiKey: 'sk-test' });
  assert.equal(r3.score, 0);
});

test('scoreSpeaking: 解析 AI 返回并含六维度', async () => {
  mockAI(JSON.stringify({
    score: 22,
    pronunciation: 20, fluency: 23, intonation: 19, grammar: 22, vocabulary: 24, taskCompletion: 21,
    feedback: '流利', suggestions: ['注意语调'], strengths: ['词汇丰富'], weaknesses: ['语调平淡'],
  }));
  const r = await aiScoring.scoreSpeaking('题目', '回答', 30, { apiKey: 'sk-test' });
  assert.equal(r.score, 22);
  assert.equal(r.detail.pronunciation, 20);
  assert.equal(r.detail.fluency, 23);
  assert.equal(r.detail.intonation, 19);
  assert.equal(r.detail.grammar, 22);
  assert.equal(r.detail.vocabulary, 24);
  assert.equal(r.detail.taskCompletion, 21);
  assert.ok(Array.isArray(r.strengths));
  assert.ok(Array.isArray(r.weaknesses));
});

test('scoreWriting: AI 失败时回退默认分（不抛异常）', async () => {
  mockThrow('API 超时');
  const r = await aiScoring.scoreWriting('题目', '文章', 'independent', { apiKey: 'sk-test' });
  assert.equal(r.score, 20);
  assert.ok(r.feedback);
});

test('scoreWriting: AI 返回非 JSON 时安全兜底', async () => {
  mockAI('抱歉，我无法评分。'); // 非 JSON
  const r = await aiScoring.scoreWriting('题目', '文章', 'independent', { apiKey: 'sk-test' });
  assert.ok(r.score >= 0 && r.score <= 30, '分数应在 0-30');
});

test('未配置 key 时回退默认分（不抛异常）', async () => {
  // 不 mock：真实 axios 会因为无 key 而抛错 → 应回退默认
  axios.post = originalPost;
  const r = await aiScoring.scoreWriting('题目', '文章', 'independent', {}); // 无 key
  assert.equal(r.score, 20);
});
