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
  let inSingleQuote = false;
  let inDollar = false;
  let buf = '';
  const cleaned = sql.replace(/--.*$/gm, '');

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];
    buf += ch;

    if (!inDollar && ch === "'") {
      if (inSingleQuote && next === "'") {
        buf += next;
        i += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote && !inDollar && buf.endsWith('$$')) {
      inDollar = true;
      continue;
    }
    if (!inSingleQuote && inDollar && buf.endsWith('$$')) {
      inDollar = false;
      continue;
    }
    if (!inSingleQuote && !inDollar && ch === ';') {
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
  { table: 'questions', name: 'passage_id',     type: 'VARCHAR(50)' },
  { table: 'questions', name: 'question_order', type: 'INTEGER',      def: '0' },
  { table: 'questions', name: 'audio_url',    type: 'TEXT' },
  { table: 'questions', name: 'batch_id',     type: 'VARCHAR(50)' },
  { table: 'questions', name: 'batch_name',   type: 'TEXT' },
  { table: 'users',      name: 'phone',       type: 'VARCHAR(20)' },
  { table: 'users',      name: 'membership',  type: 'VARCHAR(20)', def: "'free'" },
  { table: 'users',      name: 'level',       type: 'VARCHAR(20)', def: "'beginner'" },
  { table: 'user_stats', name: 'reading_progress',  type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'listening_progress', type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'speaking_progress',  type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'user_stats', name: 'writing_progress',   type: 'JSONB', def: "'{\"correct\":0,\"total\":0,\"accuracy\":0}'" },
  { table: 'wrong_questions', name: 'updated_at',    type: 'TIMESTAMP', def: 'CURRENT_TIMESTAMP' },
  { table: 'wrong_questions', name: 'fsrs_stability',  type: 'DOUBLE PRECISION' },
  { table: 'wrong_questions', name: 'fsrs_difficulty', type: 'DOUBLE PRECISION' },
  { table: 'wrong_questions', name: 'last_review_at',  type: 'TIMESTAMP' },
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

  // 补充索引（列依赖的索引必须在列补全之后创建）
  try {
    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_passage ON questions(passage_id)`);
  } catch (err) {
    if (err.code === '42704') {
      console.log('[DB] passage_id 列不存在，跳过 idx_questions_passage 索引');
    } else {
      throw err;
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

// 错题去重 + 唯一约束：同一用户+题目只保留一条（重复答错累加次数而非新增记录）
async function dedupWrongAndAddConstraint(client) {
  try {
    await client.query(`
      DELETE FROM wrong_questions w
      USING wrong_questions w2
      WHERE w.user_id = w2.user_id AND w.question_id = w2.question_id AND w.id < w2.id
    `);
    console.log('[DB] wrong_questions 去重完成');
  } catch (err) {
    console.warn('[DB] wrong_questions 去重失败:', err.message.substring(0, 100));
  }
  try {
    await client.query(
      `ALTER TABLE wrong_questions ADD CONSTRAINT uq_wrong_user_question UNIQUE (user_id, question_id)`
    );
    console.log('[DB] uq_wrong_user_question 约束已创建');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('[DB] uq_wrong_user_question 约束已存在，跳过');
    } else {
      throw err;
    }
  }
}

// 回填题集标识：旧数据 passage_id = {uploadId}-pN，提取 uploadId 作为 batch_id
async function backfillBatchId(client) {
  try {
    const r1 = await client.query(
      `UPDATE questions SET batch_id = REGEXP_REPLACE(passage_id, '-p[0-9]+$', '')
       WHERE batch_id IS NULL AND passage_id IS NOT NULL`
    );
    const r2 = await client.query(
      `UPDATE questions SET batch_name = '真题集 ' || LEFT(batch_id, 8)
       WHERE batch_name IS NULL AND batch_id IS NOT NULL AND source = 'user'`
    );
    if ((r1.rowCount || 0) + (r2.rowCount || 0) > 0) {
      console.log(`[DB] 题集回填: batch_id ${r1.rowCount || 0} 行, batch_name ${r2.rowCount || 0} 行`);
    }
  } catch (err) {
    console.warn('[DB] 题集回填失败:', err.message.substring(0, 100));
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
    await dedupWrongAndAddConstraint(client);
    console.log('[DB] Phase 2: 列补全/去重/约束 完成');

    // Phase 2.5: 回填题集（旧数据的 batch_id 从 passage_id 提取）
    await backfillBatchId(client);

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