const axios = require('axios');
const config = require('../config');

/**
 * AI评分服务 - 支持 DeepSeek/OpenAI/自定义（OpenAI 兼容接口）。
 * key 可由用户传入（前端「AI 设置」填写），否则回退到服务端配置。
 */

function resolveEndpoint(provider, baseURL, model) {
  const p = provider || 'deepseek';
  const endpoints = {
    deepseek: { baseURL: baseURL || 'https://api.deepseek.com', model: model || 'deepseek-chat' },
    openai: { baseURL: baseURL || 'https://api.openai.com/v1', model: model || 'gpt-4o-mini' },
  };
  return endpoints[p] || endpoints.deepseek;
}

async function callAI(prompt, aiConfig) {
  const { provider, apiKey, baseURL, model } = aiConfig || {};
  const key = apiKey || config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!key) throw new Error('未配置 AI Key');
  const ep = resolveEndpoint(provider, baseURL, model);
  const url = ep.baseURL.replace(/\/+$/, '') + '/chat/completions';
  const response = await axios.post(
    url,
    {
      model: ep.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    },
    {
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  );
  return response.data.choices[0].message.content;
}

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch (_) {}
  const block = String(raw || '').match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) { try { return JSON.parse(block[1]); } catch (_) {} }
  const obj = String(raw || '').match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch (_) {} }
  return fallback;
}

async function scoreSpeaking(question, userAnswer, timeSpent, aiConfig) {
  const prompt = `你是托福口语评分官。请对以下口语回答进行评分（满分30分）。

题目：${question}

考生回答：${userAnswer}

请从以下维度评分（各占25%）：
1. 语言表达（Delivery）：流利度、发音、语调
2. 语言运用（Language Use）：语法、词汇、句式多样性
3. 话题展开（Topic Development）：逻辑性、完整性、相关性

输出JSON格式（只输出JSON）：
{"score": <0-30>, "delivery": <0-30>, "languageUse": <0-30>, "topicDevelopment": <0-30>, "feedback": "<中文反馈>", "suggestions": ["建议1", "建议2"]}`;

  try {
    const response = await callAI(prompt, aiConfig);
    const result = safeParse(response, {});
    return {
      score: Math.min(30, Math.max(0, result.score || 20)),
      detail: {
        delivery: result.delivery || 20,
        languageUse: result.languageUse || 20,
        topicDevelopment: result.topicDevelopment || 20,
      },
      feedback: result.feedback || '回答基本符合要求。',
      suggestions: result.suggestions || [],
    };
  } catch (err) {
    console.error('[AI-Scoring] 口语评分失败:', err.message);
    return getDefaultSpeakingScore();
  }
}

async function scoreWriting(question, essay, writingType = 'independent', aiConfig) {
  const prompt = `你是托福写作评分官。请对以下${writingType === 'independent' ? '独立' : '综合'}写作进行评分（满分30分）。

题目：${question}

考生文章：
${essay}

评分标准（各占25%）：
1. 内容发展（Development）：论点展开、例证充分性
2. 文章组织（Organization）：结构清晰、逻辑连贯、过渡自然
3. 语言运用（Language Use）：语法准确、词汇丰富、句式多样
4. 技术规范（Mechanics）：拼写、标点、格式

输出JSON格式（只输出JSON）：
{"score": <0-30>, "development": <0-30>, "organization": <0-30>, "languageUse": <0-30>, "mechanics": <0-30>, "feedback": "<中文反馈>", "suggestions": ["建议1", "建议2", "建议3"], "highlights": ["优点1", "优点2"]}`;

  try {
    const response = await callAI(prompt, aiConfig);
    const result = safeParse(response, {});
    return {
      score: Math.min(30, Math.max(0, result.score || 20)),
      detail: {
        development: result.development || 20,
        organization: result.organization || 20,
        languageUse: result.languageUse || 20,
        mechanics: result.mechanics || 20,
      },
      feedback: result.feedback || '文章结构基本完整。',
      suggestions: result.suggestions || [],
      highlights: result.highlights || [],
    };
  } catch (err) {
    console.error('[AI-Scoring] 写作评分失败:', err.message);
    return getDefaultWritingScore();
  }
}

function getDefaultSpeakingScore() {
  return {
    score: 20,
    detail: { delivery: 20, languageUse: 20, topicDevelopment: 20 },
    feedback: '未配置 AI Key 或评分失败，已给出默认分数。请到「个人中心 → AI 设置」配置。',
    suggestions: ['配置 AI Key 后可获得真实评分'],
  };
}

function getDefaultWritingScore() {
  return {
    score: 20,
    detail: { development: 20, organization: 20, languageUse: 20, mechanics: 20 },
    feedback: '未配置 AI Key 或评分失败，已给出默认分数。请到「个人中心 → AI 设置」配置。',
    suggestions: ['配置 AI Key 后可获得真实评分'],
    highlights: ['文章完成了基本要求'],
  };
}

module.exports = { scoreSpeaking, scoreWriting };
