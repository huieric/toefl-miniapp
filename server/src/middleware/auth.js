const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      openid: decoded.openid,
      nickname: decoded.nickname,
      avatarUrl: decoded.avatarUrl,
      membership: decoded.membership,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '令牌已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: '无效的认证令牌' });
  }
}

async function adminAuth(req, res, next) {
  // 先进行 JWT 认证
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      openid: decoded.openid,
      nickname: decoded.nickname,
      avatarUrl: decoded.avatarUrl,
      membership: decoded.membership,
      isAdmin: decoded.isAdmin,
      adminRole: decoded.adminRole,
    };

    // 检查是否标记为管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ code: 403, message: '需要管理员权限' });
    }

    // 可选：从数据库验证管理员身份
    try {
      const db = require('../config/db');
      const adminUser = (await db.query(
        'SELECT id, role FROM admin_users WHERE id = $1',
        [decoded.adminId]
      )).rows[0];
      if (!adminUser) {
        return res.status(403).json({ code: 403, message: '管理员账号无效' });
      }
      req.adminUser = adminUser;
    } catch (dbErr) {
      // 数据库不可用时降级：信任 JWT 中的标记
      console.warn('[Auth] 管理员数据库验证跳过:', dbErr.message);
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '令牌已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: '无效的认证令牌' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      openid: decoded.openid,
      nickname: decoded.nickname,
      avatarUrl: decoded.avatarUrl,
      membership: decoded.membership,
    };
  } catch (err) {
    // 忽略解析错误
  }
  next();
}

module.exports = { auth, adminAuth, optionalAuth };