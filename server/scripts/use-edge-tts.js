/**
 * 用 edge-tts npm 包生成真实 TTS 音频
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });

const edgeTts = require('edge-tts');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const VOICES = { male: 'en-US-GuyNeural', female: 'en-US-AriaNeural' };

async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text, audio_url FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  console.log(`替换 ${questions.length} 条听力音频\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const speakText = q.passage_text || q.content || `Question ${q.id}`;
    const voice = q.type === 'lecture' ? VOICES.female : VOICES.male;
    const filename = `listening_${q.id}_tts.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}] ${q.title?.substring(0,30)}`);

    try {
      // 清理文本
      const cleanText = speakText.replace(/[<>]/g, '').trim();
      if (!cleanText || cleanText.length < 5) {
        console.log(`  ⚠️ 文本太短，跳过`);
        skipped++;
        continue;
      }

      const audioBuffer = await edgeTts.toAudio(cleanText, {
        voice: voice,
        rate: '1.0x',
        volume: '100%',
        pitch: '0Hz',
      });

      if (audioBuffer && audioBuffer.length > 1000) {
        fs.writeFileSync(filepath, audioBuffer);
        await pool.query(
          "UPDATE questions SET audio_url = $1 WHERE id = $2",
          [`/uploads/audio/${filename}`, q.id]
        );
        console.log(`  ✅ ${(audioBuffer.length/1024).toFixed(1)}KB`);
        success++;
      } else {
        console.log(`  ❌ 音频数据异常 (${audioBuffer?.length || 0} bytes)`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ 错误: ${e.message}`);
      failed++;
    }

    if (i < questions.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n成功: ${success} | 失败: ${failed} | 跳过: ${skipped}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
