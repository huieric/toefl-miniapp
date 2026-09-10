const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db' });
p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions' ORDER BY ordinal_position")
  .then(r => r.rows.forEach(row => console.log(row.column_name + ' | ' + row.data_type)))
  .catch(e => console.error(e.message))
  .finally(() => p.end());
