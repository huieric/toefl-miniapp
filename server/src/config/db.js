const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./index');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] 连接池异常:', err.message);
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function getClient() {
  return await pool.connect();
}

async function initDatabase() {
  const sqlPath = path.join(__dirname, '..', 'models', 'db-init.sql');
  if (!fs.existsSync(sqlPath)) {
    console.warn('[DB] db-init.sql 未找到，跳过初始化');
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  // 按语句分割（以分号结尾的行）
  const statements = sql
    .replace(/--.*$/gm, '')  // 移除注释
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const client = await pool.connect();
  try {
    for (const stmt of statements) {
      await client.query(stmt);
    }
    console.log('[DB] 数据库表初始化完成');
  } catch (err) {
    console.error('[DB] 初始化失败:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  query,
  getClient,
  pool,
  initDatabase,
};
