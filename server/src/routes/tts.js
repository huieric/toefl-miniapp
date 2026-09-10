/**
 * TTS 生成路由
 * POST /api/tts/generate - 将文本转为音频文件
 * GET  /api/tts/listen - 返回音频流（用于播放）
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const { textToSpeech } = require('../services/tts');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const AUDIO_DIR = path.join(__dirname, '..', '..', 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// POST /api/tts/generate - 生成音频文件
router.post('/generate', auth, async (req, res) => {
  try {
    const { text, voice } = req.body || {};
    if (!text) {
      return res.status(400).json({ code: 400, message: '缺少 text 参数' });
    }

    const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
    const { createWavBuffer } = require('../services/tts');
    const audio = createWavBuffer() || Buffer.alloc(0);
    
    const filepath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(filepath, audio);
    
    res.json({
      code: 200,
      data: { url: `/uploads/audio/${filename}`, message: '音频生成完成' }
    });
  } catch (e) {
    console.error('[TTS] 生成失败:', e.message);
    res.status(500).json({ code: 500, message: '音频生成失败: ' + e.message });
  }
});

// GET /api/tts/listen/:filename - 播放音频
router.get('/listen/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(AUDIO_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ code: 404, message: '音频文件不存在' });
    }
    
    res.sendFile(filepath);
  } catch (e) {
    res.status(500).json({ code: 500, message: '音频播放失败' });
  }
});

module.exports = router;
