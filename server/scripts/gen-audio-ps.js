/**
 * 生成听力音频 - 使用 PowerShell 直接执行
 * 避免 Node.js → PS 路径编码问题
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 获取所有听力题目
async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;

  // 生成 PowerShell 脚本
  const audioDir = path.join(process.cwd(), 'uploads', 'audio');
  let psScript = `
    Add-Type -AssemblyName System.Speech
    
    $audioDir = "${audioDir}"
    if (!(Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir -Force }
    
    $voices = @{
      'conversation' = 'Microsoft David Desktop'
      'lecture' = 'Microsoft Zira Desktop'
    }
    
    $questions = @${JSON.stringify(questions.map(q => ({
      id: q.id,
      type: q.type,
      title: q.title,
      content: q.content,
      passage: q.passage_text
    }))}
    
    $success = 0
    $failed = 0
    
    foreach ($q in $questions) {
      $filename = "listening_$($q.id)_sapi.wav"
      $filepath = Join-Path $audioDir $filename
      $voice = $voices[$q.type]
      
      Write-Host "`n[$($q.id)] [${q.type}] ${q.title}"
      
      $text = $q.passage
      if (!$text -or $text.Length -lt 5) { $text = $q.content }
      if (!$text -or $text.Length -lt 5) { continue }
      
      try {
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SelectVoice($voice)
        $s.SetOutputToWaveFile($filepath)
        $s.Speak($text)
        $s.Dispose()
        [System.GC]::Collect()
        
        $file = Get-Item $filepath -ErrorAction SilentlyContinue
        if ($file -and $file.Length -gt 2000) {
          Write-Host "  OK: $($voice.Split(' ')[1]) $([math]::Round($file.Length/1024, 1))KB"
          $success++
        } else {
          Write-Host "  Small file"
          $failed++
        }
      } catch {
        Write-Host "  Error: $_"
        $failed++
      }
      
      Start-Sleep -Milliseconds 100
    }
    
    Write-Host "`n=== Done ==="
    Write-Host "Success: $success, Failed: $failed"
  `;

  const tempPs = path.join(process.cwd(), 'temp', 'gen_audio.ps1');
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(tempPs, psScript, 'utf8');
  console.log('PS script written, running...');

  // 使用 PowerShell 执行
  const { execSync } = require('child_process');
  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs}"`, {
      cwd: process.cwd(),
      timeout: 300000,
      stdio: 'inherit'
    });
  } finally {
    // 更新数据库
    for (const q of questions) {
      const filename = `listening_${q.id}_sapi.wav`;
      const filepath = path.join(audioDir, filename);
      if (fs.existsSync(filepath)) {
        const stat = fs.statSync(filepath);
        if (stat.size > 2000) {
          try {
            await pool.query(
              "UPDATE questions SET audio_url = $1 WHERE id = $2",
              [`/uploads/audio/${filename}`, q.id]
            );
          } catch (e) {
            console.error(`DB error for ${q.id}:`, e.message);
          }
        }
      }
    }
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
