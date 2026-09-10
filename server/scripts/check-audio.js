const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(
  "SELECT id, title, type, audio_url FROM questions WHERE subject = 'listening' ORDER BY id"
).then(r => {
  console.log('Listening questions with audio:');
  r.rows.forEach(q => {
    console.log('  #' + q.id + ' [' + q.type + '] audio: ' + q.audio_url);
  });
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
