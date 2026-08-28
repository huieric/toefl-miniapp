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

async function parseTOEFLReadingPDF(filePath, db, passageId, options = {}, onProgress) {
  console.log(`[PDF-Parser v5] 开始解析: ${filePath}`);

  // 科目（默认阅读；听力/口语/写作上传时传入）+ 音频地址（听力题关联录音）+ 题集标识
  const subject = options.subject || 'reading';
  const audioUrl = options.audioUrl || null;
  const batchId = options.batchId || passageId || null;
  const batchName = options.batchName || null;

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
    maxPages = 100;
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

  let rawText = (pdfData.text || '').replace(/\u0000/g, '');
  console.log(`[PDF-Parser v5] 文本: ${rawText.length} 字符, ${pdfData.numpages} 页`);

  // 判断是否疑似扫描版：文字层极短，或平均每页字符数过低（混合 PDF 的扫描页也覆盖）
  const OCR_MAX_PAGES = 30;
  const parsedPages = maxPages > 0 ? Math.min(maxPages, pdfData.numpages || 0) : (pdfData.numpages || 0);
  const density = parsedPages > 0 ? rawText.length / parsedPages : 0;
  const looksScanned = rawText.trim().length < 100 || density < 120;
  if (looksScanned) {
    console.log(`[PDF-Parser v5] 疑似扫描件(密度 ${density.toFixed(0)} 字符/页)，尝试本地 OCR（最多前 ${OCR_MAX_PAGES} 页）...`);
    try {
      const { extractTextViaOCR } = require('./ocr');
      const ocrText = await extractTextViaOCR(filePath, {
        maxPages: OCR_MAX_PAGES,
        onProgress: (done, total) => {
          if (onProgress) onProgress({ phase: 'ocr', done, total });
        },
      });
      console.log(`[PDF-Parser v5] OCR 完成: ${ocrText.length} 字符`);
      // OCR 结果更丰富则采用，否则保留原文本层继续解析
      if (ocrText.length > rawText.length) rawText = ocrText;
    } catch (ocrErr) {
      console.error('[PDF-Parser v5] OCR 失败:', ocrErr.message);
      if (rawText.trim().length < 100) {
        throw new Error(`PDF 无文字层且本地 OCR 不可用（需 poppler-utils + tesseract.js）：${ocrErr.message}`);
      }
    }
  }

  // Step 2: 预处理 — 分割文章 + 提取答案key
  const segments = preProcessText(rawText);
  console.log(`[PDF-Parser v5] 预处理: ${segments.length} 个文本段`);

  // Step 3+4: 逐段解析 + 立即入库（实现「跑完一套显示一套」+ 进度上报）
  const aiConfig = getAIConfig();
  const backend = resolveBackend(aiConfig);
  const requestedMaxPassages = parseInt(options.maxPassages) || 0;
  // 默认尽量多解析（后台进行，前端分段展示）；上限 50 篇防止超大合集导致内存/超时问题
  const MAX_SEGMENTS = requestedMaxPassages > 0 ? requestedMaxPassages : 50;
  const segmentsToProcess = segments.slice(0, MAX_SEGMENTS);
  if (segments.length > MAX_SEGMENTS) {
    console.log(`[PDF-Parser v5] 文本段过多(${segments.length})，只处理前${MAX_SEGMENTS}个`);
  }

  if (backend) {
    console.log(`[PDF-Parser v5] AI后端: ${backend.description} (${backend.model})`);
  } else {
    console.log('[PDF-Parser v5] 未配置 AI Key，使用规则引擎');
  }

  let inserted = 0;
  let skipped = 0;
  let passagesDone = 0;

  for (let si = 0; si < segmentsToProcess.length; si++) {
    const seg = segmentsToProcess[si];
    console.log(`[PDF-Parser v5] 解析段 ${si + 1}/${segmentsToProcess.length} (${seg.text.length} 字符)...`);

    // 解析当前段（AI 优先，失败降级规则）
    let segPassages = [];
    if (backend) {
      try {
        segPassages = await aiParseSegment(seg, aiConfig.apiKey, backend);
      } catch (err) {
        console.error(`[PDF-Parser v5] 段 ${si + 1} AI解析失败:`, err.message);
        console.log(`[PDF-Parser v5] 段 ${si + 1} 降级到规则引擎...`);
        segPassages = ruleBasedParseSegment(seg);
      }
    } else {
      segPassages = ruleBasedParseSegment(seg);
    }

    // 立即入库当前段的题（重复题自动跳过）
    for (let pi = 0; pi < segPassages.length; pi++) {
      const p = segPassages[pi];
      console.log(`[PDF-Parser v5] 篇: ${(p.title || '(无标题)').substring(0, 60)} | 正文: ${(p.passage_text || '').substring(0, 100).replace(/\s+/g, ' ')}`);
      const subPassageId = passageId ? `${passageId}-p${passagesDone + pi + 1}` : `pdf-p${passagesDone + pi + 1}`;

      for (let qi = 0; qi < (p.questions || []).length; qi++) {
        const q = p.questions[qi];
        try {
          const ins = await db.query(
            `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, audio_url, batch_id, batch_name, source, status, passage_id, question_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'user', 'approved', $13, $14)
             ON CONFLICT DO NOTHING`,
            [
              subject,
              q.type || 'detail',
              q.difficulty || 'medium',
              `${(p.title || 'PDF Passage').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()} - Q${qi + 1}`,
              q.content || q.question,
              JSON.stringify((q.options || []).map((o, i) => ({
                label: o.label || String.fromCharCode(65 + i),
                text: o.text || o
              }))),
              normalizeAnswer(q.answer),
              q.analysis || q.explanation || '',
              p.passage_text || p.passage || '',
              audioUrl,
              batchId,
              batchName,
              subPassageId,
              qi + 1
            ]
          );
          if (ins.rowCount > 0) inserted++;
          else skipped++;
        } catch (err) {
          console.error(`[PDF-Parser v5] 入库失败:`, err.message);
        }
      }
    }
    passagesDone += segPassages.length;

    // 上报进度：每解析完一段就通知，前端据此展示「已解析 X 篇」
    if (onProgress) {
      onProgress({
        phase: 'parse',
        passagesDone,
        passagesTotal: segmentsToProcess.length,
        questionsInserted: inserted,
      });
    }
  }

  const pageLimited = maxPages > 0 && pdfData.numpages > maxPages;
  const segmentLimited = segments.length > MAX_SEGMENTS;

  console.log(`[PDF-Parser v5] 完成: ${inserted} 题入库, ${skipped} 题已存在跳过 (${passagesDone} 篇文章)`);
  return {
    insertedCount: inserted,
    skippedCount: skipped,
    passageCount: passagesDone,
    discoveredPassageCount: segments.length,
    totalPages: pdfData.numpages,
    parsedPages: maxPages > 0 ? Math.min(maxPages, pdfData.numpages) : pdfData.numpages,
    truncated: pageLimited || segmentLimited,
    pageLimited,
    segmentLimited
  };
}

// ============================================================
// 文本预处理 — 智能分割文章 + 答案key提取
// ============================================================

function preProcessText(rawText) {
  // 清理
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\t/g, ' ');

  // 识别文章边界: "1 - XPO 1 - Title" 或 "1 - TPO 1 - Title" 或 "Passage 1"
  const passagePattern = /(?:^|\n)\s*(\d+)\s*[-–—]\s*(?:XPO|TPO|XTP)\s*(\d+)\s*[-–—]\s*([^\n]+)/gi;
  const passageMatches = [...text.matchAll(passagePattern)];

  // 识别答案key: "4 - Answers" 后面跟着答案
  // TPO格式中答案编号可能与文章编号不一致，所以同时收集所有答案用于顺序映射
  const answerPattern = /(?:^|\n)\s*(\d+)\s*[-–—]\s*Answers?\s*\n?([\s\S]*?)(?=(?:^|\n)\s*\d+\s*[-–—]\s*(?:XPO|TPO|XTP)\b|\s*$)/gi;
  const answerMatches = [...text.matchAll(answerPattern)];

  // 构建答案map: passageNum -> ["A","C",...,"B,C,E"]
  const answerMap = {};
  const answerBlocksInOrder = [];
  let allAnswerCount = 0;

  for (const m of answerMatches) {
    const passageNum = parseInt(m[1]);
    const answers = parseAnswerKeyBlock(m[2]);
    if (answers.length > 0) {
      answerMap[passageNum] = answers;
      answerBlocksInOrder.push({ passageNum, answers });
      allAnswerCount += answers.reduce((sum, answer) => sum + splitAnswerLabels(answer).length, 0);
    }
  }

  console.log(`[PDF-Parser v5] 预处理: ${passageMatches.length} 篇文章, ${Object.keys(answerMap).length} 个答案key, 共${allAnswerCount}个答案字母`);

  if (passageMatches.length > 0) {
    // 按 passage 边界分割
    const segments = [];
    let answerBlockIdx = 0;
    for (let i = 0; i < passageMatches.length; i++) {
      const start = passageMatches[i].index;
      const end = i + 1 < passageMatches.length ? passageMatches[i + 1].index : text.length;
      const fullSegText = text.substring(start, end).trim();
      const segText = stripAnswerBlocks(fullSegText);
      if (segText.length > 50) {
        const passageNum = parseInt(passageMatches[i][1]);
        // 清理标题：替换制表符、多余空格
        const rawTitle = passageMatches[i][3].trim();
        const passageTitle = rawTitle.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        
        // 优先用编号匹配的答案，否则顺序回退
        let segAnswers = answerMap[passageNum] || null;
        if (!segAnswers && answerBlocksInOrder[answerBlockIdx]) {
          segAnswers = answerBlocksInOrder[answerBlockIdx].answers;
          answerBlockIdx++;
        } else if (segAnswers) {
          answerBlockIdx = Math.max(answerBlockIdx, answerBlocksInOrder.findIndex(a => a.passageNum === passageNum) + 1);
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

  // 中文格式边界: "TPO1 阅读第1篇" / "Sample1 阅读第1篇" / "阅读第1篇"
  const cnPattern = /(?:^|\n)\s*(?:(?:TPO|XPO|XTP|Sample)\s*\d+\s*)?阅读第\s*(\d+)\s*篇/gi;
  const cnMatches = [...text.matchAll(cnPattern)];
  if (cnMatches.length > 0) {
    const segments = [];
    for (let i = 0; i < cnMatches.length; i++) {
      const start = cnMatches[i].index;
      const end = i + 1 < cnMatches.length ? cnMatches[i + 1].index : text.length;
      const segText = text.substring(start, end).trim();
      if (segText.length > 50) {
        segments.push({
          text: segText,
          passageNum: parseInt(cnMatches[i][1], 10),
          title: null,
          answers: null,
        });
      }
    }
    console.log(`[PDF-Parser v5] 中文格式：${segments.length} 篇文章`);
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

  const systemPrompt = `You are a TOEFL reading test parser AND answer key expert. Extract structured passages and questions from PDF text.

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

CRITICAL RULES:
- Separate the reading passage from questions. passage_text = reading material only.
- ⚠️ passage_text MUST preserve paragraph structure: separate each paragraph with double newline (\\n\\n). Do NOT merge all paragraphs into a single block of text. TOEFL passages typically have 3-6 paragraphs.
- Questions often start with a number on its own line, then question text.
- Options may use formats: "A. text", "(A) text", "◯ A text", or "A text"
- ⚠️ EVERY question MUST have a non-empty "answer" field (A/B/C/D). 
  Read each question carefully against the passage text and determine the CORRECT answer.
  You are taking the role of a TOEFL expert — infer the correct answer from context.
- If an explicit answer key is provided below, use it. Otherwise infer from the passage.
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
      // 后处理: 确保 passage_text 有段落分隔
      passage.passage_text = preserveParagraphs(passage.passage_text);
    }
  }

  // 后处理: 确保每道题都有答案（AI 推断或随机填充兜底）
  let emptyAnswerCount = 0;
  for (const passage of parsed) {
    if (!passage.questions) continue;
    for (const q of passage.questions) {
      if (!q.answer || q.answer.trim() === '') {
        emptyAnswerCount++;
        // 兜底: 如果 AI 没给答案，从选项中随机选一个（总比空着好）
        if (q.options && q.options.length > 0) {
          q.answer = q.options[Math.floor(Math.random() * q.options.length)].label || 'A';
          q.analysis = (q.analysis || '') + ' [AI答案待人工复核]';
        } else {
          q.answer = 'A';
          q.analysis = (q.analysis || '') + ' [默认答案，需人工确认]';
        }
      }
    }
  }
  if (emptyAnswerCount > 0) {
    console.log(`[PDF-Parser v5.1] ⚠️ ${emptyAnswerCount} 道题AI未提供答案，已使用兜底策略`);
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
    max_tokens: 8192,
    timeout: 60000
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
  const cleaned = stripAnswerBlocks(text)
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/(?<=\S)[^\S\n]+(?=\S)/g, ' ')  // 只折叠词间空白，保留行首缩进（段落识别依赖它）
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

  // 清理 passageText 的中英文 TPO 头部 + 中文元数据（学科分类/Passage，任意位置）
  let cleanPassageText = passageText || cleaned.substring(0, 3000);
  cleanPassageText = cleanPassageText
    .replace(/^\d+\s*[-\-]\s*(?:XPO|TPO|XTP)\s*\d+\s*[-\-]\s*.+\n/gi, '')
    .replace(/(?:(?:TPO|XPO|XTP|Sample)\s*\d+\s*)?阅读第\s*\d+\s*篇\s*/gi, '')
    .replace(/\s*学科分类[:：][^\n]*/gi, '')
    .replace(/\s*\bPassage\b\s*$/gim, '')
    .trim();

  // 提取真正的文章标题：跳过元数据行，取第一个英文标题行
  const extractRealTitle = (t) => {
    const lines = String(t || '').split('\n').map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (/阅读第\s*\d+\s*篇|学科分类|^Passage$/i.test(l)) continue;
      if (/^[A-Z]/.test(l) && l.split(' ').length <= 15 && l.length <= 150) return l;
    }
    return lines[0] || 'PDF Reading';
  };
  const segTitle = (title && !/阅读第|学科分类|^Passage$/i.test(title))
    ? title.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
    : extractRealTitle(cleanPassageText);

  // 去掉文章正文里重复的标题行（标题单独展示，正文不再重复）
  if (segTitle && segTitle !== 'PDF Reading') {
    const esc = segTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanPassageText = cleanPassageText.replace(new RegExp('^\\s*' + esc + '\\s*\\n?', 'i'), '').trim();
  }

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
      const passageText = text.substring(0, match.index).trim();
      // 保护段落分隔：确保 passageText 中段落之间保留 \n\n
      const preserved = preserveParagraphs(passageText);
      return {
        passageText: preserved,
        questionBlock: text.substring(match.index).trim()
      };
    }
  }
  return { passageText: preserveParagraphs(text), questionBlock: '' };
}

/**
 * 保护/恢复段落分隔结构：
 * 1. 保留原文中已有的 \n\n 分段
 * 2. 对单换行 (\n) 后有缩进空白的情况，升级为 \n\n
 * 3. 对完全没有分段标记的长文本，用句末标点+大写字母启发式断段
 */
function preserveParagraphs(text) {
  if (!text || text.length < 50) return text || '';

  // 已经有足够的空行分段，直接返回
  const blankLineCount = (text.match(/\n\s*\n/g) || []).length;
  if (blankLineCount >= 2) return text;

  // 尝试恢复缩进分段：行首有空白 → 视为新段落
  const lines = text.split('\n');
  const restored = [];
  let prevWasBlank = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 空行 → 段落分隔
    if (trimmed === '') {
      restored.push('');
      prevWasBlank = true;
      continue;
    }

    // 行首有空白（缩进遗留）+ 上一行有内容 → 新段落
    if (/^\s{2,}/.test(line) && restored.length > 0 && !prevWasBlank) {
      restored.push(''); // 插入空行作为分隔
    }

    restored.push(trimmed);
    prevWasBlank = false;
  }

  // 检查恢复效果
  let result = restored.join('\n');
  const restoredBlankCount = (result.match(/\n\s*\n/g) || []).length;

  if (restoredBlankCount >= 2) return result;

  // 兜底：对仍然没有分段的长文本，用启发式强制断段
  // 句末标点 (.!?]") 后跟换行+大写字母/段落标记 → 插入额外空行
  result = result.replace(/\n(?=[A-Z\u201c\u300c(])/g, (match, offset) => {
    // 检查上一整行末尾是否是句末标点（原实现只取前20字符，>40判断恒为false，导致从未断段）
    const lineStart = result.lastIndexOf('\n', offset - 1) + 1;
    const before = result.substring(lineStart, offset).trimEnd();
    if (/[.!?]["')\]]?$/.test(before) && before.length > 40) {
      return '\n\n';
    }
    return match;
  });

  return result;
}

function parseQuestions(block) {
  const qs = [];
  const cleanBlock = stripAnswerBlocks(block);

  // 匹配题号: "1\n", "1.", "1)", "1、"
  // TPO格式: 题号在独立行，后面跟题目文本
  // 注意：用 lookahead (?=[A-Z]) 避免消费题干的首字母！
  const patterns = [
    /(?:^|\n)\s*(\d+)\s*\n\s*(?=[A-Z])/g,    // "1\nThe word..." (lookahead 不消费首字母)
    /(?:^|\n)\s*(\d+)[\.\)\、）]\s+/g,        // "1. " or "1) "
  ];

  let matches = [];
  for (const pattern of patterns) {
    const found = [...cleanBlock.matchAll(pattern)];
    if (found.length > matches.length) matches = found;
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : cleanBlock.length;
    const section = cleanBlock.substring(start, end);

    // 解析题干和选项
    const lines = section.split('\n');
    let stem = '';
    const opts = [];
    let inStem = true;

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      // 匹配选项: "A. text", "(A) text", "◯ A text", "▢ A. text"
      const optMatch =
        t.match(/^(?:[◯○●〇▢□■☐]\s*)?(?:\(|\[)?([A-F])(?:\)|\])?[\.\、）]\s*(.+)/) ||
        t.match(/^[◯○●〇▢□■☐]\s*([A-F])\s+(.+)/) ||
        (opts.length > 0 ? t.match(/^([A-F])\s+(.+)/) : null);
      if (optMatch) {
        inStem = false;
        opts.push({ label: optMatch[1], text: optMatch[2].trim() });
      } else if (/^[A-F][\.\)\、）]\s/.test(t)) {
        inStem = false;
        const parts = t.match(/^([A-F])[\.\)\、）]\s*(.+)/);
        opts.push({ label: parts[1], text: parts[2].trim() });
      } else if (!inStem && opts.length > 0) {
        opts[opts.length - 1].text = `${opts[opts.length - 1].text} ${t}`.trim();
      } else if (inStem) {
        stem += (stem ? ' ' : '') + t;
      }
    }

    // 跳过答案key行 (如 "1234567891011121314")
    if (/^\d{5,}$/.test(stem.replace(/\s/g, ''))) continue;

    if (stem && opts.length === 0 && isInsertionQuestion(stem)) {
      opts.push(
        { label: 'A', text: 'Position A' },
        { label: 'B', text: 'Position B' },
        { label: 'C', text: 'Position C' },
        { label: 'D', text: 'Position D' }
      );
    }

    if (stem && opts.length >= 2) {
      const qNum = parseInt(matches[i][1]);
      const type = guessQuestionType(stem);
      const maxOptions = type === 'summary' ? 6 : 4;
      qs.push({
        content: cleanInlineText(stem),
        options: opts.slice(0, maxOptions).map(o => ({
          label: o.label,
          text: cleanInlineText(o.text)
        })),
        answer: '',
        type,
        difficulty: 'medium',
        analysis: '规则解析，答案需人工确认。'
      });
    }
  }
  return qs;
}

function stripAnswerBlocks(text) {
  return text.replace(/(?:^|\n)\s*\d+\s*[-–—]\s*Answers?\s*\n?[\s\S]*?(?=(?:^|\n)\s*\d+\s*[-–—]\s*(?:XPO|TPO|XTP)\b|\s*$)/gi, '\n').trim();
}

function cleanInlineText(text) {
  return String(text || '')
    .replace(/\t/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAnswerKeyBlock(block) {
  const text = String(block || '').replace(/\t/g, ' ');
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const numberLine = lines.find(line => parseAnswerNumberLine(line).length >= 4);
  const questionNumbers = numberLine ? parseAnswerNumberLine(numberLine) : [];
  const questionCount = questionNumbers.length > 0 ? Math.max(...questionNumbers) : 0;
  const labels = text.match(/[A-F]/g) || [];

  if (labels.length === 0) return [];

  if (questionCount > 0) {
    if (labels.length > questionCount) {
      return [
        ...labels.slice(0, questionCount - 1),
        labels.slice(questionCount - 1).join(',')
      ];
    }
    return labels.slice(0, questionCount);
  }

  if (labels.length > 14) {
    return [
      ...labels.slice(0, 13),
      labels.slice(13).join(',')
    ];
  }
  return labels;
}

function parseAnswerNumberLine(line) {
  const normalized = String(line || '').replace(/[^\d\s]/g, '').trim();
  if (!normalized) return [];

  const spaced = normalized.match(/\d+/g) || [];
  if (spaced.length >= 4 && spaced.every((value, index) => Number(value) === index + 1)) {
    return spaced.map(Number);
  }

  const compact = normalized.replace(/\s+/g, '');
  const numbers = [];
  let rest = compact;
  for (let expected = 1; expected <= 40; expected++) {
    const token = String(expected);
    if (!rest.startsWith(token)) break;
    numbers.push(expected);
    rest = rest.slice(token.length);
    if (!rest) break;
  }
  return numbers.length >= 4 ? numbers : [];
}

function splitAnswerLabels(answer) {
  if (Array.isArray(answer)) return answer.map(String).map(a => a.trim()).filter(Boolean);
  return String(answer || '').match(/[A-F]/g) || [];
}

function normalizeAnswer(answer) {
  const labels = splitAnswerLabels(answer);
  return labels.join(',');
}

function isInsertionQuestion(stem) {
  const lower = stem.toLowerCase();
  return /insert|sentence could be added|where would the sentence best fit|four squares/.test(lower);
}

function guessQuestionType(stem) {
  const lower = stem.toLowerCase();
  if (/closest in meaning/.test(lower) || /word.*paragraph/.test(lower)) return 'vocabulary';
  if (/inferred|inference|imply/.test(lower)) return 'inference';
  if (/summar|introductory sentence|selecting the three|essential information/.test(lower)) return 'summary';
  if (/purpose|why does the author/.test(lower)) return 'purpose';
  if (/refers? to/.test(lower)) return 'reference';
  if (/except|not|least/.test(lower)) return 'negative';
  if (/insert|best fit|square/.test(lower)) return 'insertion';
  return 'detail';
}

function splitByBlankLines(text) {
  return text.split(/\n{3,}/).map(s => s.trim()).filter(s => s.length > 100);
}

module.exports = {
  parseTOEFLReadingPDF,
  _internals: {
    preProcessText,
    ruleBasedParseSegment,
    parseQuestions,
    parseAnswerKeyBlock,
    normalizeAnswer,
    guessQuestionType
  }
};
