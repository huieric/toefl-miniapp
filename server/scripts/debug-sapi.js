const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP = path.join(__dirname, '..', 'temp');
const AUDIO = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

const text = `[Librarian]: What can I help you with today?
[Student]: Hi, I'd like to return this book about American history.
[Librarian]: Let me check. Yes, I see it here.`;

const textFile = path.join(TEMP, 'tts_debug.txt');
const outputFile = path.join(AUDIO, 'tts_debug.wav');

fs.writeFileSync(textFile, text);
console.log('Text written, size:', fs.statSync(textFile).size);

// Write PS script to file and execute it
const psFile = path.join(TEMP, 'tts_debug.ps1');
const psScript = `
Add-Type -AssemblyName System.Speech
$text = [System.IO.File]::ReadAllText('${textFile.replace(/\\/g, '\\\\')}')
Write-Host "Read ${text.length} chars"
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft David Desktop')
$s.SetOutputToWaveFile('${outputFile.replace(/\\/g, '\\\\')}')
$s.Speak($text)
$s.Dispose()
Write-Host "Done, file exists: $(Test-Path '${outputFile.replace(/\\/g, '\\\\')}')"
`;

fs.writeFileSync(psFile, psScript, 'utf8');

try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, {
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('Exists:', fs.existsSync(outputFile));
  if (fs.existsSync(outputFile)) {
    console.log('Size:', fs.statSync(outputFile).size);
  }
} catch (e) {
  console.error('Error:', e.message);
}
