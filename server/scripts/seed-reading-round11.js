/**
 * 托福备考助手 — Round 11 阅读扩充种子脚本
 * 新增 3 篇阅读长篇章：心理学/天文学/生态学
 * 每篇 1 passage + 6 题 = 7 条记录 × 3篇 = 21 条记录
 * 用法: node scripts/seed-reading-round11.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

const READING_DATA = require('../src/data/reading-round11-data.js');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('=== Round 11 阅读扩充 ===');
    let inserted = 0;
    let skipped = 0;
    const batchName = 'round11-reading-' + new Date().toISOString().slice(0,10);

    for (const item of READING_DATA) {
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
        item.source, item.status, item.passage_id, item.question_order,
        batchName, batchName
      ]);
      if (result.rowCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log('插入成功: ' + inserted + ' 题');
    console.log('跳过(已存在): ' + skipped + ' 题');

    // Verify counts
    const counts = await pool.query('SELECT type, COUNT(*) FROM questions WHERE subject=\'reading\' GROUP BY type ORDER BY type');
    console.log('\n阅读分布:');
    counts.rows.forEach(r => console.log('  ' + r.type + ': ' + r.count));

    const total = await pool.query('SELECT COUNT(*) FROM questions WHERE subject=\'reading\'');
    console.log('阅读总计: ' + total.rows[0].count);

    const passageCount = await pool.query("SELECT COUNT(*) FROM questions WHERE type='passage' AND subject='reading'");
    console.log('阅读篇章数: ' + passageCount.rows[0].count);

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error('Error:', err.message); process.exit(1); });
