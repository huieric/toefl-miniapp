/**
 * 生成听力真实音频 — 使用 Microsoft Edge TTS
 * 免费、无需 API Key
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// 语音映射
const VOICES = {
  male: 'en-US-GuyNeural',
  female: 'en-US-AriaNeural',
  female2: 'en-US-JennyNeural',
};

/**
 * 使用 Edge TTS 代理生成 MP3
 */
async function edgeTTS(text, voice = VOICES.male) {
  return new Promise((resolve) => {
    // 清理文本中的特殊字符
    const cleanText = text
      .replace(/[<>]/g, '')
      .substring(0, 800);
    
    // 构建 SSML
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voice}"><prosody rate="1.0" pitch="0Hz">${escapeXml(cleanText)}</prosody></voice></speak>`;

    const data = new URLSearchParams();
    data.append('text', ssml);
    data.append('voice', voice);
    data.append('rate', '1.0');
    data.append('pitch', '0');
    data.append('platform', 'Web');
    data.append('type', 'ssml');

    const postData = data.toString();
    const postBuffer = Buffer.from(postData);

    const req = https.request({
      hostname: 'zhitaofrance.sport368.net',
      path: '/api/txt2audio/v1/AzureFreeApi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postBuffer.length,
      },
      timeout: 20000,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode === 200 && buf.length > 500) {
          resolve(buf);
        } else {
          console.log('  TTS proxy response: status=' + res.statusCode + ' size=' + buf.length);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log('  TTS connection error: ' + e.message);
      resolve(null);
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postBuffer);
    req.end();
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  // 获取所有听力题目
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text, audio_url FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  console.log(`找到 ${questions.length} 条听力题目\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // 确定要朗读的文本（优先用 passage，其次 content）
    const speakText = q.passage_text || q.content || `Question ${q.id}`;
    
    // 选择语音：讲座用女声，对话用男声
    const voice = q.type === 'lecture' ? VOICES.female : VOICES.male;
    
    const filename = `listening_${q.id}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // 跳过已有音频的
    if (q.audio_url && q.audio_url !== '') {
      console.log(`[${i+1}/${questions.length}] #${q.id} 已有音频，跳过`);
      skipped++;
      continue;
    }

    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}] ${q.title?.substring(0,30)}`);
    console.log(`  文本: ${speakText.substring(0, 60)}...`);

    try {
      const audioBuffer = await edgeTTS(speakText, voice);
      
      if (audioBuffer && audioBuffer.length > 500) {
        fs.writeFileSync(filepath, audioBuffer);
        
        // 更新数据库
        await pool.query(
          "UPDATE questions SET audio_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [`/uploads/audio/${filename}`, q.id]
        );
        
        console.log(`  ✅ TTS 生成: ${(audioBuffer.length/1024).toFixed(1)}KB`);
        success++;
      } else {
        console.log(`  ⚠️ 音频生成失败（数据太小）`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ 错误: ${e.message}`);
      failed++;
    }
    
    // 限流
    if (i < questions.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log(`\n=== 完成 ===`);
  console.log(`成功: ${success} | 失败: ${failed} | 跳过: ${skipped}`);

  // 最终统计
  const stats = await pool.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '') as withAudio FROM questions WHERE subject = 'listening'"
  );
  console.log(`\n听力音频: ${stats.rows[0].withaudio}/${stats.rows[0].total} 条有音频`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
