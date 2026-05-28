// components/timer/timer.js
Component({
  properties: {
    duration: { type: Number, value: 30 }, // 分钟
  },
  data: { display: '30:00', urgent: false, remaining: 1800 },
  timer: null,

  lifetimes: {
    attached() { this.start(); },
    detached() { this.clear(); },
  },

  methods: {
    start() {
      const total = this.properties.duration * 60;
      this.setData({ remaining: total });
      this.tick();
    },
    tick() {
      this.clear();
      this.timer = setInterval(() => {
        let r = this.data.remaining - 1;
        if (r <= 0) {
          r = 0; this.clear(); this.triggerEvent('timeout');
        }
        const m = Math.floor(r / 60);
        const s = r % 60;
        this.setData({
          remaining: r,
          display: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
          urgent: r <= 60,
        });
      }, 1000);
    },
    clear() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
  },
});