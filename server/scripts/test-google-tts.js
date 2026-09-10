const { getAudioUrl } = require('google-tts-api');
const https = require('https');
const fs = require('fs');

// 生成音频
const url = getAudioUrl('Hello world this is a test of text to speech.', {lang:'en-US', slow:true});
console.log('Google TTS URL:', url.substring(0, 120));

// 下载音频
const req = https.get(url, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log('Audio size:', buf.length, 'bytes');
    fs.writeFileSync('test-audio.mp3', buf);
    console.log('Saved to test-audio.mp3');
    process.exit(0);
  });
});
req.on('error', e => { console.error('Download error:', e.message); process.exit(1); });
req.end();
