/**
 * PDF解析服务 v5 — AI智能体驱动 (多模型后端)
 * 
 * 支持的 AI 后端 (按优先级):
 *   1. DeepSeek (deepseek-chat) — 免费，OpenAI兼容，推荐默认
 *   2. OpenAI (gpt-4o-mini) — 付费，需 API Key
 *   3. 任何 OpenAI 兼容端点 — 自部署/代理均可
 * 
 * 无配置时自动降级到规则引擎 (支持TPO/XPO格式)。
 */

const fs = require('fs');

// ============================================================
// AI 后端配置
// ============================================================

function getAIConfig() {
  try {
    const config = require('../config');
    return {
      provider: config.aiProvider || process.env.AI_PROVIDER || 'deepseek',
      apiKey: config.aiApiKey || config.openaiApiKey || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
      baseURL: config.aiBaseURL || null,
      model: config.aiModel || null
    };
  } catch {
    return {
      provider: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
      baseURL: null,
      model: null
    };
  }
}

function resolveBackend(aiConfig) {
  const { provider, apiKey, baseURL, model } = aiConfig;
  if (!apiKey) return null;

  const backends = {
    deepseek: {
      baseURL: baseURL || 'https://api.deepseek.com',
      model: model || 'deepseek-chat',
      description: 'DeepSeek (免费)'
    },
    openai: {
      baseURL: baseURL || 'https://api.openai.com/v1',
      model: model || 'gpt-4o-mini',
      description: 'OpenAI (付费)'
    },
    custom: {
      baseURL: baseURL || 'https://api.openai.com/v1',
      model: model || 'gpt-4o-mini',
      description: '自定义端点'
    }
  };

  return backends[provider] || backends.deepseek;
}

// ============================================================
// 主入口
// ============================================================

async function parseTOEFLReadingPDF(filePath, db, passageId, options = {}) {
  console.log(`[PDF-Parser v5] 开始解析: ${filePath}`);

  // Step 1: PDF文本提取 (大文件分页处理)
  let pdfParse;
  try { pdfParse = require('pdf-parse'); } catch (e) {
    throw new Error('PDF解析模块未安装：npm install pdf-parse');
  }

  const dataBuffer = fs.readFileSync(filePath);
  const fileSizeMB = dataBuffer.length / 1024 / 1024;
  console.log(`[PDF-Parser v5] 文件: ${fileSizeMB.toFixed(1)} MB`);

  // 大文件分页策略
  const userMaxPages = parseInt(options.maxPages) || 0;
  let maxPages;
  if (userMaxPages > 0) {
    maxPages = userMaxPages;
  } else if (fileSizeMB > 20) {
    maxPages = 25;
    console.log(`[PDF-Parser v5] 大文件(${fileSizeMB.toFixed(1)}MB)，限制前${maxPages}页`);
  } else if (fileSizeMB > 10) {
    maxPages = 50;
  } else {
    maxPages = 0;
  }

  let pdfData;
  try {
    pdfData = await pdfParse(dataBuffer, { max: maxPages });
  } catch (e) {
    if (maxPages === 0) {
      console.log(`[PDF-Parser v5] 全量解析失败，降级到前10页: ${e.message}`);
      pdfData = await pdfParse(dataBuffer, { max: 10 });
    } else {
      throw new Error('PDF解析失败: ' + e.message);
    }
  }

  const rawText = (pdfData.text || '').replace(/\u0000/g, '');
  console.log(`[PDF-Parser v5] 文本: ${rawText.length} 字符, ${pdfData.numpages} 页`);

  // Step 2: 预处理 — 分割文章 + 提取答案key
  const segments = preProcessText(rawText);
  console.log(`[PDF-Parser v5] 预处理: ${segments.length} 个文本段`);

  // Step 3: AI 解析 (每个段落单独处理)
  const aiConfig = getAIConfig();
  const backend = resolveBackend(aiConfig);
  let passages = [];

  const MAX_SEGMENTS = 8; // 最多处理8个段，防止超时
  const segmentsToProcess = segments.slice(0, MAX_SEGMENTS);
  if (segments.length > MAX_SEGMENTS) {
    console.log(`[PDF-Parser v5] 文本段过多(${segments.length})，只处理前${MAX_SEGMENTS}个`);
  }

  if (backend) {
    console.log(`[PDF-Parser v5] AI后端: ${backend.description} (${backend.model})`);
    for (let si = 0; si < segmentsToProcess.length; si++) {
      const seg = segmentsToProcess[si];
      console.log(`[PDF-Parser v5] 解析段 ${si + 1}/${segmentsToProcess.length} (${seg.text.length} 字符)...`);
      try {
        const segPassages = await aiParseSegment(seg, aiConfig.apiKey, backend);
        passages.push(...segPassages);
      } catch (err) {
        console.error(`[PDF-Parser v5] 段 ${si + 1} AI解析失败:`, err.message);
        console.log(`[PDF-Parser v5] 段 ${si + 1} 降级到规则引擎...`);
        passages.push(...ruleBasedParseSegment(seg));
      }
    }
  } else {
    console.log('[PDF-Parser v5] 未配置 AI Key，使用规则引擎');
    for (const seg of segmentsToProcess) {
      passages.push(...ruleBasedParseSegment(seg));
    }
  }

  console.log(`[PDF-Parser v5] 解析出 ${passages.length} 篇文章`);

  // Step 4: 入库
  let inserted = 0;
  for (let pi = 0; pi < passages.length; pi++) {
    const p = passages[pi];
    const subPassageId = passageId ? `${passageId}-p${pi + 1}` : `pdf-p${pi + 1}`;

    for (let qi = 0; qi < (p.questions || []).length; qi++) {
      const q = p.questions[qi];
      try {
        await db.query(
          `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'real', 'approved', $10, $11)`,
          [
            'reading',
            q.type || 'detail',
            q.difficulty || 'medium',
            `${(p.title || 'PDF Reading').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()} - Q${qi + 1}`,
            q.content || q.question,
            JSON.stringify((q.options || []).map((o, i) => ({
              label: o.label || String.fromCharCode(65 + i),
              text: o.text || o
            }))),
            q.answer || '',
            q.analysis || q.explanation || '',
            p.passage_text || p.passage || '',
            subPassageId,
            qi + 1
          ]
        );
        inserted++;
      } catch (err) {
        console.error(`[PDF-Parser v5] 入库失败:`, err.message);
      }
    }
  }

  console.log(`[PDF-Parser v5] 完成: ${inserted} 题入库 (${passages.length} 篇文章)`);
  return { insertedCount: inserted, passageCount: passages.length, totalPages: pdfData.numpages, truncated: segments.length > MAX_SEGMENTS };
}

// ============================================================
// 文本预处理 — 智能分割文章 + 答案key提取
// ============================================================

function preProcessText(rawText) {
  // 清理
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\f/g, '\n').replace(/\u0000/g, '');

  // 识别文章边界: "1 - XPO 1 - Title" 或 "1 - TPO 1 - Title" 或 "Passage 1"
  const passagePattern = /(\d+)\s*[-\-]\s*(?:XPO|TPO|XTP)\s*(\d+)\s*[-\-]\s*(.+)/g;
  const passageMatches = [...text.matchAll(passagePattern)];

  // 识别答案key: "4 - Answers" 后面跟着答案
  // TPO格式中答案编号可能与文章编号不一致，所以同时收集所有答案用于顺序映射
  const answerPattern = /(\d+)\s*[-\-]\s*Answers?\s*\n?([\s\S]*?)(?=\d+\s*[-\-]\s*(?:XPO|TPO|XTP)|$)/gi;
  const answerMatches = [...text.matchAll(answerPattern)];

  // 构建答案map: passageNum -> ["A","C","B",...]
  const answerMap = {};
  // 同时收集所有答案字母，用于顺序回退映射
  const allAnswerLetters = [];

  for (const m of answerMatches) {
    const passageNum = parseInt(m[1]);
    const answerBlock = m[2].trim();
    // 提取字母答案: ACBCDBBDABBCAB D F
    const cleaned = answerBlock.replace(/[\d\n\s]+/g, ' ').trim();
    const letters = cleaned.match(/[A-D]/g);
    if (letters) {
      answerMap[passageNum] = letters;
      allAnswerLetters.push(...letters);
    }
  }

  console.log(`[PDF-Parser v5] 预处理: ${passageMatches.length} 篇文章, ${Object.keys(answerMap).length} 个答案key, 共${allAnswerLetters.length}个答案字母`);

  if (passageMatches.length > 0) {
    // 按 passage 边界分割
    const segments = [];
    let globalAnswerIdx = 0; // 顺序答案索引
    for (let i = 0; i < passageMatches.length; i++) {
      const start = passageMatches[i].index;
      const end = i + 1 < passageMatches.length ? passageMatches[i + 1].index : text.length;
      const segText = text.substring(start, end).trim();
      if (segText.length > 50) {
        const passageNum = parseInt(passageMatches[i][1]);
        // 清理标题：替换制表符、多余空格
        const rawTitle = passageMatches[i][3].trim();
        const passageTitle = rawTitle.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        
        // 优先用编号匹配的答案，否则顺序回退
        let segAnswers = answerMap[passageNum] || null;
        if (!segAnswers && allAnswerLetters.length > globalAnswerIdx) {
          segAnswers = allAnswerLetters.slice(globalAnswerIdx, globalAnswerIdx + 14); // 一篇最多14题
          globalAnswerIdx += (segAnswers?.length || 0);
        } else if (segAnswers) {
          globalAnswerIdx += segAnswers.length;
        }
        
        segments.push({
          text: segText,
          passageNum,
          title: passageTitle,
          answers: segAnswers
        });
      }
    }
    return segments;
  }

  // 回退: 按空行分割
  return splitByBlankLines(text).map((t, i) => ({
    text: t,
    passageNum: i + 1,
    title: null,
    answers: null
  }));
}

// ============================================================
// AI 解析 — 每段独立解析
// ============================================================

async function aiParseSegment(segment, apiKey, backend) {
  const { text, title, answers } = segment;

  // 截断超长文本 (保留文章+题目)
  const maxLen = 8000;
  const chunk = text.length > maxLen ? text.substring(0, maxLen) : text;

  const systemPrompt = `You are a TOEFL reading test parser. Extract structured passages and questions from PDF text.

Return ONLY valid JSON array. Format:
[
  {
    "title": "Passage title",
    "passage_text": "Full passage text (reading material only, NOT questions)",
    "questions": [
      {
        "content": "Full question text including paragraph references",
        "options": [
          {"label": "A", "text": "Option text"},
          {"label": "B", "text": "Option text"},
          {"label": "C", "text": "Option text"},
          {"label": "D", "text": "Option text"}
        ],
        "answer": "A",
        "type": "detail",
        "difficulty": "medium",
        "analysis": "Brief explanation"
      }
    ]
  }
]

RULES:
- Separate the reading passage from questions. passage_text = reading material only.
- Questions often start with a number on its own line, then question text.
- Options may use formats: "A. text", "(A) text", "◯ A text", or "A text"
- If answer key is provided, map answers to questions. Otherwise set answer to "".
- Question types: detail, inference, vocabulary, summary, purpose, negative, reference, insertion
- Difficulty: easy, medium, hard
- Always 4 options per question (some TPO questions have more, just take first 4)
- Return ONLY JSON, no markdown formatting`;

  let userPrompt = chunk;
  if (answers && answers.length > 0) {
    userPrompt += `\n\n--- ANSWER KEY ---\nAnswers: ${answers.join(', ')}\nMap these to questions 1-${answers.length} in order.`;
  }

  const response = await callAI(apiKey, backend, userPrompt, systemPrompt);
  const parsed = extractJSON(response);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI返回格式无效或为空');
  }

  // 用已知答案覆盖
  if (answers && answers.length > 0) {
    for (const passage of parsed) {
      if (!passage.questions) continue;
      for (let qi = 0; qi < passage.questions.length; qi++) {
        if (answers[qi]) {
          passage.questions[qi].answer = answers[qi];
          // 有真实答案时清除 fallback 标记
          if (passage.questions[qi].analysis === '规则解析，答案需人工确认。') {
            passage.questions[qi].analysis = '';
          }
        }
      }
    }
  }

  // 如果有标题，覆盖AI返回的标题
  if (title) {
    for (const passage of parsed) {
      const cleanTitle = title.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!passage.title || passage.title.length < 3) {
        passage.title = cleanTitle;
      } else {
        passage.title = passage.title.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // 清理 passageText：移除开头的 TPO/XPO 头部行 (如 "7 - XPO 3 - Title")
  for (const passage of parsed) {
    if (passage.passage_text) {
      passage.passage_text = passage.passage_text.replace(/^\d+\s*[-\-]\s*(?:XPO|TPO|XTP)\s*\d+\s*[-\-]\s*.+\n/, '').trim();
    }
  }

  return parsed;
}

async function callAI(apiKey, backend, userPrompt, systemPrompt) {
  const OpenAI = require('openai');

  const openai = new OpenAI({
    apiKey,
    baseURL: backend.baseURL
  });

  const response = await openai.chat.completions.create({
    model: backend.model,
    messages: [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 8192
  });

  return response.choices[0].message.content;
}

function extractJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) {}
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) { try { return JSON.parse(codeBlock[1]); } catch (e) {} }
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) { try { return JSON.parse(arrayMatch[0]); } catch (e) {} }
  return null;
}

// ============================================================
// 规则回退 — 支持 TPO/XPO 格式
// ============================================================

function ruleBasedParseSegment(segment) {
  const { text, title, answers } = segment;
  const cleaned = text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n');

  const { passageText, questionBlock } = splitPassageAndQuestions(cleaned);
  let questions = questionBlock ? parseQuestions(questionBlock) : [];

  // 用答案key填充
  if (answers && answers.length > 0 && questions.length > 0) {
    for (let qi = 0; qi < questions.length; qi++) {
      if (answers[qi]) {
        questions[qi].answer = answers[qi];
        // 有真实答案时清除 fallback 标记
        if (questions[qi].analysis === '规则解析，答案需人工确认。') {
          questions[qi].analysis = '';
        }
      }
    }
  }

  // 如果规则解析没找到题目，尝试整个文本
  if (questions.length === 0) {
    questions = parseQuestions(cleaned);
  }

  if (questions.length === 0) {
    return [];
  }

  const segTitle = (title || cleaned.split('\n')[0]?.trim()?.substring(0, 100) || 'PDF Reading')
    .replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 清理 passageText 开头的 TPO 头部
  let cleanPassageText = passageText || cleaned.substring(0, 3000);
  cleanPassageText = cleanPassageText.replace(/^\d+\s*[-\-]\s*(?:XPO|TPO|XTP)\s*\d+\s*[-\-]\s*.+\n/, '').trim();

  return [{
    title: segTitle,
    passage_text: cleanPassageText,
    questions
  }];
}

function splitPassageAndQuestions(text) {
  // TPO格式: 题号在独立行 "1\n题目文本"
  const markers = [
    /\n\s*(\d+)\s*\n\s*[A-Z]/,           // "1\nThe word..."
    /\nQuestions?\s+\d+/i,
    /\nDirections?:?\s*\n/i,
    /\n【题目】/, /\n【问题】/,
    /\nQ1[\.\)\s]/, /\n1\.[ \t]+/
  ];
  for (const m of markers) {
    const match = text.match(m);
    if (match && match.index > 100) {
      return {
        passageText: text.substring(0, match.index).trim(),
        questionBlock: text.substring(match.index).trim()
      };
    }
  }
  return { passageText: text, questionBlock: '' };
}

function parseQuestions(block) {
  const qs = [];

  // 匹配题号: "1\n", "1.", "1)", "1、"
  // TPO格式: 题号在独立行，后面跟题目文本
  // 注意：用 lookahead (?=[A-Z]) 避免消费题干的首字母！
  const patterns = [
    /(?:^|\n)\s*(\d+)\s*\n\s*(?=[A-Z])/g,    // "1\nThe word..." (lookahead 不消费首字母)
    /(?:^|\n)\s*(\d+)[\.\)\、）]\s+/g,        // "1. " or "1) "
  ];

  let matches = [];
  for (const pattern of patterns) {
    const found = [...block.matchAll(pattern)];
    if (found.length > matches.length) matches = found;
  }

  for (let i = 0; i < matches.length; i++) {
    const matchStart = matches[i].index;
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : block.length;
    const section = block.substring(start, end);

    // 解析题干和选项
    const lines = section.split('\n');
    let stem = '';
    const opts = [];
    let inStem = true;

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      // 匹配选项: "A. text", "(A) text", "◯ A text", "A text"
      // TPO格式: "◯ A preference" 或 "A preference"
      const optMatch = t.match(/^(?:◯\s*)?(?:\(|\[)?([A-D])(?:\)|\])?[\.\s、）]\s*(.+)/);
      if (optMatch) {
        inStem = false;
        opts.push({ label: optMatch[1], text: optMatch[2].trim() });
      } else if (/^[A-D][\.\)\、）]\s/.test(t)) {
        inStem = false;
        const parts = t.match(/^([A-D])[\.\)\、）]\s*(.+)/);
        opts.push({ label: parts[1], text: parts[2].trim() });
      } else if (inStem) {
        stem += (stem ? ' ' : '') + t;
      }
    }

    // 跳过答案key行 (如 "1234567891011121314")
    if (/^\d{5,}$/.test(stem.replace(/\s/g, ''))) continue;

    if (stem && opts.length >= 2) {
      const qNum = parseInt(matches[i][1]);
      qs.push({
        content: stem.trim(),
        options: opts.slice(0, 4).map(o => ({
          label: o.label,
          text: o.text
        })),
        answer: '',
        type: guessQuestionType(stem),
        difficulty: 'medium',
        analysis: '规则解析，答案需人工确认。'
      });
    }
  }
  return qs;
}

function guessQuestionType(stem) {
  const lower = stem.toLowerCase();
  if (/closest in meaning/.test(lower) || /word.*paragraph/.test(lower)) return 'vocabulary';
  if (/inferred|inference|imply/.test(lower)) return 'inference';
  if (/best expresses|essential information|summary/.test(lower)) return 'summary';
  if (/purpose|why does the author/.test(lower)) return 'purpose';
  if (/refers to/.test(lower)) return 'reference';
  if (/except|not|least/.test(lower)) return 'negative';
  if (/insert|best fit|square/.test(lower)) return 'insertion';
  return 'detail';
}

function splitByBlankLines(text) {
  return text.split(/\n{3,}/).map(s => s.trim()).filter(s => s.length > 100);
}

module.exports = { parseTOEFLReadingPDF };
