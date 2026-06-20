const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const config = require('../config');
const { parseTOEFLReadingPDF } = require('../services/pdf-parser');

const router = express.Router();

// === 内存状态追踪：PDF 解析状态 ===
const uploadStatusMap = new Map(); // uploadId -> { status, fileName, parsedCount, error, updatedAt }

function setUploadStatus(uploadId, status) {
  uploadStatusMap.set(uploadId, { ...status, updatedAt: new Date().toISOString() });
  // 5分钟后清理旧状态
  setTimeout(() => uploadStatusMap.delete(uploadId), 5 * 60 * 1000);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('仅支持PDF文件'));
    }
  },
});

// POST /api/questions/upload - 上传PDF题目
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择PDF文件' });
    }

    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 标记状态为 processing
    setUploadStatus(uploadId, {
      status: 'processing',
      fileName: req.file.originalname,
      parsedCount: 0,
      error: null,
    });

    console.log(`[Questions] 开始解析PDF: ${req.file.originalname} (uploadId=${uploadId}, size=${req.file.size})`);

    // 异步解析PDF，source 设为 'real'，passage_id = uploadId
    parseTOEFLReadingPDF(req.file.path, db, uploadId)
      .then(async (inserted) => {
        console.log(`[Questions] PDF解析完成 uploadId=${uploadId}，共插入 ${inserted.length} 道题目`);
        setUploadStatus(uploadId, {
          status: 'completed',
          fileName: req.file.originalname,
          parsedCount: inserted.length,
          error: null,
        });
        // 解析完成后清理上传文件
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      })
      .catch((err) => {
        console.error(`[Questions] PDF解析失败 uploadId=${uploadId}:`, err.message, err.stack);
        setUploadStatus(uploadId, {
          status: 'failed',
          fileName: req.file.originalname,
          parsedCount: 0,
          error: err.message,
        });
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      });

    res.json({
      code: 200,
      data: {
        uploadId,
        fileName: req.file.originalname,
        status: 'processing',
        message: 'PDF上传成功，正在后台解析题目（标记为真题）...',
      },
    });
  } catch (err) {
    console.error('[Questions] 上传失败:', err);
    res.status(500).json({ code: 500, message: '上传失败: ' + err.message });
  }
});

// GET /api/questions/upload/:id/status - 查询上传处理状态
router.get('/upload/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const statusData = uploadStatusMap.get(id);

    if (!statusData) {
      // 状态不存在（可能已过期或已清理），假设已完成
      res.json({
        code: 200,
        data: { uploadId: id, status: 'unknown', parsedCount: 0, message: '状态已过期，请刷新题目列表' },
      });
      return;
    }

    res.json({
      code: 200,
      data: {
        uploadId: id,
        status: statusData.status,        // 'processing' | 'completed' | 'failed'
        parsedCount: statusData.parsedCount,
        fileName: statusData.fileName,
        error: statusData.error,
        message: statusData.status === 'completed'
          ? `解析完成！共 ${statusData.parsedCount} 道题目已入库`
          : statusData.status === 'failed'
            ? `解析失败: ${statusData.error}`
            : '正在解析中...',
        updatedAt: statusData.updatedAt,
      },
    });
  } catch (err) {
    console.error('[Questions] 查询状态失败:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

// GET /api/questions - 题目列表（支持按篇章聚合）
router.get('/', auth, async (req, res) => {
  try {
    const { subject, difficulty, type, source, page = 1, limit = 20, groupBy } = req.query;

    // === 篇章聚合模式 ===
    if (groupBy === 'passage') {
      let where = ['status = $1', 'passage_id IS NOT NULL'];
      let params = ['approved'];
      let paramIdx = 2;

      if (subject) {
        where.push(`subject = $${paramIdx++}`);
        params.push(subject);
      }
      if (source) {
        where.push(`source = $${paramIdx++}`);
        params.push(source);
      }

      const whereClause = where.join(' AND ');

      const result = await db.query(
        `SELECT
          passage_id AS "passageId",
          MAX(title) AS title,
          COUNT(*) AS "questionCount",
          ARRAY_AGG(DISTINCT type) AS types,
          MAX(difficulty) AS difficulty,
          MAX(source) AS source,
          MAX(created_at) AS "createdAt"
        FROM questions
        WHERE ${whereClause}
        GROUP BY passage_id
        ORDER BY MAX(created_at) DESC`,
        params
      );

      // 同时查出未归入 passage 的散题（兼容旧数据），但不返回
      // 这些会在前端兜底显示
      let orphans = [];
      try {
        const orphanResult = await db.query(
          `SELECT id, title, type, difficulty, source, created_at
           FROM questions WHERE status = 'approved' AND passage_id IS NULL
           AND subject = $1 AND source = $2
           ORDER BY created_at DESC`,
          [subject || 'reading', source || 'real']
        );
        orphans = orphanResult.rows;
      } catch (_) { /* 忽略散题查询失败 */ }

      res.json({
        code: 200,
        data: {
          list: result.rows,
          orphans,
          total: result.rows.length,
          page: 1,
          limit: 100,
        },
      });
      return;
    }

    // === 普通平铺模式 ===
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['status = $1'];
    let params = ['approved'];
    let paramIdx = 2;

    if (subject) {
      where.push(`subject = $${paramIdx++}`);
      params.push(subject);
    }
    if (difficulty) {
      where.push(`difficulty = $${paramIdx++}`);
      params.push(difficulty);
    }
    if (type) {
      where.push(`type = $${paramIdx++}`);
      params.push(type);
    }
    if (source) {
      where.push(`source = $${paramIdx++}`);
      params.push(source);
    }

    const whereClause = where.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM questions WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, subject, type, difficulty, title, source, created_at
      FROM questions WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 200,
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[Questions] 获取列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/questions/generate - AI模拟题生成
router.post('/generate', auth, async (req, res) => {
  try {
    const { subject = 'reading', count = 5, difficulty = 'medium' } = req.body;

    if (!['reading', 'listening', 'speaking', 'writing'].includes(subject)) {
      return res.status(400).json({ code: 400, message: '无效的科目' });
    }
    const genCount = Math.min(Math.max(1, parseInt(count) || 5), 10);

    let generatedQuestions = [];

    // Try OpenAI API first
    if (config.openaiApiKey) {
      try {
        generatedQuestions = await generateWithOpenAI(subject, genCount, difficulty);
      } catch (aiErr) {
        console.error('[Questions] OpenAI生成失败，降级到模板:', aiErr.message);
        generatedQuestions = generateWithTemplate(subject, genCount, difficulty);
      }
    } else {
      generatedQuestions = generateWithTemplate(subject, genCount, difficulty);
    }

    // Insert into database with passage_id for grouping
    const passageId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const inserted = [];
    for (let idx = 0; idx < generatedQuestions.length; idx++) {
      const q = generatedQuestions[idx];
      try {
        const result = await db.query(
          `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'simulated', 'approved', $10, $11)
           RETURNING id, title`,
          [subject, q.type, q.difficulty, q.title, q.content, JSON.stringify(q.options), q.answer, q.analysis || '', q.passage_text || '', passageId, idx + 1]
        );
        inserted.push({ id: result.rows[0].id, title: result.rows[0].title });
      } catch (err) {
        console.error(`[Questions] 插入模拟题失败 [${q.title}]:`, err.message);
      }
    }

    res.json({
      code: 200,
      data: { generated: inserted.length, questions: inserted },
    });
  } catch (err) {
    console.error('[Questions] 生成模拟题失败:', err);
    res.status(500).json({ code: 500, message: '生成失败: ' + err.message });
  }
});

/**
 * 使用 OpenAI API 生成模拟题
 */
async function generateWithOpenAI(subject, count, difficulty) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: config.openaiApiKey });

  const subjectNames = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' };
  const subjectName = subjectNames[subject] || subject;

  const prompt = `Generate ${count} TOEFL ${subjectName} practice questions with difficulty "${difficulty}".

Return ONLY a valid JSON array. Each object must have these fields:
- title: short descriptive title
- passage_text: a short academic passage (150-300 words) relevant to ${subjectName} section
- content: the question text
- options: array of 4 objects with "label" (A/B/C/D) and "text" (option text)
- answer: correct option label (A/B/C/D)
- analysis: brief explanation of why the answer is correct
- type: question type (for reading: detail/inference/vocabulary/summary/purpose; for listening: lecture/conversation; for speaking: independent/integrated; for writing: independent/integrated)
- difficulty: "${difficulty}"

Example format:
[
  {
    "title": "Climate Change Effects on Marine Life",
    "passage_text": "Rising ocean temperatures have...",
    "content": "According to the passage, what is the primary cause of coral bleaching?",
    "options": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, {"label": "C", "text": "..."}, {"label": "D", "text": "..."}],
    "answer": "B",
    "analysis": "The passage states that...",
    "type": "detail",
    "difficulty": "medium"
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  // Extract JSON from possible markdown code block
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('OpenAI 未返回有效的 JSON');

  const questions = JSON.parse(jsonMatch[0]);
  return questions;
}

/**
 * Fallback: 使用内置模板生成模拟题
 */
function generateWithTemplate(subject, count, difficulty) {
  const templates = {
    reading: [
      {
        title: 'AI模拟 - 人工智能与教育',
        type: 'detail',
        passage_text: 'Artificial intelligence is rapidly transforming the education sector. AI-powered tutoring systems can now provide personalized instruction to students, adapting to their individual learning pace and style. These systems analyze student performance data in real-time, identifying knowledge gaps and recommending targeted exercises. Research conducted at Stanford University found that students using AI tutoring systems improved their test scores by an average of 12% compared to traditional classroom instruction alone. However, critics argue that over-reliance on AI may reduce human interaction, which is essential for developing social and emotional skills.',
        content: 'According to the passage, what improvement did Stanford research find in students using AI tutoring?',
        options: [
          { label: 'A', text: 'Test scores improved by an average of 12%' },
          { label: 'B', text: 'Students completed courses 20% faster' },
          { label: 'C', text: 'Classroom attendance increased by 50%' },
          { label: 'D', text: 'Students reported higher satisfaction with teachers' }
        ],
        answer: 'A',
        analysis: '文章明确提到斯坦福大学研究发现使用AI辅导系统的学生考试成绩平均提高12%。',
      },
      {
        title: 'AI模拟 - 海洋微塑料污染',
        type: 'inference',
        passage_text: 'Microplastics—tiny plastic particles less than 5mm in diameter—have been detected in every major ocean basin on Earth. These particles originate from the breakdown of larger plastic items and from microbeads used in personal care products. Marine organisms from plankton to whales ingest these particles, leading to physical damage of digestive systems and the potential transfer of toxic chemicals up the food chain. A 2023 study estimated that the average person consumes approximately 5 grams of microplastics per week through seafood, equivalent to eating a credit card.',
        content: 'What can be inferred about the impact of microplastics on human health?',
        options: [
          { label: 'A', text: 'Microplastics have been proven to cause cancer in humans' },
          { label: 'B', text: 'The chemicals associated with microplastics may pose health risks through the food chain' },
          { label: 'C', text: 'Humans are immune to the effects of microplastics' },
          { label: 'D', text: 'Only marine animals are affected by microplastic pollution' }
        ],
        answer: 'B',
        analysis: '文章提到微塑料含有的有毒化学物质可能通过食物链传递，暗示对人体健康的潜在风险。',
      },
      {
        title: 'AI模拟 - 古罗马建筑技术',
        type: 'vocabulary',
        passage_text: 'The architectural achievements of ancient Rome were unprecedented in scale and durability. Roman concrete, or opus caementicium, was a revolutionary material that enabled the construction of massive structures like the Pantheon and the Colosseum. Unlike modern concrete, which degrades within decades, Roman concrete actually grows stronger over time due to a unique chemical reaction between volcanic ash and seawater.',
        content: 'The word "unprecedented" in the passage is closest in meaning to:',
        options: [
          { label: 'A', text: 'predictable' },
          { label: 'B', text: 'never before achieved' },
          { label: 'C', text: 'temporary' },
          { label: 'D', text: 'controversial' }
        ],
        answer: 'B',
        analysis: '"Unprecedented"意为史无前例的，与"never before achieved"含义最接近。',
      },
      {
        title: 'AI模拟 - 睡眠与记忆巩固',
        type: 'purpose',
        passage_text: 'Recent neuroscientific research has revealed the crucial role of sleep in memory consolidation. During slow-wave sleep, the hippocampus replays the day experiences, transferring important information to the neocortex for long-term storage. Dr. Wilson and colleagues demonstrated that rats who were allowed to sleep after learning a maze task showed significantly better performance the following day compared to sleep-deprived rats. Furthermore, the researchers observed that the same neural patterns activated during learning were reactivated during sleep, suggesting a direct mechanism for memory strengthening.',
        content: 'Why does the author mention the rat experiment in the passage?',
        options: [
          { label: 'A', text: 'To argue that animal research should be discontinued' },
          { label: 'B', text: 'To provide empirical evidence supporting the role of sleep in memory' },
          { label: 'C', text: 'To compare rat intelligence with human intelligence' },
          { label: 'D', text: 'To suggest that maze learning is the only type of memory affected by sleep' }
        ],
        answer: 'B',
        analysis: '作者引用老鼠实验是为了用实证证据支持睡眠在记忆中作用的观点。',
      },
      {
        title: 'AI模拟 - 城市热岛效应',
        type: 'summary',
        passage_text: 'Urban heat island (UHI) effect refers to the phenomenon where cities experience significantly higher temperatures than surrounding rural areas. This occurs due to several factors: the replacement of natural vegetation with heat-absorbing materials like asphalt and concrete, waste heat from air conditioning and vehicles, and the geometric structure of tall buildings that trap heat. Studies show that UHI can raise urban temperatures by 2-5°C, leading to increased energy consumption for cooling, elevated air pollution levels, and higher rates of heat-related illnesses. Mitigation strategies include planting urban forests, installing green roofs, and using reflective building materials.',
        content: 'Which of the following best summarizes the passage?',
        options: [
          { label: 'A', text: 'Cities are hotter than rural areas due to heat-absorbing materials, waste heat, and building geometry, but solutions like green roofs can help mitigate this effect' },
          { label: 'B', text: 'Urban areas should be abandoned because they are too hot for human habitation' },
          { label: 'C', text: 'Air conditioning is the only effective way to deal with urban heat islands' },
          { label: 'D', text: 'The urban heat island effect only affects cities in tropical regions' }
        ],
        answer: 'A',
        analysis: '文章全面描述了城市热岛效应的原因、影响和缓解策略，选项A最完整地概括了全文内容。',
      }
    ],
    listening: [
      {
        title: 'AI模拟 - Lecture: 蜜蜂交流舞',
        type: 'lecture',
        passage_text: "Professor: Today we're going to explore one of the most fascinating examples of animal communication—the honeybee waggle dance. Discovered by Austrian ethologist Karl von Frisch in the 1940s, this dance is how foraging bees communicate the location of food sources to their hive mates. The bee performs a figure-eight pattern, and the angle of the central 'waggle run' relative to the vertical indicates the direction of the food relative to the sun. The duration of the waggle phase communicates distance—the longer the waggle, the farther the food. This system is remarkably precise, allowing bees to locate flowers up to 10 kilometers away.",
        content: 'What does the duration of the waggle phase in the bee dance communicate?',
        options: [
          { label: 'A', text: 'The quality of the food source' },
          { label: 'B', text: 'The distance to the food source' },
          { label: 'C', text: 'The type of flower discovered' },
          { label: 'D', text: 'The number of other bees needed' }
        ],
        answer: 'B',
        analysis: '教授明确说明摇摆阶段的持续时间表示食物源的距离。',
      },
      {
        title: 'AI模拟 - Conversation: 图书馆借阅',
        type: 'conversation',
        passage_text: "Student: Hi, I'm trying to find a copy of 'Principles of Ecology' for my biology seminar. The online catalog shows it's available, but I couldn't find it on the shelf. Librarian: Let me check. Ah, I see—that book has been moved to the course reserve section for Professor Chen's class. You can still access it, but the loan period is only 2 hours instead of the usual 2 weeks. Student: Two hours? That's barely enough time to read one chapter. Librarian: I understand. But you can renew it if no one else is waiting. Also, there's a digital copy available through our e-book platform that you can access 24/7 with your student ID.",
        content: 'Why is the book only available for a 2-hour loan?',
        options: [
          { label: 'A', text: 'It is a rare and valuable edition' },
          { label: 'B', text: 'It has been placed on course reserve for a class' },
          { label: 'C', text: 'The book is damaged and needs repair' },
          { label: 'D', text: 'Another student has already reserved it' }
        ],
        answer: 'B',
        analysis: '图书馆员解释该书已移至课程保留区供陈教授的课程使用，因此借阅期限缩短为2小时。',
      },
    ],
    speaking: [
      {
        title: 'AI模拟 - Independent: Favorite Transportation',
        type: 'independent',
        passage_text: '',
        content: 'What is your preferred method of transportation? Describe it and explain why you prefer it. Include specific reasons and examples.',
        options: [],
        answer: JSON.stringify({
          structure: 'State preference + 2 reasons + personal example',
          sample: 'My preferred method of transportation is biking. First, it is environmentally friendly—no carbon emissions. Second, it keeps me physically fit. For example, I bike to school every day, which takes about 20 minutes and saves me money on bus fares while providing excellent exercise.'
        }),
        analysis: '独立口语题，准备15秒回答45秒。重点是清晰陈述偏好和理由。',
      },
      {
        title: 'AI模拟 - Integrated: Campus Parking Policy',
        type: 'integrated',
        passage_text: 'Read: The university has proposed eliminating free student parking in the main campus lot, replacing it with a paid permit system costing $150 per semester. The proposal argues this will reduce overcrowding and encourage alternative transportation.',
        content: 'The university is considering changing the campus parking policy. Read the proposal summary, then summarize the key points and present balanced arguments for and against the change.',
        options: [],
        answer: JSON.stringify({
          reading_summary: 'University proposes paid parking ($150/semester) to reduce overcrowding and encourage alternatives.',
          for_points: ['Reduce congestion', 'Generate revenue for campus improvements', 'Environmental benefits'],
          against_points: ['Financial burden on commuting students', 'Limited public transit options', 'May disadvantage students with disabilities']
        }),
        analysis: '综合口语题：概括阅读内容，呈现支持和反对两方面的论点。',
      },
    ],
    writing: [
      {
        title: 'AI模拟 - Independent: Technology and Relationships',
        type: 'independent',
        passage_text: '',
        content: 'Do you agree or disagree with the following statement?\n\nModern technology has strengthened rather than weakened human relationships.\n\nUse specific reasons and examples to support your answer. (Minimum 300 words)',
        options: [],
        answer: JSON.stringify({
          rubric: ['Clear thesis statement', '2-3 body paragraphs with specific examples', 'Address counter-argument', 'Strong conclusion'],
          sample_thesis: 'I agree that modern technology has strengthened human relationships by enabling instant communication across distances, facilitating shared experiences, and helping people maintain connections that would otherwise fade.'
        }),
        analysis: '独立写作题：明确立场，充分展开论证，字数300+。',
      },
      {
        title: 'AI模拟 - Integrated: Remote Work Debate',
        type: 'integrated',
        passage_text: 'Reading passage (summary): Companies should adopt permanent remote work policies because it increases employee productivity, reduces operational costs, and improves work-life balance.',
        content: 'Read the passage about remote work benefits, then listen to a lecture presenting counter-arguments. Write a response summarizing the lecture and explaining how it challenges specific points in the reading.',
        options: [],
        answer: JSON.stringify({
          reading_claims: ['Remote work increases productivity', 'Reduces operational costs', 'Improves work-life balance'],
          lecture_counterpoints: ['Productivity gains diminish over time due to isolation', 'Hidden costs: cybersecurity, home office stipends', 'Blurred boundaries lead to burnout'],
          essay_structure: 'Introduction + 3 body paragraphs (one per counterpoint) + Conclusion'
        }),
        analysis: '综合写作：逐点回应阅读材料的主张，保持客观语气。',
      },
    ]
  };

  const subjectTemplates = templates[subject] || templates.reading;
  const result = [];

  // Map difficulty to selection weights
  const difficultyWeights = {
    easy: { easy: 3, medium: 2, hard: 1 },
    medium: { easy: 1, medium: 3, hard: 2 },
    hard: { easy: 1, medium: 2, hard: 3 },
  };

  for (let i = 0; i < count; i++) {
    // Cycle through templates with difficulty adjustment
    const idx = i % subjectTemplates.length;
    const q = { ...subjectTemplates[idx] };

    // Add index suffix to avoid duplicate titles
    q.title = `${q.title} #${Date.now().toString(36)}-${i}`;
    q.difficulty = difficulty;
    q.passage_text = q.passage_text || '';

    result.push(q);
  }

  return result;
}

// GET /api/questions/passage/:passageId - 篇章详情（含全部题目）
router.get('/passage/:passageId', auth, async (req, res) => {
  try {
    const { passageId } = req.params;

    const result = await db.query(
      `SELECT id, subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, audio_url, question_order
       FROM questions
       WHERE passage_id = $1 AND status = 'approved'
       ORDER BY question_order ASC, id ASC`,
      [passageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '该篇章不存在或无题目' });
    }

    const first = result.rows[0];
    res.json({
      code: 200,
      data: {
        passageId,
        title: first.title,
        passageText: first.passage_text || '',
        source: first.source,
        difficulty: first.difficulty,
        questions: result.rows.map(r => ({
          id: r.id,
          order: r.question_order,
          type: r.type,
          content: r.content,
          options: r.options,
          answer: r.answer,
          analysis: r.analysis,
        })),
      },
    });
  } catch (err) {
    console.error('[Questions] 获取篇章详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/questions/:id - 题目详情（仅当id为数字时）
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ code: 400, message: '无效的题目ID' });
    }

    const question = (await db.query(
      'SELECT * FROM questions WHERE id = $1 AND status = $2',
      [parseInt(id), 'approved']
    )).rows[0];

    if (!question) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    res.json({
      code: 200,
      data: {
        id: question.id,
        subject: question.subject,
        type: question.type,
        difficulty: question.difficulty,
        title: question.title,
        content: question.content,
        options: question.options,
        answer: question.answer,
        analysis: question.analysis,
        passageText: question.passage_text,
        source: question.source,
        audioUrl: question.audio_url,
      },
    });
  } catch (err) {
    console.error('[Questions] 获取详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/questions/seed-defaults - 导入默认题库（无需PDF）
router.post('/seed-defaults', auth, async (req, res) => {
  try {
    const { seedDefaults } = require('../data/seed-defaults');
    const count = await seedDefaults();
    res.json({ code: 200, data: { inserted: count, message: `默认题库导入完成，共 ${count} 题` } });
  } catch (err) {
    console.error('[Seed] 导入默认题库失败:', err);
    res.status(500).json({ code: 500, message: '导入失败: ' + err.message });
  }
});

module.exports = router;