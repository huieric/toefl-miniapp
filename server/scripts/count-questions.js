const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db',
});

pool.query('SELECT subject, count(*) FROM questions GROUP BY subject ORDER BY subject')
  .then(r => {
    r.rows.forEach(x => console.log(x.subject + ': ' + x.count));
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
