/**
 * 默认题库种子脚本
 * 
 * 运行方式:
 *   node server/src/data/seed-defaults.js
 *   或部署时 Render 自动执行
 */

const db = require('../config/db');
const { DEFAULT_PASSAGES } = require('./default-passages');

async function seedDefaults() {
  console.log('[Seed] 开始导入默认题库...');
  let inserted = 0;

  for (const passage of DEFAULT_PASSAGES) {
    // 检查是否已存在
    const existing = await db.query(
      `SELECT COUNT(*) FROM questions WHERE passage_id = $1`,
      [passage.passage_id]
    );
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`[Seed] 跳过已存在: ${passage.title}`);
      continue;
    }

    for (const q of passage.questions) {
      try {
        await db.query(
          `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, $12)`,
          [
            passage.subject,
            q.type,
            q.difficulty || passage.difficulty,
            `${passage.title} - Q${q.order}`,
            q.content,
            q.options,
            q.answer,
            q.analysis,
            passage.passage_text,
            passage.source,
            passage.passage_id,
            q.order
          ]
        );
        inserted++;
      } catch (err) {
        console.error(`[Seed] 插入失败 [${passage.title} Q${q.order}]:`, err.message);
      }
    }
  }

  console.log(`[Seed] 完成: 导入了 ${inserted} 道题目`);
  return inserted;
}

// 直接运行
if (require.main === module) {
  seedDefaults()
    .then(n => { console.log(`Done: ${n} questions seeded`); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedDefaults };
