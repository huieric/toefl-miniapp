require('dotenv').config({ path: './toefl-miniapp/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT subject, count(*) FROM questions GROUP BY subject").then(r => {
  r.rows.forEach(row => console.log(row.subject + ': ' + row.count));
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
