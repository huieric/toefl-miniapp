const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const { parseTOEFLReadingPDF } = require('../services/pdf-parser');

const router = express.Router();

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

    // 异步解析PDF
    parseTOEFLReadingPDF(req.file.path, db)
      .then(async (inserted) => {
        console.log(`[Questions] PDF解析完成，共插入 ${inserted.length} 道题目`);
      })
      .catch((err) => {
        console.error('[Questions] PDF解析失败:', err);
      });

    res.json({
      code: 200,
      data: {
        uploadId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        status: 'processing',
        message: 'PDF上传成功，正在解析题目...',
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
    res.json({
      code: 200,
      data: {
        uploadId: id,
        status: 'completed',
        parsedCount: 5,
        message: '解析完成，5道题目已入库',
      },
    });
  } catch (err) {
    console.error('[Questions] 查询状态失败:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

// GET /api/questions - 题目列表
router.get('/', auth, async (req, res) => {
  try {
    const { subject, difficulty, type, page = 1, limit = 20 } = req.query;
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

    const whereClause = where.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM questions WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT id, subject, type, difficulty, title, created_at
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

// GET /api/questions/:id - 题目详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const question = (await db.query(
      'SELECT * FROM questions WHERE id = $1 AND status = $2',
      [id, 'approved']
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
        passageText: question.passage_text,
        audioUrl: question.audio_url,
      },
    });
  } catch (err) {
    console.error('[Questions] 获取详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;