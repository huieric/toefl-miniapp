const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const audioDir = path.join(process.cwd(), 'uploads', 'audio');
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

function sanitizeText(text) {
  // Remove brackets, colons, special chars that break PowerShell
  return text
    .replace(/\[.*?\]:/g, '$1')  // Remove [Speaker]: prefixes
    .replace(/'/g, "'")           // Keep apostrophes
    .replace(/\n/g, ' ')         // Newlines to spaces
    .replace(/\r/g, ' ')         // Carriage returns
    .replace(/ +/g, ' ')         // Multiple spaces
    .trim()
    .substring(0, 2000);         // Limit length
}

async function generateOne(q, voice) {
  const text = sanitizeText(q.passage_text || q.content || `Question ${q.id}`);
  if (text.length < 5) return { success: false, reason: 'text too short' };
  
  const filename = `listening_${q.id}_sapi.wav`;
  const filepath = path.join(audioDir, filename);
  const textFile = path.join(tempDir, `tts_${q.id}.txt`);
  
  fs.writeFileSync(textFile, text, 'utf8');
  
  // Use PowerShell here-string to avoid escaping issues
  const psScript = [
    `$text = Get-Content '${textFile}' -Raw -Encoding UTF8`,
    `$s = New-Object System.Speech.Synthesis.SpeechSynthesizer`,
    `$s.SelectVoice('${voice}')`,
    `$s.SetOutputToWaveFile('${filepath}')`,
    `$s.Speak($text)`,
    `$s.Dispose()`,
    `Remove-Item '${textFile}' -ErrorAction SilentlyContinue`,
  ].join(';');
  
  try {
    execSync(`powershell -Command "${psScript.replace(/"/g, '"')}"`, {
      timeout: 30000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (fs.existsSync(filepath)) {
      const stat = fs.statSync(filepath);
      if (stat.size > 2000) {
        return { success: true, size: stat.size };
      }
    }
    return { success: false, reason: 'no output file' };
  } catch (e) {
    return { success: false, reason: e.message.split('\n')[0] };
  }
}

async function main() {
  const res = await pool.query(
    "SELECT id, title, type, content, passage_text FROM questions WHERE subject = 'listening' AND status = 'approved' ORDER BY id"
  );
  const questions = res.rows;
  
  console.log(`Generating audio for ${questions.length} questions\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const voice = q.type === 'conversation' ? 'Microsoft David Desktop' : 'Microsoft Zira Desktop';
    
    console.log(`[${i+1}/${questions.length}] #${q.id} [${q.type}]`);
    
    const result = await generateOne(q, voice);
    
    if (result.success) {
      console.log(`  ✅ ${(result.size/1024).toFixed(1)}KB`);
      
      // Update DB
      const filename = `listening_${q.id}_sapi.wav`;
      await pool.query(
        "UPDATE questions SET audio_url = $1 WHERE id = $2",
        [`/uploads/audio/${filename}`, q.id]
      ).catch(e => console.error('  DB error:', e.message));
      
      success++;
    } else {
      console.log(`  ❌ ${result.reason}`);
      failed++;
    }
    
    if (i < questions.length - 1) await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);
  
  const stats = await pool.query(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE audio_url IS NOT NULL AND audio_url != '') as withAudio FROM questions WHERE subject = 'listening'"
  );
  console.log(`\nListening audio: ${stats.rows[0].withaudio}/${stats.rows[0].total}`);
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
