/**
 * 种子脚本：人类学/环境科学/数学史阅读篇章
 * 用法: node src/data/seed-reading-anthropology.js
 */

const db = require('../config/db');
const { PASSAGES } = require('./default-anthropology-environmental-math');

async function seed() {
  console.log('[Seed] 开始导入阅读篇章...');
  let inserted = 0;
  let skipped = 0;
  const batchId = 'anthro-envsci-math-' + new Date().toISOString().slice(0, 10);

  for (const pg of PASSAGES) {
    // 检查是否已存在
    const existing = await db.query(
      `SELECT COUNT(*) FROM questions WHERE passage_id = $1 AND source = $2`,
      [pg.passage_id, pg.source]
    );
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`[Seed] 跳过已存在: ${pg.title}`);
      skipped++;
      continue;
    }

    // 插入 passage 行（type='passage'，order=0）
    try {
      await db.query(
        `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, $12)`,
        [
          pg.subject,
          'passage',
          pg.difficulty,
          pg.title,
          pg.passage_text,
          null,
          null,
          null,
          pg.passage_text,
          pg.source,
          pg.passage_id,
          0
        ]
      );
      inserted++;
    } catch (err) {
      console.error(`[Seed] 插入passage行失败 [${pg.title}]:`, err.message);
    }

    for (const q of pg.questions) {
      try {
        await db.query(
          `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, $12)`,
          [
            pg.subject,
            q.type || 'detail',
            q.difficulty,
            `${pg.title} - Q${q.order}`,
            q.content,
            q.options,
            q.answer,
            q.analysis,
            pg.passage_text,
            pg.source,
            pg.passage_id,
            q.order
          ]
        );
        inserted++;
      } catch (err) {
        console.error(`[Seed] 插入失败 [${pg.title} Q${q.order}]:`, err.message);
      }
    }
  }

  // 验证
  const result = await db.query(
    `SELECT COUNT(*) as total FROM questions WHERE status = 'approved' AND subject = 'reading'`
  );
  const resultAll = await db.query(
    `SELECT subject, COUNT(*) as total FROM questions WHERE status = 'approved' GROUP BY subject ORDER BY subject`
  );

  console.log(`\n=== Seed Complete ===`);
  console.log(`Inserted: ${inserted} questions`);
  console.log(`Skipped: ${skipped} passages`);
  console.log(`Total reading: ${result.rows[0].total}`);
  resultAll.rows.forEach(r => console.log(`  ${r.subject}: ${r.total}`));

  return { inserted, skipped };
}

if (require.main === module) {
  seed()
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
