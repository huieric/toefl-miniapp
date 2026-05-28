const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/db');

const router = express.Router();

// 开发环境内存验证码存储
const codeStore = new Map();

// POST /api/auth/send-code - 发送手机验证码
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 400, message: '请输入正确的手机号' });
    }

    // 生成验证码：生产环境用固定码 123456，开发环境随机生成
    const code = config.nodeEnv === 'production'
      ? '123456'
      : String(Math.floor(100000 + Math.random() * 900000));

    // 存入 codeStore，5 分钟过期
    codeStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}${config.nodeEnv === 'production' ? ' (生产环境固定码)' : ''}`);

    res.json({ code: 200, message: '验证码已发送' });
  } catch (err) {
    console.error('[SendCode] 发送验证码失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/auth/login - 微信code登录 / 手机验证码登录
router.post('/login', async (req, res) => {
  try {
    const { code, phone, nickname, avatarUrl } = req.body;

    // === 手机验证码登录（code 为 6 位数字） ===
    if (phone && code && /^\d{6}$/.test(code)) {
      const stored = codeStore.get(phone);
      if (!stored || stored.expiresAt < Date.now()) {
        codeStore.delete(phone);
        return res.status(400).json({ code: 400, message: '验证码已过期，请重新获取' });
      }
      if (stored.code !== code) {
        return res.status(400).json({ code: 400, message: '验证码错误' });
      }

      // 验证通过，删除已使用的验证码
      codeStore.delete(phone);

      // 用 phone 生成唯一 openid
      const openid = 'phone_' + phone;

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
          [openid, null, nickname || '托福考生', avatarUrl || '']
        );
        user = result.rows[0];

        await db.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);
      }

      const token = jwt.sign(
        {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
        },
        config.jwtSecret,
        { expiresIn: '30d' }
      );

      return res.json({
        code: 200,
        data: {
          token,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatarUrl: user.avatar_url,
            targetScore: user.target_score,
            examDate: user.exam_date,
          },
          isNewUser: !user.last_login_at,
        },
      });
    }

    // === 微信 code 登录（code 非纯6位数字） ===
    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少code参数' });
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
      {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          targetScore: user.target_score,
          examDate: user.exam_date,
        },
        isNewUser: !user.last_login_at,
      },
    });
  } catch (err) {
    console.error('[Auth] 登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;