/**
 * Seed script - 写作题库扩充 20条
 * 
 * 用法: node server/src/data/seed-writing-expansion.js
 */
const { Pool } = require('pg');
const QUESTIONS = require('./default-writing-expansion');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://toefl:toefl123@localhost:5433/toefl_db'
});

async function seed() {
  let inserted = 0;
  const conn = await pool.connect();

  try {
    console.log('✍️  Seeding writing questions expansion...\n');

    for (const q of QUESTIONS) {
      const existing = await conn.query(
        'SELECT id FROM questions WHERE title = $1 AND subject = $2',
        [q.title, 'writing']
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped (already exists): ${q.title}`);
        continue;
      }

      await conn.query(
        `INSERT INTO questions 
          (title, subject, type, difficulty, source, content, options, answer, analysis, status)
         VALUES ($1, 'writing', $2, $3, $4, $5, '[]', '', '', 'approved')`,
        [q.title, q.type, q.difficulty, q.source, q.content]
      );
      inserted++;
      console.log(`  ✓ Inserted: ${q.title} [${q.type}]`);
    }

    console.log(`\n✅ Inserted ${inserted} new writing questions`);

    const t = await conn.query("SELECT count(*) FROM questions WHERE subject='writing'");
    console.log(`Total writing questions now: ${t.rows[0].count}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
