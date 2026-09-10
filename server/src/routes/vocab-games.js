const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/vocab-games - 获取词汇游戏列表
router.get('/', auth, async (req, res) => {
  try {
    const games = [
      { id: 'matching', name: '词汇配对', icon: '🎯', description: '将单词与释义配对', difficulty: 'easy' },
      { id: 'test', name: '词汇测试', icon: '📝', description: '多项选择题测试', difficulty: 'medium' },
      { id: 'typing', name: '拼写挑战', icon: '⌨️', description: '根据释义拼写单词', difficulty: 'hard' },
    ];

    res.json({ code: 200, data: { games } });
  } catch (err) {
    console.error('[VocabGames] Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-games/matching - 词汇配对游戏
router.post('/matching', auth, async (req, res) => {
  try {
    const { wordCount = 10, category } = req.body;

    // 获取词汇
    const vocab = await db.query(
      'SELECT id, word, phonetic, meaning FROM vocab WHERE meaning IS NOT NULL ORDER BY RANDOM() LIMIT $1',
      [wordCount]
    );

    if (!vocab.rows.length) {
      return res.status(404).json({ code: 404, message: '暂无词汇数据' });
    }

    // 生成配对游戏数据
    const gameData = generateMatchingGame(vocab.rows);

    res.json({
      code: 200,
      data: gameData,
    });
  } catch (err) {
    console.error('[VocabGames] Matching Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-games/test - 词汇测试游戏
router.post('/test', auth, async (req, res) => {
  try {
    const { questionCount = 20, category } = req.body;

    // 获取测试词汇
    const vocab = await db.query(
      'SELECT id, word, phonetic, meaning FROM vocab ORDER BY RANDOM() LIMIT $1',
      [questionCount]
    );

    if (!vocab.rows.length) {
      return res.status(404).json({ code: 404, message: '暂无词汇数据' });
    }

    // 获取干扰词汇
    const distractors = await db.query(
      'SELECT word, meaning FROM vocab WHERE id != ALL ($1::int[]) ORDER BY RANDOM() LIMIT $2',
      [
        vocab.rows.map(v => v.id),
        questionCount * 3,
      ]
    );

    const testQuestions = generateTestQuestions(vocab.rows, distractors.rows);

    res.json({
      code: 200,
      data: { questions: testQuestions, total: testQuestions.length },
    });
  } catch (err) {
    console.error('[VocabGames] Test Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-games/typing - 拼写挑战
router.post('/typing', auth, async (req, res) => {
  try {
    const { wordCount = 15 } = req.body;

    const vocab = await db.query(
      'SELECT id, word, phonetic, meaning FROM vocab ORDER BY RANDOM() LIMIT $1',
      [wordCount]
    );

    if (!vocab.rows.length) {
      return res.status(404).json({ code: 404, message: '暂无词汇数据' });
    }

    const typingQuestions = vocab.rows.map(v => ({
      id: v.id,
      hint: v.meaning,
      phonetic: v.phonetic,
    }));

    res.json({
      code: 200,
      data: { questions: typingQuestions },
    });
  } catch (err) {
    console.error('[VocabGames] Typing Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/vocab-games/submit - 提交游戏结果
router.post('/submit', auth, async (req, res) => {
  try {
    const { gameId, score, total, correctCount, timeTaken } = req.body;

    await db.query(
      `INSERT INTO vocab_game_records (user_id, game_type, score, total, correct_count, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, gameId, score, total, correctCount, timeTaken]
    );

    res.json({ code: 200, message: '成绩已记录' });
  } catch (err) {
    console.error('[VocabGames] Submit Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// Helper: Generate matching game
function generateMatchingGame(vocabItems) {
  const words = vocabItems.map(v => ({ id: v.id, word: v.word, meaning: v.meaning }));
  const shuffledWords = [...words].sort(() => Math.random() - 0.5);
  const shuffledMeanings = [...words].sort(() => Math.random() - 0.5);

  return {
    words: shuffledWords.map(w => ({ id: w.id, text: w.word })),
    meanings: shuffledMeanings.map(m => ({ id: m.id, text: m.meaning })),
    correctMatches: words.map(w => ({ wordId: w.id, meaningId: w.id })),
  };
}

// Helper: Generate test questions
function generateTestQuestions(correctVocab, distractors) {
  return correctVocab.map(v => {
    const distractorWords = distractors
      .filter(d => d.id !== v.id)
      .slice(0, 3)
      .map(d => d.meaning);

    const options = [...distractorWords, v.meaning].sort(() => Math.random() - 0.5);

    return {
      questionId: v.id,
      question: `单词 "${v.word}" 的意思是？`,
      options,
      correctAnswer: v.meaning,
    };
  });
}

module.exports = router;
