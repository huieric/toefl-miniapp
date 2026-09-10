const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });

(async () => {
  const r = await pool.query("SELECT id, title, type, source, LENGTH(passage_text) as txt_len FROM questions WHERE subject = 'listening' AND type != 'passage' ORDER BY id LIMIT 5");
  console.log('=== Listening questions ===');
  r.rows.forEach(x => console.log(`id=${x.id} type=${x.type} src=${x.source} title=${(x.title||'').substring(0,60)}`));
  
  const cnt = await pool.query("SELECT COUNT(*) as c FROM questions WHERE subject = 'listening' AND type != 'passage'");
  console.log(`\nTotal listening: ${cnt.rows[0].c}`);
  
  const pass = await pool.query("SELECT passage_id, title FROM questions WHERE type = 'passage' AND subject = 'listening'");
  console.log(`\nListening passages:`);
  pass.rows.forEach(x => console.log(`  ${x.passage_id}: ${x.title}`));
  
  await pool.end();
})();
