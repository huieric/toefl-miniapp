const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

const app = express();

// === 安全中间件 ===
app.use(helmet());

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

// === 健康检查 ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// === 启动服务器 ===
initDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[TOEFL-Server] 服务已启动: http://localhost:${config.port}`);
      console.log(`[TOEFL-Server] 环境: ${config.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error('[TOEFL-Server] 数据库初始化失败，服务未启动:', err.message);
    process.exit(1);
  });

module.exports = app;