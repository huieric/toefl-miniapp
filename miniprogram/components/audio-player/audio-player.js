// components/audio-player/audio-player.js
Component({
  properties: {
    src: { type: String, value: '' },
  },
  data: {
    playing: false, progress: 0,
    currentTimeStr: '0:00', durationStr: '0:00',
    speed: 1,
  },
  audio: null,

  observers: { 'src': function (src) { if (src) this.initAudio(); } },

  lifetimes: {
    detached() { if (this.audio) { this.audio.stop(); this.audio.destroy(); } },
  },

  methods: {
    initAudio() {
      if (this.audio) this.audio.destroy();
      this.audio = wx.createInnerAudioContext();
      this.audio.src = this.properties.src;
      this.audio.onTimeUpdate(() => {
        const p = this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0;
        this.setData({
          progress: p,
          currentTimeStr: this.formatTime(this.audio.currentTime),
          durationStr: this.formatTime(this.audio.duration),
        });
      });
      this.audio.onEnded(() => this.setData({ playing: false, progress: 0 }));
    },
    togglePlay() {
      if (!this.audio) this.initAudio();
      if (this.data.playing) { this.audio.pause(); this.setData({ playing: false }); }
      else { this.audio.play(); this.setData({ playing: true }); }
    },
    toggleSpeed() {
      const speeds = [1, 1.25, 1.5, 2];
      const idx = speeds.indexOf(this.data.speed);
      const next = speeds[(idx + 1) % speeds.length];
      this.setData({ speed: next });
      if (this.audio) this.audio.playbackRate = next;
    },
    formatTime(s) {
      if (!s || isNaN(s)) return '0:00';
      const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
      return `${m}:${String(sec).padStart(2,'0')}`;
    },
  },
});