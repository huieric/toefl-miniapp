const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

async function main() {
  // Get topics with multiple questions to find duplicates
  const r = await pool.query(
    `SELECT title, count(*) as cnt, string_agg(DISTINCT difficulty, ',') as diffs
     FROM questions 
     WHERE subject='reading' 
     GROUP BY title 
     HAVING count(*) > 1
     ORDER BY count(*) DESC
     LIMIT 30`
  );
  console.log('=== Topics with multiple entries ===');
  r.rows.forEach(row => {
    console.log(`  ${row.title?.substring(0, 50) || '(empty)'}: ${row.cnt} questions [difficulties: ${row.diffs}]`);
  });

  // Check how many have 'Foraging' title
  const f = await pool.query("SELECT count(*) FROM questions WHERE subject='reading' AND title LIKE '%Foraging%'");
  console.log(`\nForaging questions: ${f.rows[0].count} / 566`);

  // Sample a few questions for a given topic
  const s = await pool.query(
    `SELECT id, title, difficulty, content, answer FROM questions 
     WHERE subject='reading' AND title LIKE '%Foraging%' LIMIT 5`
  );
  console.log('\n=== Sample Foraging questions ===');
  s.rows.forEach(row => {
    console.log(`  Q${row.id} [${row.difficulty}]: ${row.answer} - ${row.content?.substring(0, 80)}`);
  });

  // Check distinct non-Foraging topics
  const d = await pool.query(
    `SELECT title, count(*) FROM questions 
     WHERE subject='reading' AND title NOT LIKE '%Foraging%'
     GROUP BY title ORDER BY count(*) DESC LIMIT 20`
  );
  console.log('\n=== Non-Foraging topics ===');
  d.rows.forEach(row => console.log(`  ${row.title}: ${row.count}`));

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
