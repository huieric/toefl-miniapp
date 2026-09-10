/**
 * 用真实 TTS 音频替换占位音频
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const VOICES = { male: 'en-US-GuyNeural', female: 'en-US-AriaNeural' };

async function edgeTTS(text, voice) {
  return new Promise((resolve) => {
    const cleanText = text.replace(/[<>]/g, '').substring(0, 800);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voice}"><prosody rate="1.0" pitch="0Hz">${escapeXml(cleanText)}</prosody></voice></speak>`;

    const data = new URLSearchParams();
    data.append('text', ssml);
    data.append('voice', voice);
    data.append('rate', '1.0');
    data.append('pitch', '0');
    data.append('platform', 'Web');
    data.append('type', 'ssml');

    const postData = Buffer.from(data.toString());

    const req = https.request({
      hostname: 'zhitaofrance.sport368.net',
      path: '/api/txt2audio/v1/AzureFreeApi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
      },
      timeout: 20000,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(res.statusCode === 200 && buf.length > 500 ? buf : null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

function escapeXml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  console.log(`替换 ${questions.length} 条听力音频\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const speakText = q.passage_text || q.content || `Question ${q.id}`;
    const voice = q.type === 'lecture' ? VOICES.female : VOICES.male;
    const filename = `listening_${q.id}_tts.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}] ${q.title?.substring(0,30)}`);

    // 先尝试 TTS
    let audioBuffer = await edgeTTS(speakText, voice);

    if (!audioBuffer || audioBuffer.length < 500) {
      console.log(`  ⚠️ TTS 不可用，尝试备用端点...`);
      // 备用：直接尝试另一个免费端点
      audioBuffer = await tryOtherEndpoint(speakText, voice);
    }

    if (audioBuffer && audioBuffer.length > 500) {
      fs.writeFileSync(filepath, audioBuffer);
      await pool.query(
        "UPDATE questions SET audio_url = $1 WHERE id = $2",
        [`/uploads/audio/${filename}`, q.id]
      );
      console.log(`  ✅ ${(audioBuffer.length/1024).toFixed(1)}KB`);
      success++;
    } else {
      console.log(`  ❌ 所有 TTS 源都不可用`);
      failed++;
    }

    if (i < questions.length - 1) await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n成功: ${success} | 失败: ${failed}`);
  await pool.end();
}

async function tryOtherEndpoint(text, voice) {
  return new Promise((resolve) => {
    const cleanText = text.replace(/[<>]/g, '').substring(0, 800);
    const data = new URLSearchParams();
    data.append('text', cleanText);
    data.append('voice', voice);
    data.append('rate', '1.0');

    const postData = data.toString();

    const req = https.request({
      hostname: 'api.52read.com',
      path: '/api/tts/edge',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 15000,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(res.statusCode === 200 && buf.length > 500 ? buf : null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

main().catch(e => { console.error(e); process.exit(1); });
