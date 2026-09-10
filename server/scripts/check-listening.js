const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(
  "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
).then(r => {
  r.rows.forEach(q => {
    console.log('=== Q'+q.id+' ['+q.type+'] ===');
    console.log('title: ' + (q.title||'none'));
    console.log('passage: ' + (q.passage_text||'none').substring(0,100));
    console.log('content: ' + (q.content||'none').substring(0,100));
    console.log('---');
  });
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
