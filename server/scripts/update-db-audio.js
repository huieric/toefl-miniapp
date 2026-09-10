const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const updates = [
  { id: 1089, file: 'listening_1089.wav' },
  { id: 1090, file: 'listening_1090.wav' },
  { id: 1091, file: 'listening_1091.wav' },
  { id: 1092, file: 'listening_1092.wav' },
  { id: 1093, file: 'listening_1093.wav' },
  { id: 1114, file: 'listening_1114.wav' },
  { id: 1115, file: 'listening_1115.wav' },
  { id: 1116, file: 'listening_1116.wav' },
  { id: 1117, file: 'listening_1117.wav' },
  { id: 1118, file: 'listening_1118.wav' },
  { id: 1129, file: 'listening_1129.wav' },
  { id: 1130, file: 'listening_1130.wav' },
  { id: 1131, file: 'listening_1131.wav' },
  { id: 1132, file: 'listening_1132.wav' },
  { id: 1133, file: 'listening_1133.wav' },
  { id: 1134, file: 'listening_1134.wav' },
];

async function main() {
  for (const { id, file } of updates) {
    await pool.query(
      "UPDATE questions SET audio_url = $1 WHERE id = $2",
      [`/uploads/audio/${file}`, id]
    );
    console.log(`Updated #${id}: ${file}`);
  }
  
  const stats = await pool.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '') as withAudio FROM questions WHERE subject = 'listening'"
  );
  console.log(`\nTotal: ${stats.rows[0].withaudio}/${stats.rows[0].total} listening questions have audio`);
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
