/**
 * PDF解析服务 - 提取托福阅读PDF中的题目
 */
const fs = require('fs');

/**
 * 解析PDF文本，提取托福阅读题目
 */
async function parseTOEFLReadingPDF(filePath, db, passageId) {
  console.log(`[PDF-Parser] 开始解析: ${filePath}, passageId=${passageId}`);

  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch (e) {
    console.error('[PDF-Parser] pdf-parse 模块加载失败:', e.message);
    throw new Error('PDF解析模块未安装，请联系管理员');
  }

  const dataBuffer = fs.readFileSync(filePath);
  console.log(`[PDF-Parser] 文件大小: ${dataBuffer.length} bytes`);

  let pdfData;
  try {
    pdfData = await pdfParse(dataBuffer);
  } catch (e) {
    console.error('[PDF-Parser] pdf-parse 执行失败:', e.message);
    throw new Error('PDF文件解析失败，文件可能损坏或格式不支持');
  }

  const fullText = pdfData.text;
  console.log(`[PDF-Parser] 提取文本长度: ${fullText.length} 字符`);
  console.log(`[PDF-Parser] 文本前200字符: ${fullText.substring(0, 200).replace(/\n/g, '\\n')}`);

  const questions = extractQuestions(fullText);

  console.log(`[PDF-Parser] 提取到 ${questions.length} 道题目`);

  if (questions.length === 0) {
    console.warn('[PDF-Parser] 未能提取到任何题目，PDF文本片段:', fullText.substring(0, 500));
  }

  const inserted = [];
  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    try {
      const result = await db.query(
        `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'real', 'approved', $10, $11)
         RETURNING id, title`,
        ['reading', q.type, q.difficulty, q.title, q.content, JSON.stringify(q.options), q.answer, q.analysis || '', q.passage || '', passageId || null, idx + 1]
      );
      inserted.push({ id: result.rows[0].id, title: result.rows[0].title });
    } catch (err) {
      console.error(`[PDF-Parser] 插入题目失败 [${q.title}]:`, err.message);
    }
  }

  console.log(`[PDF-Parser] 实际入库: ${inserted.length} 道题目`);
  return inserted;
}

/**
 * 从文本中提取题目
 */
function extractQuestions(text) {
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/\u0000/g, '');

  const questions = [];

  // Step 1: Separate passage text from question block
  const { passageText, questionBlock } = splitPassageAndQuestions(cleaned);

  // Step 2: Extract individual questions
  if (questionBlock) {
    const extracted = parseQuestionBlock(questionBlock, passageText);
    questions.push(...extracted);
  }

  // Step 3: Fallback if no questions found
  if (questions.length === 0) {
    return generateFallbackQuestions(passageText || cleaned);
  }

  return questions;
}

/**
 * 分离文章正文和题目区域
 */
function splitPassageAndQuestions(text) {
  let passageText = '';
  let questionBlock = '';

  // Pattern 1: "Questions X-Y" marks question section
  const qSection = text.match(/\nQuestions?\s+\d+/i);
  if (qSection) {
    passageText = text.substring(0, qSection.index).trim();
    questionBlock = text.substring(qSection.index).trim();
    return { passageText, questionBlock };
  }

  // Pattern 2: "Directions:" followed by questions
  const dirMatch = text.match(/\nDirections?:/i);
  if (dirMatch) {
    passageText = text.substring(0, dirMatch.index).trim();
    questionBlock = text.substring(dirMatch.index).trim();
    return { passageText, questionBlock };
  }

  // Pattern 3: Split at first numbered question (1.)
  const firstNum = text.match(/\n\s*1\.\s+/);
  if (firstNum) {
    const beforeQ = text.substring(0, firstNum.index).trim();
    // If before the first question there's substantial text (>200 chars), it's the passage
    if (beforeQ.length > 200) {
      passageText = beforeQ;
      questionBlock = text.substring(firstNum.index).trim();
      return { passageText, questionBlock };
    }
  }

  // Fallback: whole text as question block
  return { passageText: '', questionBlock: text };
}

/**
 * 从题目区域解析单个题目
 */
function parseQuestionBlock(block, passageText) {
  const questions = [];

  // Split by question number: "1. ...", "2. ..."
  const qPattern = /\n\s*(\d+)\.\s+/g;
  const matches = [...block.matchAll(qPattern)];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : block.length;
    const qText = block.substring(start, end).trim();

    const question = parseSingleQuestion(qText, passageText, i);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * 解析单个题目的题干和选项
 */
function parseSingleQuestion(qText, passageText, index) {
  const lines = qText.split('\n');
  let stem = '';
  const optionLines = [];
  let inStem = true;
  let paraRef = '';
  let contentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for paragraph reference like "Paragraph 1" or "Paragraph 1 is marked"
    if (/^Paragraph\s+\d+/i.test(trimmed) && inStem) {
      paraRef = trimmed;
      continue;
    }

    // Option markers: A. B. C. D. or A) B) C) D)
    if (/^[A-D][\.\)]\s/.test(trimmed)) {
      inStem = false;
      optionLines.push(trimmed);
    } else if (inStem) {
      contentLines.push(trimmed);
    }
  }

  stem = contentLines.join(' ');

  if (!stem || optionLines.length < 2) return null;

  // Parse options into label format
  const options = optionLines.map((opt, i) => {
    const match = opt.match(/^([A-D])[\.\)]\s*(.*)/);
    return {
      label: match ? match[1] : String.fromCharCode(65 + i),
      text: match ? match[2].trim() : opt
    };
  });

  // Identify question type based on stem text
  const type = identifyQuestionType(stem);

  // Answer: can't reliably determine from PDF text, leave empty
  const answer = '';

  // Difficulty inference
  const difficulty = inferDifficulty(stem, type);

  // Title from first line of passage
  const title = generateTitle(passageText, stem, index);

  // Analysis stub
  const analysis = `本题为${typeLabelMap[type] || type}，答案需根据文章内容确定。`;

  // Prepend paragraph reference to stem if available
  const fullContent = paraRef ? `${paraRef}\n${stem}` : stem;

  return {
    title,
    content: fullContent,
    options,
    answer,
    type,
    difficulty,
    analysis,
    passage: passageText ? passageText.substring(0, 8000) : ''
  };
}

/**
 * 识别题型
 */
function identifyQuestionType(stem) {
  const lower = stem.toLowerCase();

  if (/\b(?:word|phrase)\b.*\b(?:closest in meaning|meaning|synonym|means)\b/i.test(lower) ||
      /\b(?:the word|the phrase)\b.*\b(?:is closest|means|refers to)\b/i.test(lower)) {
    return 'vocabulary';
  }
  if (/\binfer\b|\bimply\b|\bsuggest\b|\bcan be inferred\b|\bmost likely\b/i.test(lower)) {
    return 'inference';
  }
  if (/\bsummarize\b|\bsummary\b|\bmain idea\b|\bbest expresses\b|\boverall\b/i.test(lower)) {
    return 'summary';
  }
  if (/\bpurpose\b|\bwhy does the author\b|\bthe author mentions\b|\bthe author discusses\b|\bthe author uses\b|\bthe author includes\b/i.test(lower)) {
    return 'purpose';
  }
  if (/\brefer\b|\breference\b|\brefers to\b|\bwhat does\b.*\brefer\b/i.test(lower)) {
    return 'reference';
  }
  if (/\baccording to\b|\bstated\b|\bmentioned\b|\bindicate\b|\bparagraph\s+\d+/i.test(lower)) {
    return 'detail';
  }

  return 'detail';
}

/**
 * 推断难度
 */
function inferDifficulty(stem, type) {
  if (type === 'summary' || type === 'inference') return 'hard';
  if (type === 'vocabulary') return 'easy';
  const lower = stem.toLowerCase();
  if (/\bexcept\b|\bnot\b|\ball of the following\b/i.test(lower)) return 'hard';
  return 'medium';
}

/**
 * 生成题目标题
 */
function generateTitle(passageText, stem, index) {
  if (passageText) {
    const lines = passageText.split('\n').filter(l => l.trim().length > 20);
    if (lines.length > 0) {
      return lines[0].trim().substring(0, 100) + ` (Q${index + 1})`;
    }
  }
  return `PDF题目 ${index + 1}`;
}

const typeLabelMap = {
  detail: '细节题',
  inference: '推断题',
  vocabulary: '词汇题',
  summary: '总结题',
  purpose: '目的题',
  reference: '指代题'
};

/**
 * Fallback: 当完全解析不到题目时生成基础题目
 */
function generateFallbackQuestions(passageText) {
  const sentences = passageText
    .split(/[.!?]\s+/)
    .filter(s => s.trim().length > 30);

  const questions = [];
  const count = Math.min(sentences.length, 5);

  for (let i = 0; i < count; i++) {
    const sentence = sentences[i].trim();
    questions.push({
      title: `PDF阅读题目 ${i + 1}`,
      content: '根据文章内容，以下哪项描述最准确？',
      options: [
        { label: 'A', text: sentence.substring(0, 80) },
        { label: 'B', text: '文章中未明确提及该观点' },
        { label: 'C', text: '该观点与文章主旨相反' },
        { label: 'D', text: '该观点需要更多证据支持' },
      ],
      answer: '',
      type: 'detail',
      difficulty: 'easy',
      analysis: '本题为自动生成的阅读理解题，答案需根据文章内容判断。',
      passage: passageText.substring(0, 8000),
    });
  }

  return questions;
}

module.exports = { parseTOEFLReadingPDF };