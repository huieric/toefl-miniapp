const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

(async () => {
  const res = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'questions'
    ORDER BY ordinal_position
  `);
  console.log('=== Questions table columns ===');
  res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (${r.is_nullable})`));

  // Check if there's a separate table for integrated questions
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%integrat%' OR table_name LIKE '%speak%'
    ORDER BY table_name
  `);
  console.log('\n=== Related tables ===');
  tables.rows.forEach(r => console.log(r.table_name));

  // Check existing integrated speaking questions for column reference
  const existing = await pool.query(`
    SELECT title, subject, type, LENGTH(content) as content_len, LENGTH(answer) as answer_len
    FROM questions WHERE subject = 'speaking' AND type = 'integrated' LIMIT 2
  `);
  console.log('\n=== Existing integrated speaking samples ===');
  existing.rows.forEach(r => console.log(`${r.title}: content=${r.content_len}, answer=${r.answer_len}`));

  await pool.end();
})();
