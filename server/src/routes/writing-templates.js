const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET /api/writing-templates/categories - 获取模板分类
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = [
      { id: 'independent', name: '独立写作', icon: '📝', count: 8, description: 'TOEFL Writing Task 1 模板' },
      { id: 'integrated', name: '综合写作', icon: '📖', count: 6, description: 'TOEFL Writing Task 2 模板' },
      { id: 'academic', name: '学术写作', icon: '🎓', count: 5, description: '通用学术写作技巧' },
    ];

    res.json({
      code: 200,
      data: { categories },
    });
  } catch (err) {
    console.error('[WritingTemplates] Categories Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/writing-templates/list - 获取模板列表
router.get('/list', auth, async (req, res) => {
  try {
    const { category } = req.query;
    
    const allTemplates = [
      {
        id: 1,
        categoryId: 'independent',
        title: '议论文经典五段式',
        description: '适用于大多数独立写作题目',
        difficulty: 'beginner',
        usage: '适用于观点选择类、建议类、同意与否同类题目',
        structure: [
          'Introduction: 背景引入 + 明确立场',
          'Body 1: 第一个理由 + 具体例子',
          'Body 2: 第二个理由 + 具体例子',
          'Body 3: 第三个理由/让步段',
          'Conclusion: 重申立场 + 总结要点',
        ],
        openingPhrases: [
          'In today\'s society, the issue of...has become increasingly debated.',
          'Whether...is a topic that warrants careful consideration.',
        ],
        bodyPhrases: [
          'First and foremost, ...',
          'Another compelling reason is that...',
          'Furthermore, ...',
        ],
        closingPhrases: [
          'In conclusion, I firmly believe that...',
          'To summarize, the evidence clearly supports...',
        ],
        sampleWordCount: 300,
      },
      {
        id: 2,
        categoryId: 'integrated',
        title: '综合写作标准框架',
        description: '阅读听力对比结构',
        difficulty: 'intermediate',
        usage: '适用于综合写作 Task 2',
        structure: [
          'Introduction: 阅读立场 + 听力态度',
          'Body 1: 第一个对比点',
          'Body 2: 第二个对比点',
          'Body 3: 第三个对比点',
          'Conclusion: 总结听力反驳',
        ],
        openingPhrases: [
          'The reading passage argues that..., while the lecture challenges this view.',
          'While the author claims..., the lecturer disputes this assertion.',
        ],
        bodyPhrases: [
          'The professor counters this point by suggesting that...',
          'According to the lecture, however, ...',
          'The lecturer refutes the reading\'s claim by providing evidence that...',
        ],
        closingPhrases: [
          'Thus, the lecture effectively undermines the reading\'s argument.',
          'Overall, the professor\'s points cast serious doubt on the reading.',
        ],
        sampleWordCount: 250,
      },
      {
        id: 3,
        categoryId: 'independent',
        title: '对比类写作模板',
        description: '比较两个选项/观点',
        difficulty: 'beginner',
        usage: '适用于比较选择类题目',
        structure: [
          'Introduction: 背景 + 表明偏好',
          'Body 1: 偏好选项的第一个优势',
          'Body 2: 偏好选项的第二个优势',
          'Body 3: 另一个选项的劣势',
          'Conclusion: 重申偏好 + 总结',
        ],
        openingPhrases: [
          'When it comes to choosing between...and..., I would definitely prefer...',
          'Both options have merit, but I believe that...is the better choice.',
        ],
        bodyPhrases: [
          'The primary advantage of...is that...',
          'In contrast, ...has significant drawbacks.',
          'Moreover, ...offers the added benefit of...',
        ],
        closingPhrases: [
          'Therefore, I maintain that...is the superior option.',
          'Given these considerations, ...clearly stands out.',
        ],
        sampleWordCount: 280,
      },
    ];

    const templates = category 
      ? allTemplates.filter(t => t.categoryId === category)
      : allTemplates;

    res.json({
      code: 200,
      data: { templates },
    });
  } catch (err) {
    console.error('[WritingTemplates] List Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/writing-templates/:id - 获取模板详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    // 返回模拟模板详情
    const template = {
      id: parseInt(id),
      title: 'TOEFL 写作模板示例',
      content: 'This is a sample template content...',
    };

    res.json({
      code: 200,
      data: template,
    });
  } catch (err) {
    console.error('[WritingTemplates] Detail Error:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
