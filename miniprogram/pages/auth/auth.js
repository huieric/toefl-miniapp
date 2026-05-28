// pages/auth/auth.js
const app = getApp();

Page({
  data: {
    loading: false,
  },

  async handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      await app.wxLogin();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 500);
    } catch (err) {
      console.error('[Auth] 登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});