const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保阅读速度记录表存在
db.query(`CREATE TABLE IF NOT EXISTS reading_speed_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  word_count INTEGER,
  duration_seconds INTEGER,
  wpm INTEGER,
  comprehension_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/reading-speed/passage - 获取阅读文章
router.get('/passage', auth, async (req, res) => {
  try {
    const passages = [
      {
        id: 1,
        title: 'The Impact of Urbanization on Wildlife',
        content: `Urbanization has profoundly affected wildlife populations around the world. As cities expand, natural habitats are fragmented or destroyed, forcing many species to adapt or perish. Research shows that urban areas can support certain adaptable species while causing significant declines in others.

Bird species such as pigeons and sparrows have thrived in urban environments, while specialized species like forest owls and ground-nesting birds have disappeared from city areas. Mammals show mixed responses - raccoons and foxes have adapted well to urban life, while larger predators have largely vanished.

The phenomenon known as "biotic homogenization" occurs when urbanization causes different cities worldwide to develop similar species compositions. This reduces global biodiversity and makes ecosystems more vulnerable to diseases and environmental changes.

However, some urban planning strategies can mitigate these effects. Green corridors, rooftop gardens, and wildlife-friendly building designs can help maintain biodiversity in urban areas. Cities like Singapore and Curitiba have demonstrated that urban development and wildlife conservation can coexist.`,
        wordCount: 180,
        difficulty: 'medium',
      },
      {
        id: 2,
        title: 'Climate Change and Ocean Currents',
        content: `Ocean currents play a crucial role in regulating Earth's climate system. These massive conveyor belts of water distribute heat around the planet, influencing weather patterns and supporting marine ecosystems. However, climate change is disrupting these critical current systems.

As global temperatures rise, melting ice sheets and glaciers add fresh water to the oceans. This influx of fresh water can weaken major current systems like the Atlantic Meridional Overturning Circulation (AMOC). A weakened AMOC could lead to cooler temperatures in Europe and altered rainfall patterns globally.

Scientists have observed changes in current patterns over the past century. Some regions show signs of current slowdowns, while others exhibit unexpected accelerations. These changes have significant implications for marine life, coastal communities, and global weather patterns.

Understanding and monitoring ocean currents is essential for predicting future climate scenarios. Advanced satellite technology and ocean sensors provide critical data that helps scientists track these changes and improve climate models.`,
        wordCount: 185,
        difficulty: 'hard',
      },
    ];

    res.json({
      code: 200,
      data: { passages },
    });
  } catch (err) {
    console.error('[ReadingSpeed] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/reading-speed/submit - 提交阅读结果
router.post('/submit', auth, async (req, res) => {
  try {
    const { passageId, wordCount, durationSeconds, comprehensionScore } = req.body;
    
    if (!wordCount || !durationSeconds) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    const wpm = Math.round((wordCount / durationSeconds) * 60);

    await db.query(
      `INSERT INTO reading_speed_records (user_id, passage_id, word_count, duration_seconds, wpm, comprehension_score)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, passageId, wordCount, durationSeconds, wpm, comprehensionScore]
    );

    res.json({
      code: 200,
      data: {
        wpm,
        level: getWPMLevel(wpm),
        suggestion: generateWPMAdvice(wpm),
      },
    });
  } catch (err) {
    console.error('[ReadingSpeed] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/reading-speed/stats - 获取统计
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT AVG(wpm) as avg_wpm,
              MAX(wpm) as max_wpm,
              COUNT(*) as total_sessions
       FROM reading_speed_records
       WHERE user_id = $1`,
      [req.user.id]
    );

    const trend = await db.query(
      `SELECT wpm, created_at
       FROM reading_speed_records
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        summary: stats.rows[0],
        trend: trend.rows.reverse(),
      },
    });
  } catch (err) {
    console.error('[ReadingSpeed] Stats Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Get WPM level
function getWPMLevel(wpm) {
  if (wpm >= 400) return 'Expert';
  if (wpm >= 300) return 'Advanced';
  if (wpm >= 200) return 'Intermediate';
  if (wpm >= 150) return 'Beginner';
  return 'Novice';
}

// Helper: Generate advice
function generateWPMAdvice(wpm) {
  if (wpm >= 400) return '优秀！你的阅读速度已经达到专家水平。';
  if (wpm >= 300) return '很好！继续保持，可以尝试更难的材料。';
  if (wpm >= 200) return '不错！建议多读学术文章提高速度。';
  if (wpm >= 150) return '中等水平，建议每天练习 15 分钟。';
  return '建议从简单材料开始，逐步提高阅读速度。';
}

module.exports = router;
