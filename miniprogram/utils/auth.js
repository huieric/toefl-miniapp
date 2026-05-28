// utils/auth.js - 认证管理工具

const TOKEN_KEY = 'token';
const USER_INFO_KEY = 'userInfo';

/**
 * 获取存储的 Token
 */
const getToken = () => wx.getStorageSync(TOKEN_KEY) || '';

/**
 * 存储 Token
 */
const setToken = (token) => wx.setStorageSync(TOKEN_KEY, token);

/**
 * 清除 Token
 */
const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_INFO_KEY);
};

/**
 * 检查是否已登录
 */
const isLoggedIn = () => !!getToken();

/**
 * 获取用户信息
 */
const getUserInfo = () => wx.getStorageSync(USER_INFO_KEY) || null;

/**
 * 存储用户信息
 */
const setUserInfo = (info) => wx.setStorageSync(USER_INFO_KEY, info);

/**
 * 微信登录 - 获取 code 并调用后端接口换取 token
 * @returns {Promise<{token: string, userInfo: object}>}
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error('wx.login 失败'));
          return;
        }
        // 调用后端接口换取 token
        wx.request({
          url: 'http://localhost:3000/api/auth/login',
          method: 'POST',
          data: { code: res.code },
          header: { 'Content-Type': 'application/json' },
          success: (apiRes) => {
            if (apiRes.statusCode === 200 && apiRes.data.data) {
              const { token, user } = apiRes.data.data;
              setToken(token);
              if (user) setUserInfo(user);
              resolve({ token, userInfo: user });
            } else {
              reject(new Error(apiRes.data.message || '登录失败'));
            }
          },
          fail: reject,
        });
      },
      fail: reject,
    });
  });
};

module.exports = {
  getToken,
  setToken,
  clearToken,
  isLoggedIn,
  getUserInfo,
  setUserInfo,
  wxLogin,
};