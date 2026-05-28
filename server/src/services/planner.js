/**
 * 学习计划生成引擎
 * 根据目标分数、考试日期、当前水平生成三阶段学习计划
 */

/**
 * 生成三阶段学习计划
 * @param {number} targetScore - 目标分数（80/90/100/110/120）
 * @param {number} currentScore - 当前水平分数
 * @param {Date} examDate - 考试日期
 * @param {Array<string>} weakSubjects - 薄弱科目列表
 * @returns {Array} 三个阶段计划
 */
function generatePhasePlan(targetScore, currentScore, examDate, weakSubjects) {
  const now = new Date();
  const totalDays = Math.max(30, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));
  const scoreGap = targetScore - currentScore;

  // 三阶段天数分配：40% 基础 + 35% 强化 + 25% 冲刺
  const phase1Days = Math.round(totalDays * 0.40);
  const phase2Days = Math.round(totalDays * 0.35);
  const phase3Days = totalDays - phase1Days - phase2Days;

  const phases = [
    buildPhase1(phase1Days, weakSubjects, scoreGap),
    buildPhase2(phase2Days, weakSubjects, scoreGap),
    buildPhase3(phase3Days, weakSubjects, scoreGap),
  ];

  return phases;
}

/**
 * 第一阶段：基础巩固（40%时间）
 * 全面复习所有科目基础知识
 */
function buildPhase1(days, weakSubjects, scoreGap) {
  const dailyTasks = [];

  // 每天的核心任务
  dailyTasks.push(
    { subject: 'reading', taskType: 'vocabulary', title: '背诵托福核心词汇', targetCount: 30, description: '每天记忆30个核心词汇，建议使用早中晚分段记忆' },
    { subject: 'reading', taskType: 'passage', title: '阅读训练', targetCount: 1, description: '完成1篇TPO阅读并精读分析' },
    { subject: 'listening', taskType: 'lecture', title: '讲座听力', targetCount: 1, description: '完成1篇讲座听力并听写关键句' },
    { subject: 'listening', taskType: 'conversation', title: '对话听力', targetCount: 1, description: '完成1篇对话听力练习' },
    { subject: 'speaking', taskType: 'imitation', title: '跟读模仿', targetCount: 1, description: '跟读模仿1段托福听力材料，注意语音语调' },
    { subject: 'writing', taskType: 'sentence', title: '句子写作', targetCount: 1, description: '完成15个句子改写练习，提升句式多样性' }
  );

  // 薄弱科目额外加量
  if (weakSubjects.includes('reading')) {
    dailyTasks.push({ subject: 'reading', taskType: 'vocabulary', title: '阅读高频词汇强化', targetCount: 20, description: '额外背诵阅读高频词汇20个' });
  }
  if (weakSubjects.includes('listening')) {
    dailyTasks.push({ subject: 'listening', taskType: 'dictation', title: '听写训练', targetCount: 1, description: '完成1段1分钟录音的听写' });
  }

  return {
    phase: 1,
    name: '基础巩固',
    days,
    description: '全面复习基础知识，建立词汇和语法基础，熟悉各科目题型。每天学习时间建议60-90分钟。',
    dailyTasks,
    focusAreas: ['词汇积累', '基础语法', '题型认知', '听力基础'],
  };
}

/**
 * 第二阶段：强化提升（35%时间）
 * 针对薄弱科目进行强化训练
 */
function buildPhase2(days, weakSubjects, scoreGap) {
  const dailyTasks = [];

  dailyTasks.push(
    { subject: 'reading', taskType: 'timed_passage', title: '限时阅读', targetCount: 1, description: '20分钟内完成1篇阅读并做错题分析' },
    { subject: 'listening', taskType: 'note_taking', title: '笔记训练', targetCount: 1, description: '练习讲座听力笔记技巧' },
    { subject: 'speaking', taskType: 'independent', title: '独立口语', targetCount: 1, description: '完成1道独立口语题并录音分析' },
    { subject: 'writing', taskType: 'essay', title: '限时写作', targetCount: 1, description: '30分钟完成1篇独立写作' }
  );

  // 薄弱科目深度强化
  if (weakSubjects.includes('speaking')) {
    dailyTasks.push(
      { subject: 'speaking', taskType: 'integrated', title: '综合口语', targetCount: 2, description: '完成2道综合口语题' },
      { subject: 'speaking', taskType: 'fluency', title: '流利度训练', targetCount: 3, description: '就3个话题进行45秒连续发言练习' }
    );
  }
  if (weakSubjects.includes('writing')) {
    dailyTasks.push(
      { subject: 'writing', taskType: 'integrated', title: '综合写作', targetCount: 1, description: '完成1篇综合写作' },
      { subject: 'writing', taskType: 'revision', title: '文章修改', targetCount: 1, description: '根据AI批改建议修改前一天的作文' }
    );
  }
  if (weakSubjects.includes('reading')) {
    dailyTasks.push({ subject: 'reading', taskType: 'analysis', title: '长难句分析', targetCount: 10, description: '分析10个长难句的结构和含义' });
  }
  if (weakSubjects.includes('listening')) {
    dailyTasks.push({ subject: 'listening', taskType: 'speed_training', title: '倍速听力', targetCount: 1, description: '1.2-1.5倍速听力训练' });
  }

  return {
    phase: 2,
    name: '强化提升',
    days,
    description: '针对薄弱科目进行高强度训练，掌握解题技巧和策略，开始计时练习。每天学习时间建议90-120分钟。',
    dailyTasks,
    focusAreas: ['解题技巧', '薄弱科目突破', '计时练习', '笔记方法'],
  };
}

/**
 * 第三阶段：冲刺模考（25%时间）
 * 大量模考训练+错题复习
 */
function buildPhase3(days, weakSubjects, scoreGap) {
  const dailyTasks = [
    { subject: 'all', taskType: 'mock_section', title: '分科模考', targetCount: 1, description: '完成1科完整模考（阅读36min或听力41min或口语17min或写作50min）' },
    { subject: 'all', taskType: 'review', title: '错题复习', targetCount: 5, description: '复习5道错题，确保掌握解题方法' },
    { subject: 'reading', taskType: 'vocabulary_review', title: '词汇总复习', targetCount: 50, description: '复习50个托福高频词汇' },
  ];

  // 每隔3天进行一次全真模考
  dailyTasks.push({ subject: 'all', taskType: 'full_mock', title: '全真模考（每3天1次）', targetCount: 1, description: '按托福考试流程完成全部四科模考（约3小时）' });

  return {
    phase: 3,
    name: '冲刺模考',
    days,
    description: '大量模考训练，严格计时，模拟真实考试环境和流程，查漏补缺。每天学习时间建议120-180分钟。',
    dailyTasks,
    focusAreas: ['全真模考', '错题回顾', '时间管理', '心态调整'],
  };
}

/**
 * 根据计划生成指定日期的每日任务
 * @param {Array} phases - 阶段计划
 * @param {Date} examDate - 考试日期
 * @param {Date} targetDate - 目标日期
 * @returns {Array} 当日任务列表
 */
function generateDailyTasks(phases, examDate, targetDate) {
  const totalDays = Math.max(1, Math.ceil((examDate - targetDate) / (1000 * 60 * 60 * 24)));

  // 确定当前阶段
  let phaseIndex = 0;
  let daysSum = phases[0]?.days || 0;
  for (let i = 1; i < phases.length; i++) {
    if (totalDays > daysSum) {
      phaseIndex = i;
      daysSum += phases[i].days;
    } else {
      break;
    }
  }

  const phase = phases[phaseIndex];
  if (!phase) return [];

  return (phase.dailyTasks || []).map((task, index) => ({
    id: `task-${targetDate.toISOString().split('T')[0]}-${index}`,
    ...task,
  }));
}

module.exports = { generatePhasePlan, generateDailyTasks };