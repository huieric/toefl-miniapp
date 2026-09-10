const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 使用绝对路径，不依赖当前目录
const workspace = 'D:\\TapTap游戏赛道调研';
const server = path.join(workspace, 'toefl-miniapp', 'server');
const temp = path.join(server, 'temp');
const audio = path.join(server, 'uploads', 'audio');

if (!fs.existsSync(temp)) fs.mkdirSync(temp, { recursive: true });
if (!fs.existsSync(audio)) fs.mkdirSync(audio, { recursive: true });

const text = `[Librarian]: What can I help you with today?
[Student]: Hi, I'd like to return this book about American history.
[Librarian]: Let me check. Yes, I see it here.`;

const textFile = path.join(temp, 'tts_test.txt');
const outputFile = path.join(audio, 'tts_test.wav');
const psFile = path.join(temp, 'tts_test.ps1');

fs.writeFileSync(textFile, text);

const psScript = [
  'Add-Type -AssemblyName System.Speech',
  `$text = [System.IO.File]::ReadAllText('${textFile}')`,
  `Write-Host "Read: $($text.Length) chars"`,
  '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  "$s.SelectVoice('Microsoft David Desktop')",
  `Write-Host "Voice selected"`,
  `$s.SetOutputToWaveFile('${outputFile}')`,
  `Write-Host "Output set"`,
  '$s.Speak($text)',
  `Write-Host "Spoken"`,
  '$s.Dispose()',
  `Write-Host "File: $(if (Test-Path '${outputFile}') { (Get-Item '${outputFile}').Length } else { 'NOT FOUND' })"`,
].join('\r\n');

fs.writeFileSync(psFile, psScript, 'utf8');
console.log('PS script written');

try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, {
    cwd: server,
    timeout: 15000,
    encoding: 'utf8'
  });
  console.log('Done');
  console.log('File exists:', fs.existsSync(outputFile));
  if (fs.existsSync(outputFile)) {
    console.log('Size:', fs.statSync(outputFile).size);
  }
} catch (e) {
  console.error('Error:', e.message);
}
