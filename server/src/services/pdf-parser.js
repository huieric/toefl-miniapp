/**
 * PDF解析服务 v3 — AI智能体驱动 (多模型后端)
 * 
 * 支持的 AI 后端 (按优先级):
 *   1. DeepSeek (deepseek-chat) — 免费，OpenAI兼容，推荐默认
 *   2. OpenAI (gpt-4o-mini) — 付费，需 API Key
 *   3. 任何 OpenAI 兼容端点 — 自部署/代理均可
 * 
 * 配置: 在 server/src/config/index.js 中设置:
 *   aiProvider: 'deepseek' | 'openai' | 'custom'
 *   aiApiKey: 'sk-xxx'
 *   aiBaseURL: 'https://api.deepseek.com' (可选)
 *   aiModel: 'deepseek-chat' | 'gpt-4o-mini' (可选)
 * 
 * 无配置时自动降级到规则引擎。
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
async function parseTOEFLReadingPDF(filePath, db, passageId) {
  console.log(`[PDF-Parser v3] 开始解析: ${filePath}`);

  // Step 1: PDF文本提取
  let pdfParse;
  try { pdfParse = require('pdf-parse'); } catch (e) {
    throw new Error('PDF解析模块未安装：npm install pdf-parse');
  }

  const dataBuffer = fs.readFileSync(filePath);
  console.log(`[PDF-Parser v3] 文件: ${(dataBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  let pdfData;
  try {
    pdfData = await pdfParse(dataBuffer, { max: 0 });
  } catch (e) {
    throw new Error('PDF解析失败: ' + e.message);
  }

  const rawText = (pdfData.text || '').replace(/\u0000/g, '');
  console.log(`[PDF-Parser v3] 文本: ${rawText.length} 字符, ${pdfData.numpages} 页`);

  // Step 2: AI 解析
  const aiConfig = getAIConfig();
  const backend = resolveBackend(aiConfig);
  let passages;

  if (backend) {
    console.log(`[PDF-Parser v3] AI后端: ${backend.description} (${backend.model})`);
    try {
      passages = await aiParse(rawText, aiConfig.apiKey, backend);
    } catch (err) {
      console.error(`[PDF-Parser v3] AI解析失败:`, err.message);
      console.log('[PDF-Parser v3] 降级到规则引擎...');
      passages = ruleBasedParse(rawText);
    }
  } else {
    console.log('[PDF-Parser v3] 未配置 AI Key，使用规则引擎');
    passages = ruleBasedParse(rawText);
  }

  console.log(`[PDF-Parser v3] 解析出 ${passages.length} 篇文章`);

  // Step 3: 入库
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
            `${p.title || 'PDF Reading'} - Q${qi + 1}`,
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
        console.error(`[PDF-Parser v3] 入库失败:`, err.message);
      }
    }
  }

  console.log(`[PDF-Parser v3] 完成: ${inserted} 题入库 (${passages.length} 篇文章)`);
  return { insertedCount: inserted, passageCount: passages.length };
}

// ============================================================
// AI 解析管线
// ============================================================

async function aiParse(rawText, apiKey, backend) {
  const maxChunkSize = 12000;

  // 阶段A: 分块
  let chunks;
  if (rawText.length <= maxChunkSize) {
    chunks = [rawText];
  } else {
    chunks = await aiSplitChunks(rawText, apiKey, backend, maxChunkSize);
  }

  // 阶段B: 逐块解析
  const allPassages = [];
  for (let ci = 0; ci < chunks.length; ci++) {
    console.log(`[PDF-Parser v3] 解析块 ${ci + 1}/${chunks.length} (${chunks[ci].length} 字符)...`);
    try {
      const passages = await aiParseChunk(chunks[ci], apiKey, backend);
      allPassages.push(...passages);
    } catch (err) {
      console.error(`[PDF-Parser v3] 块 ${ci + 1} 失败:`, err.message);
      allPassages.push(...ruleBasedParseChunk(chunks[ci], ci));
    }
  }

  return allPassages.length > 0 ? allPassages : ruleBasedParse(rawText);
}

async function aiSplitChunks(fullText, apiKey, backend, maxChunkSize) {
  const roughChunks = splitByBlankLines(fullText);
  if (roughChunks.every(c => c.length <= maxChunkSize)) return roughChunks;

  const preview = fullText.length > 30000 ? fullText.substring(0, 12000) : fullText;

  const prompt = `You are analyzing a PDF containing TOEFL reading passages.

Identify where each reading passage begins. Look for:
- "Passage 1", "Paragraph 1", "TPO-XX"
- Topic shifts
- "Questions X-Y" sections
- Chapter or section headers

Return ONLY a JSON array of character positions where each passage starts. First one is always 0.

Example: [0, 2450, 5680]

TEXT:
${preview}`;

  try {
    const response = await callAI(apiKey, backend, prompt);
    const boundaries = extractJSON(response);
    if (Array.isArray(boundaries) && boundaries.length > 1) {
      return boundaries.map((start, i) => {
        const end = i + 1 < boundaries.length ? boundaries[i + 1] : fullText.length;
        return fullText.substring(start, end).trim();
      });
    }
  } catch (e) {
    console.log('[PDF-Parser v3] AI分块失败:', e.message);
  }

  return splitByBlankLines(fullText);
}

async function aiParseChunk(chunk, apiKey, backend) {
  const systemPrompt = `You are a TOEFL reading test parser. Extract structured passages and questions from ANY format PDF text.

Return ONLY valid JSON array. Format:
[
  {
    "title": "Passage title",
    "passage_text": "Full passage text",
    "questions": [
      {
        "content": "Question including paragraph reference",
        "options": [
          {"label": "A", "text": "Option"},
          {"label": "B", "text": "Option"},
          {"label": "C", "text": "Option"},
          {"label": "D", "text": "Option"}
        ],
        "answer": "A",
        "type": "detail|inference|vocabulary|summary|purpose",
        "difficulty": "easy|medium|hard",
        "analysis": "Explanation"
      }
    ]
  }
]

RULES:
- Extract answer from answer key if present. If not, set answer to "".
- Question type: detail=事实细节, inference=推断, vocabulary=词汇, summary=主旨, purpose=目的
- Always 4 options with labels A/B/C/D
- Include paragraph references in question content
- Handle Chinese, English, or mixed text`;

  const response = await callAI(apiKey, backend, chunk, systemPrompt);
  const parsed = extractJSON(response);
  if (!Array.isArray(parsed)) throw new Error('AI返回格式无效');
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
    max_tokens: 4096
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
// 规则回退
// ============================================================

function ruleBasedParse(text) {
  return splitByBlankLines(text)
    .map((chunk, ci) => ruleBasedParseChunk(chunk, ci))
    .flat()
    .filter(p => p && p.questions && p.questions.length > 0);
}

function ruleBasedParseChunk(chunk, chunkIndex) {
  const cleaned = chunk
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n');

  const { passageText, questionBlock } = splitPassageAndQuestions(cleaned);
  const questions = questionBlock ? parseQuestions(questionBlock) 
                                  : generateFallback(passageText || cleaned);

  if (!passageText && questions.length === 0) return null;

  const firstLine = cleaned.split('\n')[0]?.trim() || `Passage ${chunkIndex + 1}`;
  return {
    title: firstLine.substring(0, 100),
    passage_text: passageText || cleaned,
    questions
  };
}

function splitPassageAndQuestions(text) {
  const markers = [
    /\nQuestions?\s+\d+/i, /\nDirections?:?\s*\n/i,
    /\n【题目】/, /\n【问题】/, /\nQ1[\.\)\s]/, /\n1\.[ \t]+/
  ];
  for (const m of markers) {
    const match = text.match(m);
    if (match && match.index > 50) {
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
  const pattern = /\n\s*(\d+)[\.\)\、）]\s+/g;
  const matches = [...block.matchAll(pattern)];
  
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : block.length;
    const lines = block.substring(start, end).split('\n');
    
    let stem = '';
    const opts = [];
    let inStem = true;
    
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (/^[A-D][\.\)\、）]\s/.test(t)) { inStem = false; opts.push(t); }
      else if (inStem) stem += (stem ? ' ' : '') + t;
    }
    
    if (stem && opts.length >= 2) {
      qs.push({
        content: stem,
        options: opts.slice(0, 4).map((o, j) => ({
          label: String.fromCharCode(65 + j),
          text: o.replace(/^[A-D][\.\)\、）]?\s*/, '').trim()
        })),
        answer: '',
        type: 'detail',
        difficulty: 'medium',
        analysis: '规则解析，答案需人工确认。'
      });
    }
  }
  return qs;
}

function generateFallback(text) {
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 40);
  if (sentences.length < 3) return [];
  return sentences.slice(0, 5).map((s, i) => ({
    content: 'Based on the passage, which of the following is true?',
    options: [
      { label: 'A', text: s.substring(0, 100) },
      { label: 'B', text: 'The passage does not support this statement.' },
      { label: 'C', text: 'This interpretation conflicts with the passage.' },
      { label: 'D', text: 'More evidence is needed.' }
    ],
    answer: 'A',
    type: 'detail',
    difficulty: 'easy',
    analysis: '自动生成，答案基于原文。建议人工审核。'
  }));
}

function splitByBlankLines(text) {
  return text.split(/\n{3,}/).map(s => s.trim()).filter(s => s.length > 100);
}

module.exports = { parseTOEFLReadingPDF };
