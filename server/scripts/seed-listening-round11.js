/**
 * 托福备考助手 — Round 11 听力扩充种子脚本
 * 新增 20 题：lecture × 3(各6题) + conversation × 2(各4题)
 * 用法: node scripts/seed-listening-round11.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

const LISTENING_DATA = require('../src/data/listening-round11-data.js');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('=== Round 11 听力扩充 ===');
    let inserted = 0;
    let skipped = 0;
    const batchName = 'round11-listening-' + new Date().toISOString().slice(0,10);

    for (const item of LISTENING_DATA) {
      const insertSql = `
        INSERT INTO questions (
          subject, type, difficulty, title, content, options,
          answer, analysis, passage_text, source, status,
          passage_id, question_order, batch_id, batch_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT DO NOTHING
      `;
      const result = await client.query(insertSql, [
        item.subject, item.type, item.difficulty, item.title, item.content,
        item.options, item.answer, item.analysis, item.passage_text,
        item.source, item.status, item.passage_id || null, 0,
        batchName, batchName
      ]);
      // ON CONFLICT DO NOTHING returns 0 or 1 affected
      if (result.rowCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log('插入成功: ' + inserted + ' 题');
    console.log('跳过(已存在): ' + skipped + ' 题');

    // Verify counts
    const counts = await pool.query('SELECT type, COUNT(*) FROM questions WHERE subject=\'listening\' GROUP BY type ORDER BY type');
    console.log('\n听力分布:');
    counts.rows.forEach(r => console.log('  ' + r.type + ': ' + r.count));

    const total = await pool.query('SELECT COUNT(*) FROM questions WHERE subject=\'listening\'');
    console.log('听力总计: ' + total.rows[0].count);

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error('Error:', err.message); process.exit(1); });
