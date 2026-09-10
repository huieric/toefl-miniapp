const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputDir = 'D:\\TapTap游戏赛道调研\\toefl-miniapp\\uploads\\audio';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputFile = path.join(outputDir, 'test_sapi.wav');
const text = "Professor: Today we're going to explore one of the most fascinating examples of animal communication in the natural world.";

console.log('Testing Windows SAPI TTS...');

try {
  const cmd = `powershell -Command "& { Add-Type -AssemblyName System.Speech; \$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; \$s.SelectVoice('Microsoft Zira Desktop'); \$s.SetOutputToWaveFile('${outputFile}'); \$s.Speak('This is a test sentence for Windows speech synthesis API.'); }"`;
  console.log('Running:', cmd.substring(0, 80));
  const result = execSync(cmd, { timeout: 15000, encoding: 'utf8' });
  console.log('Output:', result);
  
  if (fs.existsSync(outputFile)) {
    const stat = fs.statSync(outputFile);
    console.log(`✅ 文件已生成: ${(stat.size/1024).toFixed(1)}KB`);
  } else {
    console.log('❌ 文件未生成');
  }
} catch (e) {
  console.error('❌ 错误:', e.message);
}
