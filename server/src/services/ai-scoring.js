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
  const prompt = `你是托福口语评分官。请对以下口语回答进行详细评分（满分30分）。

题目：${question}

考生回答：${userAnswer}

请从以下维度评分（各维度满分30分）：
1. Pronunciation 发音准确度（25%权重）：音素准确性、单词重音、口音程度
2. Fluency 流利度（25%权重）：语速、停顿、连贯性、填充词使用
3. Intonation 语调自然度（15%权重）：句调变化、强调、情感表达
4. Grammar 语法正确度（15%权重）：时态、句型、语法错误
5. Vocabulary 词汇丰富度（10%权重）：用词多样性、学术词汇使用
6. Task Completion 任务完成度（10%权重）：是否完整回答问题、内容充分性

输出JSON格式（只输出JSON，不要其他文字）：
{"score": <0-30整数>, "pronunciation": <0-30>, "fluency": <0-30>, "intonation": <0-30>, "grammar": <0-30>, "vocabulary": <0-30>, "taskCompletion": <0-30>, "feedback": "<中文综合反馈，2-3句话>", "suggestions": ["具体建议1", "具体建议2"], "strengths": ["优点1", "优点2"], "weaknesses": ["弱点1", "弱点2"]}`;

  try {
    const response = await callAI(prompt, aiConfig);
    const result = safeParse(response, {});
    return {
      score: Math.min(30, Math.max(0, Math.round(result.score || 20))),
      detail: {
        pronunciation: result.pronunciation || 20,
        fluency: result.fluency || 20,
        intonation: result.intonation || 20,
        grammar: result.grammar || 20,
        vocabulary: result.vocabulary || 20,
        taskCompletion: result.taskCompletion || 20,
      },
      feedback: result.feedback || '回答基本符合要求，注意提高流利度和准确性。',
      suggestions: result.suggestions || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
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

请特别关注文章中的语法错误和表达改进空间，对每句进行分析。

输出JSON格式（只输出JSON）：
{
  "score": <0-30>,
  "development": <0-30>,
  "organization": <0-30>,
  "languageUse": <0-30>,
  "mechanics": <0-30>,
  "feedback": "<中文总体反馈，2-3句话>",
  "suggestions": ["建议1", "建议2", "建议3"],
  "highlights": ["优点1", "优点2"],
  "lineFeedback": [
    {
      "original": "<原文句子>",
      "level": "<good|acceptable|needs-improvement>",
      "suggestion": "<修改建议，如果是good句子则为空>",
      "explanation": "<中文解释为什么这样修改或为什么好>"
    }
  ]
}`;

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
      lineFeedback: result.lineFeedback || [],
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
    lineFeedback: [],
  };
}

/**
 * AI 辅助构思 — 为独立写作提供思路、论据和结构建议
 */
async function brainstorm(question, type, aiConfig) {
  const prompt = `你是一位经验丰富的托福写作辅导老师。请针对以下独立写作题目，为学生生成写作构思辅助。

写作题目：${question}

请按以下JSON格式输出（只输出JSON，不要其他内容）：
{
  "thesis": "<用一句话概括核心论点>",
  "structure": "<推荐的文章结构，如：引言段 + 主体段1 + 主体段2 + 结论段>",
  "points": [
    {
      "title": "<第一个分论点标题>",
      "explanation": "<详细说明该论点的理由>",
      "example": "<具体的例子，可以是个人经历、常识或研究>",
      "transition": "<段落间的过渡句>"
    },
    {
      "title": "<第二个分论点标题>",
      "explanation": "<详细说明该论点的理由>",
      "example": "<具体的例子>",
      "transition": "<段落间的过渡句>"
    }
  ],
  "vocabulary": [
    { "word": "<高级词汇>", "meaning": "<中文释义>", "usage": "<例句>" }
  ],
  "tips": "<写作技巧和注意事项>",
  "sampleIntro": "<引言段范文（约3-4句）>",
  "sampleConclusion": "<结论段范文（约2-3句）>"
}`;

  try {
    const response = await callAI(prompt, aiConfig);
    const result = safeParse(response, {
      thesis: '请根据你的理解写出核心论点',
      structure: '引言段 + 两个主体段 + 结论段',
      points: [],
      vocabulary: [],
      tips: '',
      sampleIntro: '',
      sampleConclusion: '',
    });

    return {
      thesis: result.thesis || '请根据你的理解写出核心论点',
      structure: result.structure || '引言段 + 两个主体段 + 结论段',
      points: Array.isArray(result.points) ? result.points : [],
      vocabulary: Array.isArray(result.vocabulary) ? result.vocabulary : [],
      tips: result.tips || '注意使用连接词使文章连贯。',
      sampleIntro: result.sampleIntro || '',
      sampleConclusion: result.sampleConclusion || '',
    };
  } catch (err) {
    console.error('[AI-Brainstorm] AI构思失败:', err.message);
    return {
      thesis: '请先列出你的核心观点',
      structure: '引言段 + 两个主体段 + 结论段',
      points: [],
      vocabulary: [],
      tips: 'AI构思暂时不可用，请配置 AI Key 后重试。',
      sampleIntro: '',
      sampleConclusion: '',
    };
  }
}

/**
 * AI 写作润色 — 对学员作文进行逐句优化建议
 */
async function polishEssay(question, essay, aiConfig) {
  const prompt = `你是一位专业的托福写作辅导老师。请对以下考生的独立写作作文进行润色优化。

写作题目：${question}

考生文章：
${essay}

请输出JSON格式（只输出JSON，不要其他内容）：
{
  "overallScore": <0-30>,
  "summary": "<中文总体评价，2-3句话，指出主要优缺点>",
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["弱点1", "弱点2"],
  "polishedSentences": [
    {
      "original": "<原文句子>",
      "polished": "<润色后的句子>",
      "type": "<grammar|vocabulary|structure|style>",
      "explanation": "<中文解释修改原因和收益>",
      "level": "<essential|recommended|optional>"
    }
  ],
  "revisedEssay": "<完整的润色后全文，保持原意但优化表达>",
  "vocabularyUpgrade": [
    {
      "original": "<普通表达>",
      "suggested": "<更高级的表达>",
      "context": "<在作文中的使用场景>"
    }
  ],
  "structureTips": "<文章结构优化建议>",
  "estimatedTOEFLScore": {
    "total": <0-30>,
    "development": <0-30>,
    "organization": <0-30>,
    "languageUse": <0-30>,
    "mechanics": <0-30>
  }
}`;

  try {
    const response = await callAI(prompt, aiConfig);
    const result = safeParse(response, {
      overallScore: 20,
      summary: '文章完成了基本要求，有一些可以提升的空间。',
      strengths: [],
      weaknesses: [],
      polishedSentences: [],
      revisedEssay: essay,
      vocabularyUpgrade: [],
      structureTips: '',
      estimatedTOEFLScore: { total: 20, development: 20, organization: 20, languageUse: 20, mechanics: 20 },
    });

    return {
      overallScore: Math.min(30, Math.max(0, result.overallScore || 20)),
      summary: result.summary || '文章完成了基本要求。',
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      polishedSentences: Array.isArray(result.polishedSentences) ? result.polishedSentences.map(ps => ({
        original: ps.original || '',
        polished: ps.polished || ps.original || '',
        type: ps.type || 'vocabulary',
        explanation: ps.explanation || '',
        level: ps.level || 'recommended',
      })) : [],
      revisedEssay: result.revisedEssay || essay,
      vocabularyUpgrade: Array.isArray(result.vocabularyUpgrade) ? result.vocabularyUpgrade.map(vu => ({
        original: vu.original || '',
        suggested: vu.suggested || vu.original || '',
        context: vu.context || '',
      })) : [],
      structureTips: result.structureTips || '注意段落间使用过渡词。',
      estimatedTOEFLScore: {
        total: Math.min(30, Math.max(0, (result.estimatedTOEFLScore?.total || 20))),
        development: Math.min(30, Math.max(0, (result.estimatedTOEFLScore?.development || 20))),
        organization: Math.min(30, Math.max(0, (result.estimatedTOEFLScore?.organization || 20))),
        languageUse: Math.min(30, Math.max(0, (result.estimatedTOEFLScore?.languageUse || 20))),
        mechanics: Math.min(30, Math.max(0, (result.estimatedTOEFLScore?.mechanics || 20))),
      },
    };
  } catch (err) {
    console.error('[AI-Polish] AI润色失败:', err.message);
    return getDefaultPolishResult(essay);
  }
}

function getDefaultPolishResult(essay) {
  return {
    overallScore: 20,
    summary: 'AI润色暂时不可用，已配置 AI Key 后可获得逐句优化建议。',
    strengths: [],
    weaknesses: [],
    polishedSentences: [],
    revisedEssay: essay,
    vocabularyUpgrade: [],
    structureTips: '',
    estimatedTOEFLScore: { total: 20, development: 20, organization: 20, languageUse: 20, mechanics: 20 },
  };
}

module.exports = { scoreSpeaking, scoreWriting, brainstorm, polishEssay };
