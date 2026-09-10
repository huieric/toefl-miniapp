const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

(async () => {
  // Check all subjects
  const r1 = await pool.query("SELECT subject, COUNT(*), MIN(id), MAX(id), COUNT(*) FILTER (WHERE type = 'passage') as passages FROM questions WHERE status = 'approved' GROUP BY subject ORDER BY subject");
  console.log('=== All subjects ===');
  r1.rows.forEach(r => {
    console.log(`${r.subject}: ${r.count} questions (passages: ${r.passages}), ID range: ${r.min}..${r.max}`);
  });

  // Check speaking/writing details
  console.log('\n=== Speaking (first 3) ===');
  const sp = await pool.query("SELECT id, title FROM questions WHERE subject = 'speaking' AND status = 'approved' LIMIT 3");
  sp.rows.forEach(r => console.log(r.id + ': ' + r.title.substring(0,60)));

  console.log('\n=== Writing (first 3) ===');
  const wr = await pool.query("SELECT id, title FROM questions WHERE subject = 'writing' AND status = 'approved' LIMIT 3");
  wr.rows.forEach(r => console.log(r.id + ': ' + r.title.substring(0,60)));

  // Check if there's a speaking/writing count in a different table
  console.log('\n=== Tables ===');
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  tables.rows.forEach(r => console.log(r.table_name));

  await pool.end();
})();
