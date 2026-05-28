// components/ad-banner/ad-banner.js
const api = require('../../utils/api');
const membership = require('../../utils/membership');

Component({
  properties: {
    // 广告位置：home / practice-done / wrong-book
    placement: {
      type: String,
      value: 'home',
    },
    // 广告ID（可选，不传则自动获取）
    adId: {
      type: String,
      value: '',
    },
  },

  data: {
    ad: null,       // 广告内容 { imageUrl, title, targetUrl }
    loading: true,
    hidden: false,   // 会员用户不展示广告
  },

  lifetimes: {
    attached() {
      this.checkAndLoad();
    },
  },

  methods: {
    // 检查会员状态并加载广告
    checkAndLoad() {
      const isPremium = membership.getMembership() === 'premium';
      if (isPremium) {
        this.setData({ hidden: true, loading: false });
        return;
      }
      this.loadAd();
    },

    // 加载广告内容
    async loadAd() {
      try {
        const res = await api.getAdBanner(this.data.placement);
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({ ad: res.data.data, loading: false });
          // 记录展示
          this.recordImpression();
        } else {
          // 后端无数据，使用本地占位广告
          this.useFallbackAd();
        }
      } catch (err) {
        this.useFallbackAd();
      }
    },

    // 使用本地占位广告（后端不可用时）
    useFallbackAd() {
      const fallbackAds = {
        home: { imageUrl: '/assets/ad-placeholder.png', title: '托福VIP会员 - 解锁全部功能', targetUrl: '/pages/membership/index' },
        'practice-done': { imageUrl: '/assets/ad-placeholder.png', title: '查看解析报告，升级VIP更详细', targetUrl: '/pages/membership/index' },
        'wrong-book': { imageUrl: '/assets/ad-placeholder.png', title: '智能错题复习，VIP专享', targetUrl: '/pages/membership/index' },
      };
      this.setData({
        ad: fallbackAds[this.data.placement] || fallbackAds.home,
        loading: false,
      });
    },

    // 记录广告展示到后端
    recordImpression() {
      const { ad, placement } = this.data;
      if (!ad) return;
      const adId = this.data.adId || ad.id || 'fallback';
      api.recordAdImpression(placement, adId).catch(() => {});
    },

    // 点击广告
    onTap() {
      const { ad } = this.data;
      if (!ad) return;
      this.triggerEvent('tap', { placement: this.data.placement, ad });
      // 默认行为：跳转到会员页
      if (ad.targetUrl) {
        if (ad.targetUrl.startsWith('/pages/')) {
          wx.navigateTo({ url: ad.targetUrl }).catch(() => {});
        } else {
          wx.previewImage({ urls: [ad.imageUrl] });
        }
      }
    },
  },
});
