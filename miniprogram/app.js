// app.js - 小程序入口
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api',
    isLoggedIn: false,
    membership: 'free', // 'free' | 'premium'
  },

  onLaunch() {
    // 从本地存储读取token
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token) {
      this.globalData.token = token;
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
    }

    // 自动登录（静默）
    this.autoLogin();
  },

  // 自动登录：用缓存的code尝试登录
  autoLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          this.loginWithCode(res.code);
        }
      },
    });
  },

  // 用微信code换取后端token
  loginWithCode(code, nickname, avatarUrl) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/login`,
      method: 'POST',
      data: { code, nickname, avatarUrl },
      success: (res) => {
        if (res.data.code === 200) {
          const { token, user } = res.data.data;
          this.globalData.token = token;
          this.globalData.isLoggedIn = true;
          this.globalData.userInfo = user;
          this.globalData.membership = (user && user.membership) || 'free';
          wx.setStorageSync('token', token);
          wx.setStorageSync('userInfo', user);
        }
      },
      fail: () => {
        console.log('[App] 登录请求失败');
      },
    });
  },

  // 微信一键登录（用户主动触发）
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (profileRes) => {
          const { nickName, avatarUrl } = profileRes.userInfo;
          wx.login({
            success: (loginRes) => {
              if (loginRes.code) {
                this.loginWithCode(loginRes.code, nickName, avatarUrl);
                resolve({ nickName, avatarUrl });
              } else {
                reject(new Error('获取code失败'));
              }
            },
            fail: reject,
          });
        },
        fail: reject,
      });
    });
  },

  // 退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },
});