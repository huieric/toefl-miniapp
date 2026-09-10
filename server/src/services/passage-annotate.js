/**
 * 阅读篇章 AI 标注服务
 * 为阅读 passage 添加生词标注、长难句解析、中文翻译
 */

const { callAI, resolveBackend, extractJSON } = require('./pdf-parser');

/**
 * 调用 AI 标注一篇阅读 passage
 * 返回: { vocabulary: [{word, meaning, pos}], longSentences: [{sentence, parsing, grammarType, mainClause, clauses, translation, keyPoints}], annotation: {passageWithAnnotations}}
 */
async function annotatePassage(passageText, questions, apiKey, provider, baseURL, model) {
  const key = apiKey || getServerKey();
  const backend = resolveBackend({ provider: provider || 'deepseek', apiKey: key, baseURL, model });
  if (!backend || !key) {
    return { needsKey: true, vocabulary: [], longSentences: [], passageWithAnnotations: passageText };
  }

  const systemPrompt = `你是托福阅读教学专家。请分析以下托福阅读段落，完成以下任务：

1. **生词提取**：提取托福级别生词（约 CET-6+ 难度），每个词标注：
   - word: 英文单词
   - meaning: 中文释义（1-2个主要含义）
   - pos: 词性（n./v./adj./adv./conj./prep.等）

2. **长难句深度解析**：提取 3-6 个复杂长难句（含复合句、插入语、倒装、省略等特殊结构），每句标注：
   - sentence: 原句（完整复制）
   - parsing: 语法结构分析（主干 + 修饰成分说明）
   - grammarType: 语法类型标签（如：定语从句 / 状语从句 / 同位语从句 / 倒装句 / 强调句 / 分词作状语 / 独立主格 / 插入结构）
   - mainClause: 主句核心（提取主干：主语 + 谓语 + 宾语/表语）
   - clauses: 从句列表（每个含类型 + 内容）
   - translation: 中文翻译
   - keyPoints: 关键语法点说明（1-2句话解释该句的语法重点）

3. **段落注释**：在原文中用 [vocab:词义] 标记生词，用 [📝解析] 标记长难句位置。

请严格按以下 JSON 格式返回，不要添加任何额外文字：
{
  "vocabulary": [
    {"word": "string", "meaning": "string", "pos": "string"}
  ],
  "longSentences": [
    {
      "sentence": "string",
      "parsing": "string",
      "grammarType": "string",
      "mainClause": "string",
      "clauses": [
        {"type": "string", "content": "string"}
      ],
      "translation": "string",
      "keyPoints": "string"
    }
  ],
  "passageWithAnnotations": "string (原文 + 标注)"
}`;

  const userPrompt = `请分析以下托福阅读段落：

=== 文章内容 ===
${passageText}

=== 配套题目（共 ${questions?.length || 0} 题）===
${questions?.slice(0, 5).map((q, i) => `${i + 1}. ${q.content}`).join('\n')}

请开始分析：`;

  try {
    const raw = await callAI(key, backend, userPrompt, systemPrompt);
    const parsed = extractJSON(raw);
    
    if (parsed && parsed.vocabulary && parsed.longSentences) {
      return {
        needsKey: false,
        ...parsed,
        // 限制生词数量，避免过多
        vocabulary: parsed.vocabulary.slice(0, 20),
        longSentences: parsed.longSentences.slice(0, 8),
      };
    }
    
    // 如果 AI 返回格式不对，返回基础数据
    return {
      needsKey: false,
      vocabulary: [],
      longSentences: [],
      passageWithAnnotations: passageText,
      raw: raw?.substring(0, 200),
    };
  } catch (e) {
    console.error('[AI-Annotate] 标注失败:', e.message);
    return {
      needsKey: false,
      vocabulary: [],
      longSentences: [],
      passageWithAnnotations: passageText,
      error: e.message,
    };
  }
}

function getServerKey() {
  try {
    const config = require('../config');
    return config.aiApiKey || config.openaiApiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  } catch {
    return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  }
}

module.exports = { annotatePassage };
