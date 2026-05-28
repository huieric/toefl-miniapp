// components/score-radar/score-radar.js
Component({
  properties: {
    scores: { type: Array, value: [22, 24, 20, 21] },
    labels: { type: Array, value: ['阅读', '听力', '口语', '写作'] },
  },
  data: {},
  canvas: null,
  ctx: null,
  width: 0, height: 0,

  lifetimes: {
    ready() { this.initCanvas(); },
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#radarCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        this.width = res[0].width;
        this.height = res[0].height;
        canvas.width = this.width * dpr;
        canvas.height = this.height * dpr;
        ctx.scale(dpr, dpr);
        this.ctx = ctx;
        this.draw();
      });
    },

    draw() {
      const { ctx, width, height } = this;
      if (!ctx) return;
      const { scores, labels } = this.properties;
      const cx = width / 2, cy = height / 2;
      const maxR = Math.min(cx, cy) - 40;
      const count = labels.length;
      const maxScore = 30;

      ctx.clearRect(0, 0, width, height);

      // 绘制网格
      for (let level = 1; level <= 4; level++) {
        const r = maxR * (level / 4);
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fafafa';
        if (level === 4) ctx.fill();
      }

      // 绘制轴线
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = '#e8e8e8';
        ctx.stroke();

        // 标签
        const lx = cx + (maxR + 30) * Math.cos(angle);
        const ly = cy + (maxR + 30) * Math.sin(angle);
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], lx, ly);
      }

      // 绘制数据多边形
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const r = maxR * (scores[i] / maxScore);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(74,144,217,0.2)';
      ctx.fill();
      ctx.strokeStyle = '#4A90D9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制数据点
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const r = maxR * (scores[i] / maxScore);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4A90D9';
        ctx.fill();

        // 分值
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(scores[i], x, y - 14);
      }
    },
  },
});