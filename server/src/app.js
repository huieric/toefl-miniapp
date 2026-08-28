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
const vocabRoutes = require('./routes/vocab');
const aiRoutes = require('./routes/ai');

// 确保 uploads 目录存在（multer 写文件的前提）
const uploadsDir = path.join(__dirname, '..', 'uploads');
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
