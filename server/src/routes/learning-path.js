const express = require('express');
const router = express.Router();

/**
 * Round 29: Learning Path (学习路径规划系统)
 * 
 * 功能：
 * 1. 个性化学习路径规划
 * 2. 技能树可视化
 * 3. 进度追踪
 * 4. 自适应推荐
 * 5. 目标导向学习
 */

// 技能树定义
const SKILL_TREE = {
  reading: {
    name: '阅读',
    icon: '📖',
    color: '#FF6B6B',
    skills: [
      {
        id: 'read-001',
        name: '主旨题',
        description: '掌握文章主旨和大意',
        level: 1,
        prerequisite: [],
        questions: 25,
        mastered: 18,
        status: 'in-progress',
      },
      {
        id: 'read-002',
        name: '细节题',
        description: '定位和提取具体信息',
        level: 1,
        prerequisite: [],
        questions: 30,
        mastered: 25,
        status: 'in-progress',
      },
      {
        id: 'read-003',
        name: '推理题',
        description: '基于文本进行合理推断',
        level: 2,
        prerequisite: ['read-001'],
        questions: 20,
        mastered: 12,
        status: 'learning',
      },
      {
        id: 'read-004',
        name: '词汇题',
        description: '根据上下文推断词义',
        level: 1,
        prerequisite: [],
        questions: 35,
        mastered: 28,
        status: 'in-progress',
      },
      {
        id: 'read-005',
        name: '句子简化',
        description: '理解长难句并简化',
        level: 2,
        prerequisite: ['read-001'],
        questions: 15,
        mastered: 8,
        status: 'learning',
      },
      {
        id: 'read-006',
        name: '句子插入',
        description: '找到合适的句子插入位置',
        level: 3,
        prerequisite: ['read-003'],
        questions: 10,
        mastered: 3,
        status: 'locked',
      },
      {
        id: 'read-007',
        name: '摘要题',
        description: '概括文章核心要点',
        level: 3,
        prerequisite: ['read-001', 'read-003'],
        questions: 12,
        mastered: 5,
        status: 'locked',
      },
      {
        id: 'read-008',
        name: '填空题',
        description: '完形填空能力',
        level: 3,
        prerequisite: ['read-004', 'read-005'],
        questions: 20,
        mastered: 8,
        status: 'locked',
      },
    ],
  },
  listening: {
    name: '听力',
    icon: '🎧',
    color: '#4ECDC4',
    skills: [
      {
        id: 'list-001',
        name: '主旨理解',
        description: '抓住讲座/对话主旨',
        level: 1,
        prerequisite: [],
        questions: 20,
        mastered: 15,
        status: 'in-progress',
      },
      {
        id: 'list-002',
        name: '细节捕捉',
        description: '准确捕捉关键细节',
        level: 1,
        prerequisite: [],
        questions: 25,
        mastered: 18,
        status: 'in-progress',
      },
      {
        id: 'list-003',
        name: '笔记技巧',
        description: '有效记录听力要点',
        level: 2,
        prerequisite: ['list-001'],
        questions: 30,
        mastered: 10,
        status: 'learning',
      },
      {
        id: 'list-004',
        name: '推断能力',
        description: '推断说话者意图',
        level: 2,
        prerequisite: ['list-001'],
        questions: 15,
        mastered: 7,
        status: 'learning',
      },
      {
        id: 'list-005',
        name: '分类题',
        description: '信息分类和配对',
        level: 3,
        prerequisite: ['list-002', 'list-003'],
        questions: 12,
        mastered: 4,
        status: 'locked',
      },
    ],
  },
  speaking: {
    name: '口语',
    icon: '🗣️',
    color: '#FFD93D',
    skills: [
      {
        id: 'speak-001',
        name: '独立表达',
        description: '清晰表达个人观点',
        level: 1,
        prerequisite: [],
        questions: 15,
        mastered: 10,
        status: 'in-progress',
      },
      {
        id: 'speak-002',
        name: '综合口语',
        description: '整合阅读和听力信息',
        level: 2,
        prerequisite: ['speak-001'],
        questions: 20,
        mastered: 8,
        status: 'learning',
      },
      {
        id: 'speak-003',
        name: '流利度',
        description: '自然流畅的表达',
        level: 2,
        prerequisite: ['speak-001'],
        questions: 0,
        mastered: 0,
        status: 'learning',
      },
      {
        id: 'speak-004',
        name: '发音',
        description: '清晰准确的发音',
        level: 3,
        prerequisite: ['speak-002'],
        questions: 0,
        mastered: 0,
        status: 'locked',
      },
    ],
  },
  writing: {
    name: '写作',
    icon: '✍️',
    color: '#6C5CE7',
    skills: [
      {
        id: 'write-001',
        name: '综合写作',
        description: '整合听力和阅读信息',
        level: 1,
        prerequisite: [],
        questions: 15,
        mastered: 10,
        status: 'in-progress',
      },
      {
        id: 'write-002',
        name: '独立写作',
        description: '独立论述观点',
        level: 2,
        prerequisite: ['write-001'],
        questions: 12,
        mastered: 5,
        status: 'learning',
      },
      {
        id: 'write-003',
        name: '结构组织',
        description: '文章结构清晰',
        level: 2,
        prerequisite: ['write-001'],
        questions: 0,
        mastered: 0,
        status: 'learning',
      },
      {
        id: 'write-004',
        name: '语法词汇',
        description: '语法准确、词汇丰富',
        level: 3,
        prerequisite: ['write-002'],
        questions: 0,
        mastered: 0,
        status: 'locked',
      },
    ],
  },
};

// 学习路径模板
const PATH_TEMPLATES = [
  {
    id: 'path-30',
    name: '30天冲刺TOEFL 30分',
    duration: 30,
    targetScore: 30,
    dailyHours: 3,
    difficulty: 'intensive',
    description: '高强度30天冲刺计划，适合基础较好的考生',
  },
  {
    id: 'path-60',
    name: '60天稳步提升',
    duration: 60,
    targetScore: 25,
    dailyHours: 2,
    difficulty: 'moderate',
    description: '中等强度60天计划，稳步提升各科能力',
  },
  {
    id: 'path-90',
    name: '90天全面准备',
    duration: 90,
    targetScore: 22,
    dailyHours: 1.5,
    difficulty: 'gentle',
    description: '轻松节奏90天计划，适合时间充裕的考生',
  },
  {
    id: 'path-custom',
    name: '自定义路径',
    duration: 0,
    targetScore: 0,
    dailyHours: 0,
    difficulty: 'custom',
    description: '根据您的需求定制学习路径',
  },
];

// 计算技能掌握度
function calculateSkillMastery(skill) {
  if (skill.questions === 0) {
    return skill.mastered > 0 ? 100 : 0;
  }
  return Math.round((skill.mastered / skill.questions) * 100);
}

// 获取用户学习进度
function getUserProgress() {
  const totalSkills = Object.values(SKILL_TREE).reduce((sum, section) => sum + section.skills.length, 0);
  const completedSkills = Object.values(SKILL_TREE).reduce((sum, section) => 
    sum + section.skills.filter(s => s.status === 'mastered').length, 0);
  
  const overallProgress = Math.round((completedSkills / totalSkills) * 100);

  const sectionProgress = {};
  for (const [section, data] of Object.entries(SKILL_TREE)) {
    const total = data.skills.length;
    const completed = data.skills.filter(s => s.status === 'mastered').length;
    sectionProgress[section] = {
      overall: Math.round((completed / total) * 100),
      inProgress: data.skills.filter(s => s.status === 'in-progress').length,
      locked: data.skills.filter(s => s.status === 'locked').length,
    };
  }

  return {
    overall: overallProgress,
    completedSkills,
    totalSkills,
    sectionProgress,
  };
}

// 推荐下一步学习
function getNextRecommendation(userId) {
  const recommendations = [];

  for (const [section, data] of Object.entries(SKILL_TREE)) {
    const learningSkills = data.skills.filter(s => s.status === 'learning');
    const progressSkills = data.skills.filter(s => s.status === 'in-progress');

    if (learningSkills.length > 0) {
      recommendations.push({
        section,
        skill: learningSkills[0],
        priority: 'high',
        reason: '该技能已解锁，建议优先学习',
      });
    }

    if (progressSkills.length > 0) {
      recommendations.push({
        section,
        skill: progressSkills[0],
        priority: 'medium',
        reason: '该技能练习中，建议继续保持',
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// === API 路由 ===

// GET / - 获取学习路径概览
router.get('/', (req, res) => {
  const progress = getUserProgress();
  const recommendations = getNextRecommendation('user-001');

  res.json({
    code: 0,
    data: {
      progress,
      recommendations: recommendations.slice(0, 3),
      availableTemplates: PATH_TEMPLATES,
    },
  });
});

// GET /tree/:section - 获取科目技能树
router.get('/tree/:section', (req, res) => {
  const section = req.params.section;
  const skillData = SKILL_TREE[section];

  if (!skillData) {
    return res.status(404).json({
      code: 404,
      message: '科目不存在',
    });
  }

  const skillsWithMastery = skillData.skills.map(skill => ({
    ...skill,
    mastery: calculateSkillMastery(skill),
  }));

  res.json({
    code: 0,
    data: {
      ...skillData,
      skills: skillsWithMastery,
      totalSkills: skillsWithMastery.length,
      completedSkills: skillsWithMastery.filter(s => s.status === 'mastered').length,
      inProgressSkills: skillsWithMastery.filter(s => s.status === 'in-progress').length,
    },
  });
});

// GET /trees - 获取所有科目技能树
router.get('/trees', (req, res) => {
  const trees = {};
  
  for (const [section, data] of Object.entries(SKILL_TREE)) {
    trees[section] = {
      name: data.name,
      icon: data.icon,
      color: data.color,
      skills: data.skills.map(skill => ({
        ...skill,
        mastery: calculateSkillMastery(skill),
      })),
    };
  }

  res.json({
    code: 0,
    data: {
      trees,
      summary: getUserProgress(),
    },
  });
});

// GET /templates - 获取学习路径模板
router.get('/templates', (req, res) => {
  res.json({
    code: 0,
    data: {
      templates: PATH_TEMPLATES,
    },
  });
});

// POST /create - 创建自定义学习路径
router.post('/create', (req, res) => {
  const { targetScore, duration, dailyHours, focusSections } = req.body;

  res.json({
    code: 0,
    data: {
      pathId: 'path-custom-' + Date.now(),
      targetScore,
      duration,
      dailyHours,
      focusSections,
      weeklyPlan: Array.from({ length: Math.min(duration, 12) }, (_, i) => ({
        week: i + 1,
        focus: focusSections?.[i % focusSections.length] || 'balanced',
        estimatedHours: dailyHours || 2,
        milestones: ['基础技能', '进阶练习', '模拟考试', '冲刺提升'][Math.floor(i / 3)] || '持续练习',
      })),
    },
  });
});

// GET /recommend - 获取个性化推荐
router.get('/recommend', (req, res) => {
  const recommendations = getNextRecommendation('user-001');

  res.json({
    code: 0,
    data: {
      recommendations,
      strategy: {
        dailyGoal: {
          reading: 5,
          listening: 5,
          speaking: 2,
          writing: 2,
        },
        tips: [
          '每天优先完成高优先级技能练习',
          '每周进行一次模拟测试检验进度',
          '薄弱科目分配更多练习时间',
        ],
      },
    },
  });
});

// POST /update-progress - 更新技能进度
router.post('/update-progress', (req, res) => {
  const { skillId, mastered, total } = req.body;

  // 查找并更新技能
  for (const section of Object.values(SKILL_TREE)) {
    for (const skill of section.skills) {
      if (skill.id === skillId) {
        skill.mastered = Math.min(mastered, total);
        skill.status = skill.mastered >= total ? 'mastered' : 
                       skill.mastered > 0 ? 'in-progress' : 'learning';
        break;
      }
    }
  }

  const newProgress = getUserProgress();

  res.json({
    code: 0,
    data: {
      skillId,
      progress: newProgress,
      message: '技能进度已更新',
    },
  });
});

// GET /stats - 获取学习统计
router.get('/stats', (req, res) => {
  const progress = getUserProgress();

  res.json({
    code: 0,
    data: {
      overall: progress.overall,
      totalPractice: Object.values(SKILL_TREE).reduce(
        (sum, section) => sum + section.skills.reduce((s, skill) => s + skill.questions, 0), 0
      ),
      totalMastered: Object.values(SKILL_TREE).reduce(
        (sum, section) => sum + section.skills.reduce((s, skill) => s + skill.mastered, 0), 0
      ),
      sectionBreakdown: Object.entries(SKILL_TREE).map(([section, data]) => ({
        section,
        name: data.name,
        icon: data.icon,
        completed: data.skills.filter(s => s.status === 'mastered').length,
        inProgress: data.skills.filter(s => s.status === 'in-progress').length,
        locked: data.skills.filter(s => s.status === 'locked').length,
        mastery: Math.round(
          data.skills.reduce((sum, skill) => sum + calculateSkillMastery(skill), 0) / data.skills.length
        ),
      })),
    },
  });
});

module.exports = router;
