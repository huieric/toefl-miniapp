require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  tencentSecretId: process.env.TENCENT_SECRET_ID,
  tencentSecretKey: process.env.TENCENT_SECRET_KEY,
  ossBucket: process.env.OSS_BUCKET,
  ossRegion: process.env.OSS_REGION,
  wechatAppid: process.env.WECHAT_APPID,
  wechatSecret: process.env.WECHAT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
};
