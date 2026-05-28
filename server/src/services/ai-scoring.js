const axios = require('axios');
const config = require('../config');

/**
 * AI评分服务 - 使用OpenAI API对口语/写作进行评分
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * 评分口语回答
 * @param {string} question - 题目内容
 * @param {string} userAnswer - 用户回答（文字稿）
 * @param {number} timeSpent - 用时（秒）
 * @returns {Promise<Object>} 评分结果
 */
async function scoreSpeaking(question, userAnswer, timeSpent) {
  const prompt = `你是托福口语评分官。请对以下口语回答进行评分（满分30分）。

题目：${question}

考生回答：${userAnswer}

请从以下维度评分（各占25%）：
1. 语言表达（Delivery）：流利度、发音、语调
2. 语言运用（Language Use）：语法、词汇、句式多样性
3. 话题展开（Topic Development）：逻辑性、完整性、相关性

输出JSON格式：
{
  "score": <0-30的数字>,
  "delivery": <0-30>,
  "languageUse": <0-30>,
  "topicDevelopment": <0-30>,
  "feedback": "<中文反馈，100字以内>",
  "suggestions": ["建议1", "建议2"]
}`;

  try {
    const response = await callOpenAI(prompt);
    const result = JSON.parse(response);
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

/**
 * 评分写作文章
 * @param {string} question - 题目内容
 * @param {string} essay - 用户文章
 * @param {string} writingType - 'independent' | 'integrated'
 * @returns {Promise<Object>} 评分结果
 */
async function scoreWriting(question, essay, writingType = 'independent') {
  const prompt = `你是托福写作评分官。请对以下${writingType === 'independent' ? '独立' : '综合'}写作进行评分（满分30分）。

题目：${question}

考生文章：
${essay}

评分标准（各占25%）：
1. 内容发展（Development）：论点展开、例证充分性
2. 文章组织（Organization）：结构清晰、逻辑连贯、过渡自然
3. 语言运用（Language Use）：语法准确、词汇丰富、句式多样
4. 技术规范（Mechanics）：拼写、标点、格式

输出JSON格式：
{
  "score": <0-30的数字>,
  "development": <0-30>,
  "organization": <0-30>,
  "languageUse": <0-30>,
  "mechanics": <0-30>,
  "feedback": "<中文反馈，150字以内>",
  "suggestions": ["建议1", "建议2", "建议3"],
  "highlights": ["优点1", "优点2"]
}`;

  try {
    const response = await callOpenAI(prompt);
    const result = JSON.parse(response);
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

/**
 * 调用OpenAI API
 */
async function callOpenAI(prompt) {
  if (!config.openaiApiKey) {
    throw new Error('未配置OPENAI_API_KEY');
  }

  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}

function getDefaultSpeakingScore() {
  return {
    score: 20,
    detail: { delivery: 20, languageUse: 20, topicDevelopment: 20 },
    feedback: '系统评分服务暂不可用，已给出默认分数。',
    suggestions: ['请检查网络连接后重试AI评分'],
  };
}

function getDefaultWritingScore() {
  return {
    score: 20,
    detail: { development: 20, organization: 20, languageUse: 20, mechanics: 20 },
    feedback: '系统评分服务暂不可用，已给出默认分数。',
    suggestions: ['请检查网络连接后重试AI评分'],
    highlights: ['文章完成了基本要求'],
  };
}

module.exports = { scoreSpeaking, scoreWriting };