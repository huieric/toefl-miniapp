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

/**
 * 按 ; 分割 SQL，正确识别 $$...$$ dollar-quoted 块（不被块内 ; 截断）
 */
function splitSql(sql) {
  const statements = [];
  let inDollar = false;
  let buf = '';
  const cleaned = sql.replace(/--.*$/gm, '');
  for (const ch of cleaned) {
    buf += ch;
    if (!inDollar && buf.endsWith('$$')) {
      inDollar = true;
      continue;
    }
    if (inDollar && buf.endsWith('$$')) {
      inDollar = false;
      continue;
    }
    if (!inDollar && ch === ';') {
      const stmt = buf.slice(0, -1).trim();
      if (stmt.length > 0) statements.push(stmt);
      buf = '';
    }
  }
  const last = buf.trim();
  if (last.length > 0) statements.push(last);
  return statements;
}

/**
 * 列定义
 */
const COLUMN_DEFS = [
  { table: 'questions', name: 'answer',       type: 'TEXT' },
  { table: 'questions', name: 'analysis',     type: 'TEXT' },
  { table: 'questions', name: 'source',       type: 'VARCHAR(50)',  def: "'official'" },
  { table: 'questions', name: 'status',       type: 'VARCHAR(15)',  def: "'pending'" },
  { table: 'questions', name: 'passage_text', type: 'TEXT' },
  { table: 'questions', name: 'audio_url',    type: 'TEXT' },
  { table: 'users',      name: 'phone',       type: 'VARCHAR(20)' },
  { table: 'users',      name: 'membership',  type: 'VARCHAR(20)', def: "'free'" },
  { table: 'users',      name: 'level',       type: 'VARCHAR(20)', def: "'beginner'" },
  { table: 'user_stats', name: 'reading_progress',  type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'listening_progress', type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'speaking_progress',  type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'writing_progress',   type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
];

async function ensureMissingColumns(client) {
  const tableNames = [...new Set(COLUMN_DEFS.map(c => c.table))];
  const res = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_name = ANY($1)`,
    [tableNames]
  );
  const existing = {};
  for (const row of res.rows) {
    if (!existing[row.table_name]) existing[row.table_name] = new Set();
    existing[row.table_name].add(row.column_name);
  }
  for (const col of COLUMN_DEFS) {
    const tbl = existing[col.table];
    if (!tbl || !tbl.has(col.name)) {
      const defClause = col.def ? ` DEFAULT ${col.def}` : '';
      await client.query(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${col.type}${defClause}`);
      console.log(`[DB] 添加列 ${col.table}.${col.name}`);
    }
  }
}

async function dedupAndAddConstraint(client) {
  await client.query(`
    DELETE FROM questions
    WHERE ctid NOT IN (
      SELECT MIN(ctid) FROM questions GROUP BY title, subject
    )
  `);
  console.log('[DB] questions 去重完成');

  try {
    await client.query(
      `ALTER TABLE questions ADD CONSTRAINT uq_questions_title_subject UNIQUE (title, subject)`
    );
    console.log('[DB] uq_questions_title_subject 约束已创建');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('[DB] uq_questions_title_subject 约束已存在，跳过');
    } else {
      throw err;
    }
  }
}

async function initDatabase() {
  const sqlPath = path.join(__dirname, '..', 'models', 'db-init.sql');
  if (!fs.existsSync(sqlPath)) {
    console.warn('[DB] db-init.sql 未找到，跳过初始化');
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const allStatements = splitSql(sql);
  const ddl = allStatements.filter(s => /^\s*CREATE\s/i.test(s));
  const rest = allStatements.filter(s => !/^\s*CREATE\s/i.test(s));

  const client = await pool.connect();
  try {
    // Phase 1: 建表 + 建索引
    for (const stmt of ddl) {
      await client.query(stmt);
    }
    console.log('[DB] Phase 1: DDL 完成');

    // Phase 2: 列补全 + 去重 + 约束（Node.js 层面）
    await ensureMissingColumns(client);
    await dedupAndAddConstraint(client);
    console.log('[DB] Phase 2: 列补全/去重/约束 完成');

    // Phase 3: 数据修复 UPDATE + 数据填充 INSERT
    for (const stmt of rest) {
      try {
        await client.query(stmt);
      } catch (err) {
        console.warn('[DB] 语句跳过:', err.message.substring(0, 100));
      }
    }
    console.log('[DB] Phase 3: 数据初始化完成');
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