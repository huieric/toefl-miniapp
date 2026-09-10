const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

(async () => {
  // Simple counts per subject
  const counts = await pool.query(`
    SELECT subject, COUNT(*) as total
    FROM questions WHERE status = 'approved'
    GROUP BY subject ORDER BY subject
  `);
  console.log('=== Final Data Counts ===');
  counts.rows.forEach(r => console.log(`${r.subject}: ${r.total}`));

  const total = await pool.query(`SELECT COUNT(*) as total FROM questions WHERE status = 'approved'`);
  console.log(`\nGrand total: ${total.rows[0].total}`);

  // Reading passage titles
  const passages = await pool.query(`
    SELECT DISTINCT passage_id, 
      MAX(CASE WHEN type='passage' THEN title END) as title
    FROM questions 
    WHERE type = 'passage' AND subject = 'reading' 
    GROUP BY passage_id ORDER BY passage_id
  `);
  console.log('\n=== All Reading Passages ===');
  passages.rows.forEach((r, i) => console.log(`  ${i+1}. ${r.passage_id}: ${r.title}`));

  // Listening breakdown
  const listening = await pool.query(`
    SELECT type, COUNT(*) as cnt
    FROM questions WHERE subject = 'listening' AND status = 'approved'
    GROUP BY type ORDER BY type
  `);
  console.log('\n=== Listening Breakdown ===');
  listening.rows.forEach(r => console.log(`  ${r.type}: ${r.cnt}`));

  await pool.end();
})();
