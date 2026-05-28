// components/answer-card/answer-card.js
Component({
  properties: {
    options: { type: Array, value: [] },
    answer: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    showAnswer: { type: Boolean, value: false },
  },
  data: { selected: '' },
  methods: {
    onTap(e) {
      if (this.properties.disabled || this.properties.showAnswer) return;
      const label = e.currentTarget.dataset.label;
      this.setData({ selected: label });
      this.triggerEvent('select', label);
    },
  },
});