/**
 * 使用 Windows SAPI 生成所有听力音频
 * 通过临时文件避免命令行转义问题
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function generateWAV(text, outputFile, voice = 'Microsoft Zira Desktop') {
  const textFile = path.join(TEMP_DIR, 'tts_input.txt');
  const psScriptFile = path.join(TEMP_DIR, 'tts.ps1');

  // 写入文本文件
  fs.writeFileSync(textFile, text);
  
  // 写入 PS 脚本（使用双引号读取文件）
  const psScript = `
    Add-Type -AssemblyName System.Speech
    $text = [System.IO.File]::ReadAllText("${textFile.replace(/\\/g, '\\\\')}")
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SelectVoice("${voice}")
    $s.SetOutputToWaveFile("${outputFile.replace(/\\/g, '\\\\')}")
    $s.Speak($text)
    $s.Dispose()
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Remove-Item "${textFile}"
    Remove-Item "${psScriptFile}"
  `;
  
  fs.writeFileSync(psScriptFile, psScript, 'utf8');

  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptFile.replace(/\\/g, '\\\\')}"`, {
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return fs.existsSync(outputFile);
  } catch (e) {
    // 清理临时文件
    try {
      fs.unlinkSync(psScriptFile);
    } catch {}
    console.error('  SAPI error:', e.message.split('\n')[0]);
    return false;
  }
}

async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  console.log(`使用 Windows SAPI 生成 ${questions.length} 条听力音频\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const speakText = q.passage_text || q.content || `Question ${q.id}`;
    const filename = `listening_${q.id}_sapi.wav`;
    const filepath = path.join(AUDIO_DIR, filename);

    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}] ${q.title?.substring(0,30)}`);

    // 对话用男声(David)，讲座用女声(Zira)
    const voice = q.type === 'conversation' ? 'Microsoft David Desktop' : 'Microsoft Zira Desktop';
    
    try {
      const ok = generateWAV(speakText, filepath, voice);
      
      if (ok && fs.existsSync(filepath)) {
        const stat = fs.statSync(filepath);
        if (stat.size > 2000) {
          await pool.query(
            "UPDATE questions SET audio_url = $1 WHERE id = $2",
            [`/uploads/audio/${filename}`, q.id]
          );
          console.log(`  ✅ ${voice.split(' ')[1]} ${(stat.size/1024).toFixed(1)}KB`);
          success++;
        } else {
          console.log(`  ⚠️ 文件太小 (${stat.size} bytes)`);
          failed++;
        }
      } else {
        console.log(`  ❌ 生成失败`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ 错误: ${e.message}`);
      failed++;
    }

    if (i < questions.length - 1) await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n=== 完成 ===`);
  console.log(`成功: ${success} | 失败: ${failed}`);

  const stats = await pool.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '') as withAudio FROM questions WHERE subject = 'listening'"
  );
  console.log(`\n听力音频: ${stats.rows[0].withaudio}/${stats.rows[0].total} 条有音频`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
