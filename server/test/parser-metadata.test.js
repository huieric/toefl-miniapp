'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { _internals } = require('../src/services/pdf-parser');
const { preProcessText, ruleBasedParseSegment, extractTextWithLayout } = _internals;

test('preProcessText: 识别中文格式 TPO 边界（TPO1 阅读第1篇）', () => {
  const text = [
    'TPO1 阅读第1篇',
    'Groundwater',
    '学科分类：地理学 (Geography)',
    'Passage',
    'Groundwater is the word used to describe water that saturates the ground, filling all the available spaces.',
    '1. What is groundwater?',
    'A. a B. b C. c D. d',
  ].join('\n');
  const segs = preProcessText(text);
  assert.equal(segs.length, 1, '应切出 1 段');
});

test('preProcessText: 识别 Sample 前缀 + 多篇边界', () => {
  const text = [
    'Sample1 阅读第1篇',
    'The Origins of Theater',
    'Passage',
    'The origins of theater are ancient and span across many cultures and time periods.',
    '1. What is theater?',
    'A. a B. b C. c D. d',
    'Sample2 阅读第2篇',
    'Desert Formation',
    'Passage',
    'Deserts form in various ways depending on climate and geographic conditions.',
    '1. Why?',
    'A. a B. b C. c D. d',
  ].join('\n');
  const segs = preProcessText(text);
  assert.equal(segs.length, 2, '应切出 2 段');
});

test('ruleBasedParseSegment: 剥离中文元数据，标题干净', () => {
  const text = [
    'TPO1 阅读第1篇 Groundwater 学科分类：地理学 (Geography) Passage',
    'Groundwater is the word used to describe water that saturates the ground, filling all the available spaces.',
    '1',
    'What is groundwater?',
    'A. the water that fills the spaces in soil',
    'B. the water in rivers and lakes',
    'C. the water in the ocean',
    'D. the water in glaciers',
  ].join('\n');
  const passages = ruleBasedParseSegment({ text, title: null, answers: null });
  assert.equal(passages.length, 1);
  const p = passages[0];
  assert.ok(!/学科分类/.test(p.title), '标题不应含学科分类');
  assert.ok(!/Passage/.test(p.title), '标题不应含 Passage');
  assert.ok(!/学科分类/.test(p.passage_text), '正文不应含学科分类');
  assert.ok(!/阅读第\s*\d+\s*篇/.test(p.passage_text), '正文不应含阅读第N篇');
});

test('extractTextWithLayout: 真实 PDF 能检测段落边界', async () => {
  const pdfPath = path.join(__dirname, '..', '..', '..', 'pdf', 'TPO01-1_Groundwater.pdf');
  if (!fs.existsSync(pdfPath)) { test.skip('未找到测试 PDF'); return; }
  const dataBuffer = fs.readFileSync(pdfPath);
  const { text, numpages } = await extractTextWithLayout(dataBuffer, 100);
  assert.ok(text.length > 1000, '文本应足够长');
  assert.ok(numpages >= 5, '页数应 >= 5');
  // 段落数（空行分隔）应 >= 3（TOEFL 阅读至少 3 段）
  const paraCount = text.split(/\n\s*\n/).filter(Boolean).length;
  assert.ok(paraCount >= 3, `段落数应 >= 3，实际 ${paraCount}`);
});

test('中文格式 PDF：答案区（Answer Key 答案）能被提取并赋给题目', async () => {
  const pdfPath = path.join(__dirname, '..', '..', '..', 'pdf', 'TPO01-1_Groundwater.pdf');
  if (!fs.existsSync(pdfPath)) { test.skip('未找到测试 PDF'); return; }
  const dataBuffer = fs.readFileSync(pdfPath);
  const { text } = await extractTextWithLayout(dataBuffer, 100);
  const segs = preProcessText(text);
  assert.ok(segs.length >= 1, '应切出至少 1 段');
  const passages = ruleBasedParseSegment(segs[0]);
  const qs = passages[0]?.questions || [];
  assert.ok(qs.length >= 10, `题目数应 >= 10，实际 ${qs.length}`);
  const withAns = qs.filter((q) => q.answer && q.answer.trim()).length;
  assert.equal(withAns, qs.length, `全部题目应有答案（${withAns}/${qs.length}）`);
  assert.ok(qs[0].answer === 'C' || /^[A-F]$/.test(qs[0].answer), '第一题答案应为合法字母');
});
