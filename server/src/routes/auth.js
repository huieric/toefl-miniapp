const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const db = require('../config/db');

const router = express.Router();

// 内存验证码存储（phone → {code, expires}）
const codeStore = new Map();

// 生成6位验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of codeStore) {
    if (data.expires < now) codeStore.delete(phone);
  }
}, 60000);

// POST /api/auth/send-code - 发送验证码（开发环境直接返回码）
router.post('/send-code', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ code: 400, message: '手机号格式不正确' });
  }

  // 开发环境生成随机码，生产环境用固定码（无真实短信服务）
  const code = config.nodeEnv === 'production' ? '123456' : generateCode();
  codeStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });

  if (config.nodeEnv !== 'production') {
    console.log(`[验证码] ${phone} → ${code}`);
  }

  res.json({ code: 200, message: '验证码已发送' });
});

// POST /api/auth/login - 手机验证码 / 微信 code 登录
router.post('/login', async (req, res) => {
  try {
    const { phone, code, nickname, avatarUrl } = req.body;

    // --- 手机验证码登录 ---
    if (phone && code) {
      const stored = codeStore.get(phone);
      if (!stored || stored.expires < Date.now()) {
        return res.status(400).json({ code: 400, message: '验证码已过期，请重新获取' });
      }
      if (stored.code !== code) {
        return res.status(400).json({ code: 400, message: '验证码错误' });
      }
      codeStore.delete(phone);

      const openid = 'phone_' + phone;
      let user = (await db.query('SELECT * FROM users WHERE openid = $1', [openid])).rows[0];

      if (user) {
        await db.query(
          'UPDATE users SET nickname = COALESCE($2, nickname), last_login_at = CURRENT_TIMESTAMP WHERE openid = $1',
          [openid, nickname || phone]
        );
      } else {
        const result = await db.query(
          'INSERT INTO users (openid, nickname) VALUES ($1, $2) RETURNING *',
          [openid, nickname || phone]
        );
        user = result.rows[0];
        await db.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);
      }

      const token = jwt.sign(
        { id: user.id, openid: user.openid, nickname: user.nickname, avatarUrl: user.avatar_url, membership: user.membership },
        config.jwtSecret,
        { expiresIn: '30d' }
      );

      return res.json({
        code: 200,
        data: {
          token,
          user: { id: user.id, nickname: user.nickname, targetScore: user.target_score, examDate: user.exam_date, membership: user.membership || 'free' },
          isNewUser: !user.last_login_at || user.created_at.getTime() === user.last_login_at.getTime(),
        },
      });
    }

    // --- 微信 code 登录 ---
    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    let openid, unionid;
    try {
      const wxResp = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wechatAppid,
          secret: config.wechatSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      });
      const wxData = wxResp.data;
      if (wxData.errcode) {
        console.error('[微信登录失败]', wxData);
        return res.status(400).json({ code: 400, message: '微信登录失败: ' + wxData.errmsg });
      }
      openid = wxData.openid;
      unionid = wxData.unionid || null;
    } catch (err) {
      console.error('[微信接口调用失败]', err.message);
      return res.status(502).json({ code: 502, message: '微信服务暂不可用' });
    }

    let user = (await db.query('SELECT * FROM users WHERE openid = $1', [openid])).rows[0];
    if (user) {
      await db.query(
        'UPDATE users SET nickname = COALESCE($2, nickname), avatar_url = COALESCE($3, avatar_url), last_login_at = CURRENT_TIMESTAMP WHERE openid = $1',
        [openid, nickname, avatarUrl]
      );
      user.nickname = nickname || user.nickname;
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const result = await db.query(
        'INSERT INTO users (openid, unionid, nickname, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [openid, unionid, nickname || '托福考生', avatarUrl || '']
      );
      user = result.rows[0];
      await db.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);
    }

    const token = jwt.sign(
      { id: user.id, openid: user.openid, nickname: user.nickname, avatarUrl: user.avatar_url, membership: user.membership },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      code: 200,
      data: {
        token,
        user: { id: user.id, nickname: user.nickname, avatarUrl: user.avatar_url, targetScore: user.target_score, examDate: user.exam_date, membership: user.membership || 'free' },
        isNewUser: !user.last_login_at,
      },
    });
  } catch (err) {
    console.error('[Auth] 登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;