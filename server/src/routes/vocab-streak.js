const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// 确保单词书相关表存在
db.query(`CREATE TABLE IF NOT EXISTS vocab_books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  word_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

db.query(`CREATE TABLE IF NOT EXISTS vocab_book_words (
  id SERIAL PRIMARY KEY,
  vocab_book_id INTEGER REFERENCES vocab_books(id),
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  definition TEXT,
  example TEXT,
  mastery_level INTEGER DEFAULT 0
)`).catch(() => {});

db.query(`CREATE TABLE IF NOT EXISTS vocab_study_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  vocab_book_id INTEGER REFERENCES vocab_books(id),
  words_learned INTEGER DEFAULT 0,
  words_reviewed INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// 确保签到表存在
db.query(`CREATE TABLE IF NOT EXISTS daily_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  checkin_date DATE NOT NULL UNIQUE,
  streak INTEGER NOT NULL DEFAULT 1,
  words_learned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)`).catch(() => {});

// GET /api/vocab-streak/books - 获取单词书列表
router.get('/books', auth, async (req, res) => {
  try {
    const books = await db.query(
      `SELECT id, name, description, word_count, is_public, created_at
       FROM vocab_books
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: { books: books.rows },
    });
  } catch (err) {
    console.error('[VocabStreak] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-streak/books - 创建单词书
router.post('/books', auth, async (req, res) => {
  try {
    const { name, description, words } = req.body;
    
    const result = await db.query(
      'INSERT INTO vocab_books (user_id, name, description, word_count) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, description, words?.length || 0]
    );

    const book = result.rows[0];

    if (words && words.length > 0) {
      const values = words.map((w, i) => 
        `($1, $2, $3, $4, $5, $6, $7)`
      ).join(', ');
      
      const params = [book.id, words.map(w => w.word)];
      
      await db.query(
        `INSERT INTO vocab_book_words (vocab_book_id, word, phonetic, definition, example, mastery_level)
         VALUES ${values}`,
        params
      );
    }

    res.json({ code: 200, data: { book } });
  } catch (err) {
    console.error('[VocabStreak] Create Book Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/vocab-streak/book/:id/words - 获取单词书单词
router.get('/book/:id/words', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const words = await db.query(
      `SELECT id, word, phonetic, definition, example, mastery_level
       FROM vocab_book_words
       WHERE vocab_book_id = $1
       ORDER BY id`,
      [id]
    );

    res.json({
      code: 200,
      data: { words: words.rows },
    });
  } catch (err) {
    console.error('[VocabStreak] Words Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-streak/study - 学习单词
router.post('/study', auth, async (req, res) => {
  try {
    const { vocabBookId, wordsLearned, wordsReviewed, accuracy, durationSeconds, wordIds } = req.body;

    const result = await db.query(
      `INSERT INTO vocab_study_sessions (user_id, vocab_book_id, words_learned, words_reviewed, accuracy, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, vocabBookId, wordsLearned, wordsReviewed, accuracy, durationSeconds]
    );

    // 更新单词掌握程度
    if (wordIds) {
      for (const wi of wordIds) {
        await db.query(
          `UPDATE vocab_book_words SET mastery_level = LEAST(5, mastery_level + 1) WHERE id = $1`,
          [wi.id]
        );
      }
    }

    res.json({ code: 200, data: { session: result.rows[0] } });
  } catch (err) {
    console.error('[VocabStreak] Study Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-streak/checkin - 每日签到
router.post('/checkin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await db.query(
      'SELECT id, streak FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2',
      [req.user.id, today]
    );

    if (existing.rows.length > 0) {
      return res.json({ code: 200, data: { alreadyCheckedIn: true, streak: existing.rows[0].streak } });
    }

    // 检查昨天是否有签到
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const prev = await db.query(
      'SELECT streak FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2',
      [req.user.id, yesterday]
    );

    const newStreak = prev.rows.length > 0 ? prev.rows[0].streak + 1 : 1;

    const result = await db.query(
      `INSERT INTO daily_checkins (user_id, checkin_date, streak, words_learned)
       VALUES ($1, $2, $3, 0) RETURNING *`,
      [req.user.id, today, newStreak]
    );

    res.json({
      code: 200,
      data: {
        checkin: result.rows[0],
        streak: newStreak,
        isStreakNew: true,
      },
    });
  } catch (err) {
    console.error('[VocabStreak] Checkin Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/vocab-streak/stats - 获取统计
router.get('/stats', auth, async (req, res) => {
  try {
    const sessions = await db.query(
      `SELECT AVG(accuracy) as avg_accuracy,
              SUM(words_learned) as total_learned,
              SUM(words_reviewed) as total_reviewed,
              COUNT(*) as total_sessions,
              SUM(duration_seconds) as total_seconds
       FROM vocab_study_sessions
       WHERE user_id = $1`,
      [req.user.id]
    );

    const checkins = await db.query(
      `SELECT MAX(streak) as max_streak,
              COUNT(*) as total_checkins
       FROM daily_checkins
       WHERE user_id = $1`,
      [req.user.id]
    );

    const recent = await db.query(
      `SELECT d.checkin_date, d.streak, d.words_learned, s.words_learned as session_words
       FROM daily_checkins d
       LEFT JOIN vocab_study_sessions s ON d.id = s.id
       WHERE d.user_id = $1
       ORDER BY d.checkin_date DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: {
        summary: {
          ...sessions.rows[0],
          totalCheckins: checkins.rows[0].total_checkins,
          maxStreak: checkins.rows[0].max_streak,
        },
        recentCheckins: recent.rows,
      },
    });
  } catch (err) {
    console.error('[VocabStreak] Stats Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
