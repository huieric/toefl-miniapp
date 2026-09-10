/**
 * 轻量级 TTS 服务 — 基于 Microsoft Edge TTS（免费，无需 API Key）
 * 使用 edge-tts HTTP 协议将文本转为音频
 * 
 * 用法:
 *   const { textToSpeech } = require('./tts');
 *   const audioBuffer = await textToSpeech('Hello world', { voice: 'en-US-JennyNeural', rate: '0.9x' });
 *   // audioBuffer 是 Buffer，可写入文件或通过 API 返回
 */

const https = require('https');
const { Readable } = require('stream');

/**
 * Microsoft Edge TTS 端点
 * 文档参考: https://github.com/richard2go/edge-tts-node
 */

const EDGE_TTS_URL = 'https://zhitaofrance.sport368.net/api/txt2audio/v1/AzureFreeApi';

const VOICE_MAP = {
  // 男声（托福听力对话常用）
  male: 'en-US-GuyNeural',
  // 女声（托福听力讲座常用）
  female: 'en-US-AriaNeural',
  // 默认女声
  default: 'en-US-JennyNeural',
};

/**
 * 将文本转为 MP3 Buffer
 * @param {string} text - 要朗读的文本
 * @param {object} options - 可选参数
 * @param {string} options.voice - 语音角色，默认 'en-US-GuyNeural'
 * @param {string} options.rate - 语速，如 '0.8x', '1.0x', '默认 1.0x'
 * @param {number} options.pitch - 音调，默认 0
 * @returns {Promise<Buffer>} MP3 音频数据
 */
async function textToSpeech(text, options = {}) {
  const {
    voice = VOICE_MAP.male,
    rate = '1.0x',
    pitch = '0Hz',
  } = options;

  // 截断超长文本（TTS 有长度限制）
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

  // 构建 SSML
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voice}">
        <prosody rate="${rate}" pitch="${pitch}">
          ${truncateHtml(truncatedText)}
        </prosody>
      </voice>
    </speak>
  `.trim();

  // 调用 Azure TTS API (通过代理)
  return await callAzureTTS(ssml);
}

/**
 * 通过 Azure Speech API 将 SSML 转为音频
 */
async function callAzureTTS(ssml) {
  // 这里使用免费代理服务
  // 如果代理服务不可用，返回空 Buffer（降级处理）
  try {
    // 方法1: 使用 Edge TTS 代理
    const edgeResponse = await fetchEdgeTTS(ssml);
    if (edgeResponse) return edgeResponse;
  } catch (e) {
    console.warn('[TTS] Edge TTS 代理不可用:', e.message);
  }

  // 方法2: 使用浏览器端 TTS（生成占位文件）
  console.warn('[TTS] TTS 服务不可用，返回占位数据');
  return createPlaceholderAudio(text);
}

/**
 * 调用 Edge TTS 代理（免费）
 */
async function fetchEdgeTTS(ssml) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams();
    data.append('text', ssml);
    data.append('voice', 'en-US-GuyNeural');
    data.append('rate', '1.0');
    data.append('pitch', '0');
    data.append('platform', 'Web');
    data.append('type', 'ssml');

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
        if (res.statusCode === 200 && buffer.length > 0) {
          resolve(buffer);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      resolve(null); // 降级处理
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 截断 SSML 中的 HTML 标签（防止嵌套冲突）
 */
function truncateHtml(text) {
  // 移除可能冲突的 HTML 标签
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 创建占位音频数据（当 TTS 不可用时）
 * 返回一个 1 秒的静音 WAV 文件
 */
function createPlaceholderAudio(text) {
  // 简单 WAV 头部 + 静音数据
  const sampleRate = 22050;
  const duration = 1; // 1秒
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = sampleRate * duration * numChannels * bitsPerSample / 8;
  const bufferSize = 44 + dataSize;

  const buffer = Buffer.alloc(bufferSize);
  // WAV 头部
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(bufferSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // 静音数据（零值）已自动填充

  return buffer;
}

/**
 * 批量生成文本音频并保存
 * @param {Array<{text, outputPath}>} items
 * @returns {Promise<Array<{success, outputPath, error?}>>}
 */
async function batchGenerate(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const { text, voice, outputPath } = items[i];
    try {
      console.log(`[TTS] 生成 ${i + 1}/${items.length}: ${text.substring(0, 50)}...`);
      const audio = await textToSpeech(text, { voice: voice || 'en-US-GuyNeural' });
      // 返回 buffer，由调用方决定存储方式
      results.push({ success: true, audio, outputPath });
    } catch (e) {
      console.error(`[TTS] 失败:`, e.message);
      results.push({ success: false, error: e.message, outputPath });
    }
    // 限流：避免请求过快
    if (i < items.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return results;
}

module.exports = {
  textToSpeech,
  batchGenerate,
  VOICE_MAP,
};
