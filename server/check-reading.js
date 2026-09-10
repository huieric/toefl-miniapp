const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

(async () => {
  // 当前数据库状态
  const counts = await pool.query(`
    SELECT subject, COUNT(*) FROM questions 
    WHERE status = 'approved' GROUP BY subject ORDER BY subject
  `);
  console.log('=== Current Counts ===');
  counts.rows.forEach(r => console.log(`${r.subject}: ${r.count}`));

  // 检查现有阅读长篇章
  const passages = await pool.query(`
    SELECT title, passage_id, difficulty, LENGTH(passage_text) as text_len, LENGTH(content) as content_len
    FROM questions WHERE type = 'passage' ORDER BY passage_id
  `);
  console.log('\n=== Existing Passages ===');
  passages.rows.forEach(r => console.log(`${r.passage_id}: ${r.title} (text=${r.text_len}, questions=${r.content_len})`));

  // 查看阅读题结构
  const sample = await pool.query(`
    SELECT title, type, difficulty, content, passage_id, options
    FROM questions WHERE type != 'passage' AND subject = 'reading' LIMIT 3
  `);
  console.log('\n=== Reading Question Structure ===');
  sample.rows.forEach(r => console.log(`${r.title} | type=${r.type} | difficulty=${r.difficulty} | passage_id=${r.passage_id}`));
  console.log('options format:', sample.rows[0]?.options);

  await pool.end();
})();
