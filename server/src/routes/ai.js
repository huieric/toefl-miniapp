const express = require('express');
const { auth } = require('../middleware/auth');
const { _internals } = require('../services/pdf-parser');
const config = require('../config');

const { callAI, resolveBackend, extractJSON } = _internals;
const router = express.Router();

function getKey(apiKey) {
  return apiKey || config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
}

// POST /api/ai/grade - AI 打分（口语/写作）。key 可由客户端传入（用户自填 provider+key），否则用服务端配置
router.post('/grade', auth, async (req, res) => {
  try {
    const { subject, text, questionId, provider, apiKey, baseURL, model } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ code: 400, message: '缺少待评文本' });

    const key = getKey(apiKey);
    const backend = resolveBackend({ provider: provider || 'deepseek', apiKey: key, baseURL, model });
    if (!backend || !key) {
      return res.json({ code: 200, data: { needsKey: true, score: null, message: '未配置 AI Key，请到「个人中心 → AI 设置」填写（DeepSeek 便宜，或任意 OpenAI 兼容接口）' } });
    }

    const isSpeaking = subject === 'speaking';
    const systemPrompt = isSpeaking
      ? '你是托福口语考官（TOEFL iBT Speaking，满分30）。严格按以下 3 个标准打分，每项 0-5：'
        + '1) Delivery 表达流利度（语速、停顿、发音、语调）；2) Language Use 语言使用（语法、词汇准确度与丰富度）；3) Topic Development 话题展开（观点清晰、逻辑连贯、例子具体）。'
        + '请返回 JSON：{"score":0-30整数,"criteria":[{"name":"Delivery","score":0-5,"comment":"..."},{"name":"Language Use",...},{"name":"Topic Development",...}],"feedback":"总体评价(中文,2-3句)","suggestions":["改进建议1(中文)",...],"sampleAnswer":"参考高分回答模板(英文,约100词)"}'
      : '你是托福写作考官（TOEFL iBT Writing，满分30）。按 4 个维度评分：1) Task Achievement 任务完成度；2) Organization 结构与连贯；3) Vocabulary 词汇；4) Grammar 语法。'
        + '请返回 JSON：{"score":0-30整数,"criteria":[{"name":"Task Achievement","score":0-5,"comment":"..."},{"name":"Organization",...},{"name":"Vocabulary",...},{"name":"Grammar",...}],"feedback":"总体评价(中文,2-3句)","suggestions":["改进建议1(中文)",...],"sampleAnswer":"参考范文(英文,约150词)"}';

    const userPrompt = `科目: ${subject}\n题目ID: ${questionId || '未知'}\n\n学生回答：\n${text}\n\n请按系统要求评分并只返回 JSON。`;

    const raw = await callAI(key, backend, userPrompt, systemPrompt);
    let parsed = extractJSON(raw);
    if (!parsed) {
      parsed = { score: null, feedback: 'AI 未返回可解析结果', raw };
    }

    res.json({ code: 200, data: { needsKey: false, ...parsed } });
  } catch (e) {
    console.error('[AI] 打分失败:', e.message);
    res.status(500).json({ code: 500, message: 'AI 打分失败: ' + e.message });
  }
});

module.exports = router;
