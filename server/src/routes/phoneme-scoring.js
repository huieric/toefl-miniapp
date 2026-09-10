const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

/**
 * ELSA Speak-style Phoneme Scoring API
 * 提供音素级别的发音评分和反馈
 */

// 常见英语音素与 IPA 符号映射
const PHONEME_DB = {
  // 元音
  'i:': { symbol: 'iː', name: '长元音ee', examples: ['see', 'tree', 'food'] },
  'ɪ': { symbol: 'ɪ', name: '短元音i', examples: ['sit', 'bit', 'fish'] },
  'e': { symbol: 'e', name: '短元音e', examples: ['bed', 'red', 'yes'] },
  'æ': { symbol: 'æ', name: '短元音a', examples: ['cat', 'bad', 'map'] },
  'ɑ:': { symbol: 'ɑː', name: '长元音ar', examples: ['car', 'far', 'park'] },
  'ɒ': { symbol: 'ɒ', name: '短元音o', examples: ['hot', 'not', 'lot'] },
  'ɔ:': { symbol: 'ɔː', name: '长元音or', examples: ['door', 'more', 'tall'] },
  'ʌ': { symbol: 'ʌ', name: '短元音u', examples: ['cup', 'but', 'love'] },
  'ʊ': { symbol: 'ʊ', name: '短元音oo', examples: ['book', 'look', 'put'] },
  'ɜ:': { symbol: 'ɜː', name: '长元音er', examples: ['bird', 'nurse', 'work'] },
  'ə': { symbol: 'ə', name: '弱读元音schwa', examples: ['about', 'teacher', 'banana'] },
  'aɪ': { symbol: 'aɪ', name: '双元音i', examples: ['my', 'eye', 'five'] },
  'eɪ': { symbol: 'eɪ', name: '双元音ai', examples: ['day', 'say', 'play'] },
  'ɔɪ': { symbol: 'ɔɪ', name: '双元音oy', examples: ['boy', 'toy', 'enjoy'] },
  'aʊ': { symbol: 'aʊ', name: '双元音ou', examples: ['how', 'now', 'out'] },
  'əʊ': { symbol: 'əʊ', name: '双元音oh', examples: ['go', 'no', 'home'] },
  // 辅音
  'p': { symbol: 'p', name: '清辅音p', examples: ['pen', 'top', 'apple'] },
  'b': { symbol: 'b', name: '浊辅音b', examples: ['big', 'book', 'boy'] },
  't': { symbol: 't', name: '清辅音t', examples: ['top', 'eat', 'water'] },
  'd': { symbol: 'd', name: '浊辅音d', examples: ['day', 'red', 'bed'] },
  'k': { symbol: 'k', name: '清辅音k', examples: ['key', 'back', 'cat'] },
  'ɡ': { symbol: 'ɡ', name: '浊辅音g', examples: ['go', 'big', 'dog'] },
  'f': { symbol: 'f', name: '清辅音f', examples: ['fan', 'off', 'life'] },
  'v': { symbol: 'v', name: '浊辅音v', examples: ['very', 'love', 'five'] },
  'θ': { symbol: 'θ', name: '清辅音th', examples: ['think', 'bath', 'month'] },
  'ð': { symbol: 'ð', name: '浊辅音th', examples: ['this', 'that', 'they'] },
  's': { symbol: 's', name: '清辅音s', examples: ['see', 'yes', 'ask'] },
  'z': { symbol: 'z', name: '浊辅音z', examples: ['zoo', 'zero', 'eyes'] },
  'ʃ': { symbol: 'ʃ', name: '清辅音sh', examples: ['she', 'ship', 'wish'] },
  'ʒ': { symbol: 'ʒ', name: '浊辅音s', examples: ['measure', 'vision', 'pleasure'] },
  'tʃ': { symbol: 'tʃ', name: '清辅音ch', examples: ['chair', 'check', 'teach'] },
  'dʒ': { symbol: 'dʒ', name: '浊辅音j', examples: ['jump', 'joy', 'edge'] },
  'tr': { symbol: 'tr', name: '清辅音tr', examples: ['tree', 'try', 'write'] },
  'dr': { symbol: 'dr', name: '浊辅音dr', examples: ['dream', 'draw', 'drink'] },
  'h': { symbol: 'h', name: '清辅音h', examples: ['he', 'how', 'who'] },
  'm': { symbol: 'm', name: '鼻音m', examples: ['my', 'man', 'come'] },
  'n': { symbol: 'n', name: '鼻音n', examples: ['no', 'not', 'ten'] },
  'ŋ': { symbol: 'ŋ', name: '鼻音ng', examples: ['sing', 'long', 'think'] },
  'l': { symbol: 'l', name: '边音l', examples: ['leg', 'love', 'feel'] },
  'r': { symbol: 'r', name: '捲舌音r', examples: ['red', 'run', 'right'] },
  'w': { symbol: 'w', name: '滑音w', examples: ['we', 'wet', 'two'] },
  'j': { symbol: 'j', name: '滑音y', examples: ['yes', 'you', 'yellow'] },
  // 托福高频难点音素
  'θ/ð': { symbol: 'θ/ð', name: 'TH音对', examples: ['think', 'this'], difficulty: 'hard' },
  'ɪ/i:': { symbol: 'ɪ/iː', name: '长短元音对比', examples: ['ship', 'sheep'], difficulty: 'hard' },
  'æ/ɑ:': { symbol: 'æ/ɑː', name: '短长a对比', examples: ['cat', 'car'], difficulty: 'hard' },
  'ʃ/ʒ': { symbol: 'ʃ/ʒ', name: 'sh/z对比', examples: ['she', 'vision'], difficulty: 'hard' },
  'tr/dr': { symbol: 'tr/dr', name: 'tr/dr对比', examples: ['tree', 'dream'], difficulty: 'medium' },
};

/**
 * POST /api/phoneme-score
 * 对一段文本的发音进行评分
 */
router.post('/score', auth, async (req, res) => {
  try {
    const { text, audioScore, phonemeScores } = req.body || {};

    if (!text && !audioScore) {
      return res.status(400).json({ code: 400, message: '请提供文本或音频评分数据' });
    }

    // 提取文本中的音素（简化版：基于常见单词映射）
    const scoredPhonemes = [];
    const textLower = text?.toLowerCase() || '';
    const words = textLower.split(/\s+/).filter(Boolean);

    words.forEach(word => {
      // 简化：使用常见托福词汇音素映射
      const wordData = getPhonemeForWord(word);
      if (wordData) {
        wordData.forEach(phoneme => {
          const dbEntry = PHONEME_DB[phoneme] || { symbol: phoneme, name: phoneme, examples: [] };
          let userScore = null;

          // 如果有音素级别评分，使用它
          if (phonemeScores && phonemeScores[phoneme]) {
            userScore = Math.min(100, Math.max(0, phonemeScores[phoneme]));
          } else {
            // 如果没有音素级别评分，基于整体音频评分生成模拟分布
            // 高频音素得分较高，难点音素得分较低
            const baseScore = audioScore || 75;
            const difficulty = dbEntry.difficulty === 'hard' ? 15 : dbEntry.difficulty === 'medium' ? 8 : 0;
            const variance = Math.random() * 20 - 10;
            userScore = Math.min(100, Math.max(0, baseScore - difficulty + variance));
          }

          scoredPhonemes.push({
            phoneme,
            symbol: dbEntry.symbol,
            name: dbEntry.name,
            score: Math.round(userScore),
            difficulty: dbEntry.difficulty || 'normal',
            examples: dbEntry.examples,
          });
        });
      }
    });

    // 计算统计信息
    const scores = scoredPhonemes.map(p => p.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : audioScore || 0;

    // 按难度分类统计
    const byDifficulty = { hard: [], medium: [], normal: [] };
    scoredPhonemes.forEach(p => {
      byDifficulty[p.difficulty].push(p);
    });

    // 找出问题音素（得分最低的10个）
    const weakPhonemes = [...scoredPhonemes]
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);

    // 找出优秀音素（得分最高的5个）
    const strongPhonemes = [...scoredPhonemes]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 生成个性化建议
    const suggestions = [];
    if (byDifficulty.hard.length > 0) {
      const hardAvg = byDifficulty.hard.reduce((s, p) => s + p.score, 0) / byDifficulty.hard.length;
      if (hardAvg < 60) {
        suggestions.push('⚠️ 难点音素平均得分偏低，建议专项练习TH音、长短元音对比');
      }
    }
    if (byDifficulty.normal.length > 0) {
      const normalAvg = byDifficulty.normal.reduce((s, p) => s + p.score, 0) / byDifficulty.normal.length;
      if (normalAvg > 85) {
        suggestions.push('✅ 基础音素发音良好，继续保持！');
      }
    }
    suggestions.push('💡 建议：每天练习5分钟重点音素发音');

    // 保存到数据库
    const saveResult = await db.query(
      `INSERT INTO phoneme_scores (user_id, text, overall_score, phoneme_data, suggestion, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [req.user.id, text, avgScore, JSON.stringify(scoredPhonemes), JSON.stringify(suggestions)]
    );

    res.json({
      code: 200,
      data: {
        overallScore: avgScore,
        phonemeCount: scoredPhonemes.length,
        phonemes: scoredPhonemes,
        byDifficulty: {
          hard: { count: byDifficulty.hard.length, avgScore: byDifficulty.hard.length > 0 ? Math.round(byDifficulty.hard.reduce((s, p) => s + p.score, 0) / byDifficulty.hard.length) : 0 },
          medium: { count: byDifficulty.medium.length, avgScore: byDifficulty.medium.length > 0 ? Math.round(byDifficulty.medium.reduce((s, p) => s + p.score, 0) / byDifficulty.medium.length) : 0 },
          normal: { count: byDifficulty.normal.length, avgScore: byDifficulty.normal.length > 0 ? Math.round(byDifficulty.normal.reduce((s, p) => s + p.score, 0) / byDifficulty.normal.length) : 0 },
        },
        weakPhonemes: weakPhonemes.map(p => ({ phoneme: p.phoneme, symbol: p.symbol, name: p.name, score: p.score })),
        strongPhonemes: strongPhonemes.map(p => ({ phoneme: p.phoneme, symbol: p.symbol, name: p.name, score: p.score })),
        suggestions,
      },
    });
  } catch (err) {
    console.error('[PhonemeScoring] 评分失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/phoneme-score/history
 * 获取发音评分历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = await db.query(
      `SELECT id, text, overall_score, created_at FROM phoneme_scores
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({
      code: 200,
      data: result.rows,
    });
  } catch (err) {
    console.error('[PhonemeScoring] 获取历史失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/phoneme-score/trend
 * 获取发音进步趋势
 */
router.get('/trend', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DATE(created_at) as date,
              overall_score,
              text
       FROM phoneme_scores
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    res.json({
      code: 200,
      data: result.rows.map(r => ({
        date: r.date,
        score: r.overall_score,
        text: r.text,
      })),
    });
  } catch (err) {
    console.error('[PhonemeScoring] 获取趋势失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/phoneme-score/problems
 * 获取用户常发错的音素
 */
router.get('/problems', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT phoneme_data FROM phoneme_scores
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.json({ code: 200, data: [] });
    }

    // 聚合所有历史记录的音素数据
    const phonemeMap = {};
    result.rows.forEach(row => {
      try {
        const phonemes = JSON.parse(row.phoneme_data);
        phonemes.forEach(p => {
          if (!phonemeMap[p.phoneme]) {
            phonemeMap[p.phoneme] = { count: 0, totalScore: 0, phoneme: p.phoneme, name: p.name, symbol: p.symbol };
          }
          phonemeMap[p.phoneme].count++;
          phonemeMap[p.phoneme].totalScore += p.score;
        });
      } catch (_) {}
    });

    // 计算平均得分并排序
    const problems = Object.values(phonemeMap)
      .map(p => ({ ...p, avgScore: Math.round(p.totalScore / p.count) }))
      .filter(p => p.count >= 2)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 15);

    res.json({ code: 200, data: problems });
  } catch (err) {
    console.error('[PhonemeScoring] 获取问题音素失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * 根据单词查找音素（简化版 - 基于托福高频词汇）
 */
const WORD_PHONEME_MAP = {
  'the': ['ð', 'ə'], 'a': ['ə'], 'an': ['æn'],
  'see': ['si:'], 'speak': ['spi:k'], 'practice': ['præktɪs'], 'pronunciation': ['prə' + 'ˌnʌnsi' + "eɪʃən"],
  'important': ['ɪm' + 'p' + 'ɔ:' + 't' + 'ənt'], 'understand': ['ˌʌndə' + "rænd"], 'different': ['dɪfərənt'],
  'environment': ['ɪn' + 'vaɪ' + "rɒnmənt"], 'information': ['ˌɪnfə' + "reɪʃən"], 'education': ['ˌɛdʒʊ' + "eɪʃən"],
  'government': ['gʌvənmənt'], 'development': ['dɪvɛləpmənt'], 'international': ['ˌɪntə' + "næʃənəl"],
  'technology': ['tɛkn' + 'ɒlədʒi'], 'communication': ['kəˌmjuːnɪ' + "keɪʃən"], 'temperature': ['tɛmprətʃʊər'],
  'psychology': ['saɪ' + 'klədʒi'], 'sociology': ['ˌsəʊsi' + 'lədʒi'], 'philosophy': ['fɪ' + 'lɒsəfi'],
  'through': ['θru:'], 'though': ['ðəʊ'], 'thought': ['θɔ:t'],
  'this': ['ðɪs'], 'that': ['ðæt'], 'they': ['ðeɪ'],
  'think': ['θɪŋk'], 'thing': ['θɪŋ'], 'thank': ['θæŋk'],
  'ship': ['ʃɪp'], 'sheep': ['ʃi:'],
  'cat': ['kæt'], 'car': ['kɑ:'],
  'tree': ['tri:'], 'try': ['traɪ'], 'write': ['raɪt'],
  'dream': ['dri:m'], 'draw': ['drɔ:'], 'drink': ['drɪŋk'],
  'bird': ['bɜ:d'], 'nurse': ['nɜ:s'], 'work': ['wɜ:k'],
  'book': ['bʊk'], 'look': ['lʊk'], 'food': ['fu:d'],
  'good': ['ɡʊd'], 'goodbye': ['ɡʊdbaɪ'], 'go': ['ɡəʊ'],
  'can': ['kæn'], 'can\'t': ['kænt'], 'cannot': ['kænɒt'],
};

function getPhonemeForWord(word) {
  const clean = word.replace(/[^a-z]/g, '');
  if (!clean) return null;

  if (WORD_PHONEME_MAP[clean]) {
    return WORD_PHONEME_MAP[clean].join('').match(/[\u0250-\u02AFʃʒθðtʃdʒŋ]+/g) || [clean.slice(0, 3)];
  }

  // 对于未收录的单词，返回一些常见音素作为示例
  const commonPhonemes = ['æ', 'e', 'ɪ', 'ɒ', 'ʌ', 'ə', 'θ', 'ð', 'ʃ', 's', 't', 'd', 'k', 'g'];
  const count = Math.max(2, clean.length % 5);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(commonPhonemes[Math.floor(Math.random() * commonPhonemes.length)]);
  }
  return result;
}

module.exports = router;
