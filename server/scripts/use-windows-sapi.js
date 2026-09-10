/**
 * 使用 Windows SAPI 生成音频
 * 通过 PowerShell 的 System.Speech 库
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

/**
 * 使用 PowerShell System.Speech 生成 WAV 音频
 */
function generateAudioWindows(text, outputFile) {
  const cleanText = text.replace(/"/g, '"').replace(/[<>]/g, '').trim();
  
  // 将文本写入临时文件以避免命令行长度限制
  const textFile = path.join(__dirname, '..', 'temp', 'tts_input.txt');
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(textFile, cleanText);
  
  const psScript = `
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SelectVoice("Microsoft Zira Desktop")
    $synth.Rate = 0
    $synth.Volume = 100
    $outputFile = "${outputFile.replace(/\\/g, '\\\\')}"
    $synth.Speak($args[0])
    $synth.SetOutputToWaveFile($outputFile)
    Write-Host "Generated: $(Get-Item $outputFile).Length bytes"
  `;

  try {
    const cmd = `powershell -Command "& { Add-Type -AssemblyName System.Speech; \$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; \$s.SelectVoice('Microsoft Zira Desktop'); \$s.Speak('${cleanText.replace(/'/g, "''")}'); \$s.SetOutputToWaveFile('${outputFile}'); }"`;
    execSync(cmd, { timeout: 15000 });
    const wavFile = outputFile.replace('.mp3', '.wav');
    if (fs.existsSync(wavFile)) {
      return wavFile;
    }
    return null;
  } catch (e) {
    console.error('  PS error:', e.message);
    return null;
  }
}

async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  console.log(`使用 Windows SAPI 生成 ${questions.length} 条音频\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const speakText = q.passage_text || q.content || `Question ${q.id}`;
    const filename = `listening_${q.id}_tts.wav`;
    const filepath = path.join(AUDIO_DIR, filename);

    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}] ${q.title?.substring(0,30)}`);

    try {
      const wavFile = generateAudioWindows(speakText, filepath);
      
      if (wavFile && fs.existsSync(wavFile)) {
        const stat = fs.statSync(wavFile);
        if (stat.size > 1000) {
          await pool.query(
            "UPDATE questions SET audio_url = $1 WHERE id = $2",
            [`/uploads/audio/${filename}`, q.id]
          );
          console.log(`  ✅ ${(stat.size/1024).toFixed(1)}KB WAV`);
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

    if (i < questions.length - 1) await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n成功: ${success} | 失败: ${failed}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
