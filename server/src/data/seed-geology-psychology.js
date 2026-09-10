/**
 * Seed script - 地质学/心理学阅读篇章入库
 * 
 * 用法: node server/src/data/seed-geology-psychology.js
 */
const { Pool } = require('pg');
const PASSAGES = require('./default-geology-psychology');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://toefl:toefl123@localhost:5433/toefl_db'
});

async function seed() {
  let inserted = 0;
  let updated = 0;
  const conn = await pool.connect();

  try {
    console.log('📖 Seeding Geology and Psychology reading passages...\n');

    for (const passage of PASSAGES) {
      console.log(`📖 Processing: ${passage.title}`);

      const existing = await conn.query(
        'SELECT id FROM questions WHERE passage_id = $1 AND subject = $2',
        [passage.passage_id, 'reading']
      );

      if (existing.rows.length > 0) {
        await conn.query(
          `UPDATE questions SET passage_text = $1, content = $2 WHERE passage_id = $3 AND subject = 'reading'`,
          [passage.passage_text, `【阅读文章】${passage.title}`, passage.passage_id]
        );
        updated++;
        console.log(`  ✓ Updated existing passage`);
      } else {
        await conn.query(
          `INSERT INTO questions (passage_id, title, subject, type, difficulty, source, content, options, answer, passage_text, status)
           VALUES ($1, $2, 'reading', 'passage', $3, $4, $5, '[]', '', $6, 'approved')`,
          [passage.passage_id, passage.title, passage.difficulty, passage.source, `【阅读文章】${passage.title}`, passage.passage_text]
        );
        inserted++;
        console.log(`  ✓ Inserted passage`);
      }

      for (const q of passage.questions) {
        const qTitle = `Q${q.order} - ${passage.title.substring(0, 40)}`;
        const existingQ = await conn.query(
          'SELECT id FROM questions WHERE passage_id = $1 AND content = $2',
          [passage.passage_id, q.content]
        );

        if (existingQ.rows.length > 0) {
          await conn.query(
            `UPDATE questions SET type = $1, difficulty = $2, options = $3::jsonb, answer = $4, analysis = $5, "order" = $6
             WHERE id = $7`,
            [q.type, q.difficulty, q.options, q.answer, q.analysis, q.order, existingQ.rows[0].id]
          );
          updated++;
        } else {
          await conn.query(
            `INSERT INTO questions 
              (passage_id, title, subject, type, difficulty, source, content, options, answer, analysis, "order", status)
             VALUES ($1, $2, 'reading', $3, $4, $5, $6, $7::jsonb, $8, $9, $10, 'approved')`,
            [
              passage.passage_id,
              qTitle,
              q.type,
              q.difficulty,
              passage.source,
              q.content,
              q.options,
              q.answer,
              q.analysis,
              q.order
            ]
          );
          inserted++;
        }
      }
      console.log(`  ✓ Inserted/updated ${passage.questions.length} questions`);
    }

    console.log(`\n✅ Seeded ${inserted} new rows, updated ${updated} existing rows`);

    const t = await conn.query("SELECT count(*) FROM questions WHERE subject='reading'");
    console.log(`Total reading questions now: ${t.rows[0].count}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
