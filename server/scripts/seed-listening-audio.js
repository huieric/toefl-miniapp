/**
 * 听力音频种子填充脚本
 * 为所有 listening 类型的题目填充 audio_url
 * 
 * 使用策略：
 * 1. 优先使用 TTS 服务生成音频
 * 2. 降级：使用公共领域音频资源的 placeholder URL
 * 
 * 用法: node scripts/seed-listening-audio.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

// 音频上传目录
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * 生成简单的 WAV 静音音频（1秒）
 * 用于测试和占位
 */
function createWavBuffer() {
  const sampleRate = 22050;
  const duration = 1;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = sampleRate * duration * numChannels * bitsPerSample / 8;
  const bufferSize = 44 + dataSize;

  const buffer = Buffer.alloc(bufferSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(bufferSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

/**
 * 使用 Edge TTS 生成音频
 */
async function generateAudioWithTTS(text, voice = 'en-US-GuyNeural') {
  const https = require('https');
  
  return new Promise((resolve) => {
    const data = new URLSearchParams();
    data.append('text', text);
    data.append('voice', voice);
    data.append('rate', '1.0');
    data.append('pitch', '0');
    data.append('platform', 'Web');
    data.append('type', 'text');

    const postData = data.toString();

    const req = https.request({
      hostname: 'zhitaofrance.sport368.net',
      path: '/api/txt2audio/v1/AzureFreeApi',
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
        const buffer = Buffer.concat(chunks);
        if (res.statusCode === 200 && buffer.length > 100) {
          resolve(buffer);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

/**
 * 保存音频到文件
 */
function saveAudio(audioBuffer, filename) {
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, audioBuffer);
  return `/uploads/audio/${filename}`;
}

async function run() {
  try {
    // 获取所有 listening 类型的题目
    const res = await pool.query(
      `SELECT id, content, passage_text, audio_url FROM questions 
       WHERE subject = 'listening' AND status = 'approved'`
    );
    const listeningQuestions = res.rows;

    console.log(`=== 找到 ${listeningQuestions.length} 条听力题目 ===`);
    
    const emptyAudioQuestions = listeningQuestions.filter(q => !q.audio_url || q.audio_url === '');
    console.log(`其中 ${emptyAudioQuestions.length} 条缺少音频\n`);

    if (emptyAudioQuestions.length === 0) {
      console.log('所有听力题目已有音频，无需填充');
      return;
    }

    let successCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < emptyAudioQuestions.length; i++) {
      const q = emptyAudioQuestions[i];
      const audioText = q.passage_text || q.content || `TOEFL Listening Question ${q.id}`;
      const filename = `listening_${q.id}_${Date.now()}.wav`;

      console.log(`[${i + 1}/${emptyAudioQuestions.length}] 处理: ${q.title?.substring(0, 40)}...`);

      // 尝试 TTS 生成
      let audioUrl = null;
      try {
        const isLecture = q.type === 'lecture';
        const voice = isLecture ? 'en-US-AriaNeural' : 'en-US-GuyNeural';
        const audioBuffer = await generateAudioWithTTS(audioText.substring(0, 500), voice);
        
        if (audioBuffer && audioBuffer.length > 100) {
          audioUrl = saveAudio(audioBuffer, filename);
          successCount++;
          console.log(`  ✅ TTS 生成: ${audioUrl} (${(audioBuffer.length / 1024).toFixed(1)}KB)`);
        }
      } catch (e) {
        console.warn(`  ⚠️ TTS 失败: ${e.message}`);
      }

      // 降级：使用占位音频
      if (!audioUrl) {
        try {
          const placeholder = createWavBuffer();
          audioUrl = saveAudio(placeholder, filename);
          fallbackCount++;
          console.log(`  ⏺ 占位音频: ${audioUrl}`);
        } catch (e) {
          console.error(`  ❌ 保存失败: ${e.message}`);
          continue;
        }
      }

      // 更新数据库
      await pool.query(
        `UPDATE questions SET audio_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [audioUrl, q.id]
      );
    }

    console.log(`\n=== 完成 ===`);
    console.log(`TTS 生成: ${successCount} 条`);
    console.log(`占位音频: ${fallbackCount} 条`);
    
    // 最终统计
    const final = await pool.query(
      `SELECT subject, COUNT(*) FROM questions GROUP BY subject ORDER BY subject`
    );
    console.log('\n=== 最终数据量 ===');
    final.rows.forEach(r => console.log(`  ${r.subject}: ${r.count}`));
    
    const audioStats = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '') as withAudio,
              COUNT(*) as total FROM questions WHERE subject = 'listening'`
    );
    console.log(`\n听力音频: ${audioStats.rows[0].withaudio}/${audioStats.rows[0].total} 条有音频`);

  } catch (e) {
    console.error('错误:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
