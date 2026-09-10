const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { initDatabase } = require('./config/db');

// 路由引入
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const questionsRoutes = require('./routes/questions');
const practiceRoutes = require('./routes/practice');
const examRoutes = require('./routes/exam');
const wrongRoutes = require('./routes/wrong');
const aiTalkRoutes = require('./routes/ai-talk');
const planRoutes = require('./routes/plan');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const membershipRoutes = require('./routes/membership');
const adsRoutes = require('./routes/ads');
const aiTutorRoutes = require('./routes/ai-tutor');
const aiSpeakRoutes = require('./routes/ai-speak');
const aiConversationRoutes = require('./routes/ai-conversation');
const reviewRoutes = require('./routes/review');
const vocabRoutes = require('./routes/vocab');
const aiRoutes = require('./routes/ai');
const aiAnnotateRoutes = require('./routes/ai-annotate');
const analysisRoutes = require('./routes/analysis');
const ttsRoutes = require('./routes/tts');
const achievementRoutes = require('./routes/achievements');

// 确保 uploads 目录存在（multer 写文件的前提）
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`[TOEFL-Server] 创建目录: ${uploadsDir}`);
}

const app = express();

// Render 反向代理会注入 X-Forwarded-For，信任代理以让 express-rate-limit 正确识别客户端 IP
app.set('trust proxy', 1);

const startupState = {
  database: 'pending',
  databaseError: null,
  startedAt: new Date().toISOString(),
};

// === 安全中间件 ===
// 纯 http 部署（无 TLS）：禁用 CSP，避免其默认的 upgrade-insecure-requests
// 让浏览器把 /assets 等子资源升级成 https 导致 ERR_SSL_PROTOCOL_ERROR 白屏
app.use(helmet({ contentSecurityPolicy: false }));

// === CORS ===
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// === 日志 ===
app.use(morgan('short'));

// === Body 解析 ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === 限流 ===
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
});
app.use('/api', globalLimiter);

// === API 路由 ===
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/wrong', wrongRoutes);
app.use('/api/ai-talk', aiTalkRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', aiAnnotateRoutes);
app.use('/api/ai-speak', aiSpeakRoutes);
app.use('/api/ai-conversation', aiConversationRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/daily-challenge', require('./routes/daily-challenge'));
app.use('/api/achievements', achievementRoutes);
app.use('/api/focus-timer', require('./routes/focus-timer'));
app.use('/api/skill-mastery', require('./routes/skill-mastery'));
app.use('/api/streak-freeze', require('./routes/streak-freeze'));
app.use('/api/quiz-reaction', require('./routes/quiz-reaction'));
app.use('/api/language-level', require('./routes/language-level'));
app.use('/api/daily-goals', require('./routes/daily-goals'));

// Round 26: 学习热力图 + 语法检查 + 专注会话时间线
app.use('/api/study-heatmap', require('./routes/study-heatmap'));
app.use('/api/grammar-check', require('./routes/grammar-check'));
app.use('/api/focus-session', require('./routes/focus-session'));

// Round 27: ELSA 音素评分 + 速度阅读 + 题目收藏
app.use('/api/phoneme-score', require('./routes/phoneme-scoring'));
app.use('/api/speed-reading', require('./routes/speed-reading'));
app.use('/api/bookmarks', require('./routes/bookmarks'));

// Round 28: 联赛系统 + 间隔重复复习 + 分数预测
app.use('/api/league', require('./routes/league'));
app.use('/api/srs-review', require('./routes/srs-review'));
app.use('/api/score-predictor', require('./routes/score-predictor'));

// Round 29: 全真模考 + 学习路径 + 每日碎片学习
app.use('/api/mock-exam', require('./routes/mock-exam'));
app.use('/api/learning-path', require('./routes/learning-path'));
app.use('/api/daily-micro', require('./routes/daily-micro'));

// Round 30: 听力精听 + 词汇图谱 + 成就徽章升级
app.use('/api/intensive-listening', require('./routes/intensive-listening'));
app.use('/api/vocab-graph', require('./routes/vocab-graph'));
// achievements.js already registered below

// Round 35: AI 题目解析 + 写作评分增强 + 口语跟读练习
app.use('/api/question-explanation', require('./routes/question-explanation'));
app.use('/api/writing-enhanced', require('./routes/writing-enhanced'));
app.use('/api/shadow-practice', require('./routes/shadow-practice'));

// Round 36: AI 即时反馈 + 词汇游戏 + 薄弱点分析
app.use('/api/instant-feedback', require('./routes/instant-feedback'));
app.use('/api/vocab-games', require('./routes/vocab-games'));
app.use('/api/weak-points', require('./routes/weak-points'));

// Round 37: XP 等级系统 + 发音波形对比 + 语法纠错助手
app.use('/api/xp-system', require('./routes/xp-system'));
app.use('/api/pronunciation-comparison', require('./routes/pronunciation-comparison'));
app.use('/api/grammar-coach', require('./routes/grammar-coach'));

// Round 38: 听力听写训练 + 学习数据报告 + 写作模板库
app.use('/api/listening-dictation', require('./routes/listening-dictation'));
app.use('/api/learning-analytics', require('./routes/learning-analytics'));
app.use('/api/writing-templates', require('./routes/writing-templates'));

// Round 39: AI 模拟考场 + 阅读速度训练 + 口语流利度追踪
app.use('/api/ai-mock-exam', require('./routes/ai-mock-exam'));
app.use('/api/reading-speed', require('./routes/reading-speed'));
app.use('/api/speaking-fluency', require('./routes/speaking-fluency'));

// Round 41: 单词书打卡 + AI 写作批改 + 学习计划
app.use('/api/vocab-streak', require('./routes/vocab-streak'));
app.use('/api/ai-writing', require('./routes/ai-writing'));
app.use('/api/study-plan', require('./routes/study-plan'));

// === 健康检查 ===
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    startup: startupState,
  });
});

// === 托管前端静态文件（构建产物 web/dist）===
// 本地/cpolar 单域名部署：后端同时服务前端页面与 /api
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  // 上传的音频（听力录音）静态托管
  app.use('/uploads', express.static(uploadsDir));
  // SPA fallback：非 /api、非 /uploads 的 GET 请求回退到 index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(webDist, 'index.html'));
  });
  console.log(`[TOEFL-Server] 静态资源目录: ${webDist}`);
} else {
  console.log('[TOEFL-Server] 未找到 web/dist，跳过静态托管（先 cd web && npm run build）');
}

// === 404 ===
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `路由 ${req.method} ${req.path} 不存在` });
});

// === 全局错误处理 ===
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: config.nodeEnv === 'production' && statusCode === 500
      ? '服务器内部错误'
      : err.message,
  });
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initDatabaseWithRetry() {
  const maxAttempts = parseInt(process.env.DB_INIT_RETRIES, 10) || 5;
  const retryDelayMs = parseInt(process.env.DB_INIT_RETRY_DELAY_MS, 10) || 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await initDatabase();
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      console.error(`[TOEFL-Server] 数据库初始化失败 (${attempt}/${maxAttempts}):`, err.message);
      if (isLastAttempt) throw err;
      await wait(retryDelayMs);
    }
  }
}

async function startServer() {
  // 显式绑定 0.0.0.0（IPv4 全接口），确保 Tailscale/局域网远端可访问
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[TOEFL-Server] 服务已启动: http://localhost:${config.port}`);
    console.log(`[TOEFL-Server] 环境: ${config.nodeEnv}`);
  });

  initDatabaseWithRetry()
    .then(() => {
      startupState.database = 'ready';
      startupState.databaseError = null;
      console.log('[TOEFL-Server] 数据库初始化完成');
    })
    .catch((err) => {
      startupState.database = 'failed';
      startupState.databaseError = err.message;
      console.error('[TOEFL-Server] 数据库初始化最终失败，服务保持运行:', err.message);
    });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[TOEFL-Server] 服务启动失败:', err.message);
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
