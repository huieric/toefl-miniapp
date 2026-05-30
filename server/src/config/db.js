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
  // 按语句分割：识别 $$...$$ dollar-quoted 块，避免被 ; 截断
  const statements = [];
  let inDollar = false;
  let buf = '';
  const cleaned = sql.replace(/--.*$/gm, '');
  for (const ch of cleaned) {
    buf += ch;
    if (!inDollar && buf.endsWith('$$')) {
      inDollar = true;
    } else if (inDollar && buf.endsWith('$$')) {
      inDollar = false;
    }
    if (!inDollar && ch === ';') {
      const stmt = buf.slice(0, -1).trim();
      if (stmt.length > 0) statements.push(stmt);
      buf = '';
    }
  }
  const last = buf.trim();
  if (last.length > 0) statements.push(last);

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
