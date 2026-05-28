// pages/writing/result.js
Page({
  data: {
    loaded: false,
    result: { score: 0, feedback: '', suggestions: [], highlights: [] },
    dimensions: [],
  },
  onLoad(options) {
    // 模拟AI评分结果
    setTimeout(() => {
      this.setData({
        loaded: true,
        result: {
          score: 23,
          feedback: '文章结构清晰，论点展开比较充分。语法准确性不错，但词汇可以更丰富，建议多使用学术词汇和复杂句式。',
          suggestions: ['建议增加对反对意见的反驳来增强说服力', '尝试使用更多连接词增强文章逻辑性', '注意段落之间的过渡自然'],
          highlights: ['开头段hook句子有吸引力', '主体段落搭配了具体例证'],
        },
        dimensions: [
          { label: '内容发展', score: 23 },
          { label: '文章组织', score: 24 },
          { label: '语言运用', score: 22 },
          { label: '技术规范', score: 24 },
        ],
      });
    }, 500);
  },
  goBack() { wx.navigateBack(); },
});