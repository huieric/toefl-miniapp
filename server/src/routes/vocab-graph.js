const express = require('express');
const router = express.Router();

/**
 * Round 30: Vocabulary Graph (词汇关系图谱)
 * 
 * 功能：
 * 1. 词汇关系可视化
 * 2. 主题分类
 * 3. 词频统计
 * 4. 学习进度追踪
 * 5. 同义词/反义词网络
 */

// 托福高频词汇库
const VOCAB_GRAPH = {
  nodes: [
    { id: 'n1', word: 'biodiversity', meaning: '生物多样性', topic: 'environment', frequency: 95, mastered: 1, difficulty: 'hard' },
    { id: 'n2', word: 'ecosystem', meaning: '生态系统', topic: 'environment', frequency: 92, mastered: 1, difficulty: 'medium' },
    { id: 'n3', word: 'habitat', meaning: '栖息地', topic: 'environment', frequency: 88, mastered: 0, difficulty: 'medium' },
    { id: 'n4', word: 'evolution', meaning: '进化', topic: 'biology', frequency: 90, mastered: 1, difficulty: 'hard' },
    { id: 'n5', word: 'mutation', meaning: '突变', topic: 'biology', frequency: 75, mastered: 0, difficulty: 'hard' },
    { id: 'n6', word: 'adaptation', meaning: '适应', topic: 'biology', frequency: 85, mastered: 0, difficulty: 'medium' },
    { id: 'n7', word: 'renovation', meaning: '翻新', topic: 'campus', frequency: 60, mastered: 1, difficulty: 'easy' },
    { id: 'n8', word: 'suspended', meaning: '暂停', topic: 'campus', frequency: 55, mastered: 0, difficulty: 'medium' },
    { id: 'n9', word: 'accelerate', meaning: '加速', topic: 'change', frequency: 78, mastered: 0, difficulty: 'medium' },
    { id: 'n10', word: 'mitigate', meaning: '缓解', topic: 'change', frequency: 82, mastered: 0, difficulty: 'hard' },
    { id: 'n11', word: 'fundamental', meaning: '基础的', topic: 'general', frequency: 96, mastered: 1, difficulty: 'easy' },
    { id: 'n12', word: 'significant', meaning: '显著的', topic: 'general', frequency: 98, mastered: 1, difficulty: 'easy' },
    { id: 'n13', word: 'hypothesis', meaning: '假设', topic: 'science', frequency: 88, mastered: 0, difficulty: 'hard' },
    { id: 'n14', word: 'phenomenon', meaning: '现象', topic: 'science', frequency: 85, mastered: 0, difficulty: 'medium' },
    { id: 'n15', word: 'correlation', meaning: '相关性', topic: 'science', frequency: 72, mastered: 0, difficulty: 'hard' },
  ],
  edges: [
    { source: 'n1', target: 'n2', relation: 'related', weight: 0.9 },
    { source: 'n1', target: 'n3', relation: 'related', weight: 0.85 },
    { source: 'n2', target: 'n3', relation: 'related', weight: 0.8 },
    { source: 'n4', target: 'n5', relation: 'related', weight: 0.85 },
    { source: 'n4', target: 'n6', relation: 'related', weight: 0.9 },
    { source: 'n5', target: 'n6', relation: 'related', weight: 0.75 },
    { source: 'n7', target: 'n8', relation: 'related', weight: 0.6 },
    { source: 'n9', target: 'n10', relation: 'related', weight: 0.7 },
    { source: 'n11', target: 'n12', relation: 'synonym', weight: 0.65 },
    { source: 'n13', target: 'n14', relation: 'related', weight: 0.8 },
    { source: 'n13', target: 'n15', relation: 'related', weight: 0.75 },
    { source: 'n14', target: 'n15', relation: 'related', weight: 0.7 },
  ],
  topics: [
    { id: 'environment', name: '环境科学', icon: '🌿', color: '#10b981', count: 3 },
    { id: 'biology', name: '生物学', icon: '🧬', color: '#8b5cf6', count: 3 },
    { id: 'campus', name: '校园生活', icon: '🏫', color: '#f59e0b', count: 2 },
    { id: 'change', name: '变化影响', icon: '📈', color: '#ef4444', count: 2 },
    { id: 'general', name: '通用学术', icon: '📚', color: '#6366f1', count: 2 },
    { id: 'science', name: '科学研究', icon: '🔬', color: '#06b6d4', count: 3 },
  ],
};

// 学习进度
const progressMap = {
  environment: { learned: 2, total: 3, mastered: 2 },
  biology: { learned: 1, total: 3, mastered: 0 },
  campus: { learned: 1, total: 2, mastered: 1 },
  change: { learned: 0, total: 2, mastered: 0 },
  general: { learned: 2, total: 2, mastered: 2 },
  science: { learned: 0, total: 3, mastered: 0 },
};

// 词频趋势
const frequencyTrend = [
  { date: '2024-02-05', wordsLearned: 3, reviewCount: 12 },
  { date: '2024-02-06', wordsLearned: 5, reviewCount: 15 },
  { date: '2024-02-07', wordsLearned: 2, reviewCount: 18 },
  { date: '2024-02-08', wordsLearned: 4, reviewCount: 14 },
  { date: '2024-02-09', wordsLearned: 6, reviewCount: 20 },
  { date: '2024-02-10', wordsLearned: 3, reviewCount: 16 },
  { date: '2024-02-11', wordsLearned: 4, reviewCount: 19 },
];

// 更新词汇掌握度
function updateWordMastery(wordId, mastered) {
  const node = VOCAB_GRAPH.nodes.find(n => n.id === wordId);
  if (node) {
    node.mastered = mastered ? 1 : 0;
    
    // 更新主题进度
    const topic = node.topic;
    if (progressMap[topic]) {
      progressMap[topic].mastered = VOCAB_GRAPH.nodes
        .filter(n => n.topic === topic && n.mastered)
        .length;
    }
  }
}

// 获取图谱统计
function getGraphStats() {
  const totalNodes = VOCAB_GRAPH.nodes.length;
  const totalMastered = VOCAB_GRAPH.nodes.filter(n => n.mastered).length;
  const totalLearned = VOCAB_GRAPH.nodes.filter(n => n.mastered || n.difficulty !== 'hard').length;
  
  const topicStats = VOCAB_GRAPH.topics.map(topic => {
    const nodes = VOCAB_GRAPH.nodes.filter(n => n.topic === topic.id);
    return {
      ...topic,
      total: nodes.length,
      learned: nodes.filter(n => n.mastered || n.difficulty !== 'hard').length,
      mastered: nodes.filter(n => n.mastered).length,
      avgFrequency: Math.round(nodes.reduce((sum, n) => sum + n.frequency, 0) / nodes.length),
    };
  });

  return {
    totalNodes,
    totalMastered,
    totalLearned,
    overallProgress: Math.round((totalMastered / totalNodes) * 100),
    topicStats,
    recentTrend: frequencyTrend.slice(-7),
    difficultyBreakdown: {
      easy: VOCAB_GRAPH.nodes.filter(n => n.difficulty === 'easy').length,
      medium: VOCAB_GRAPH.nodes.filter(n => n.difficulty === 'medium').length,
      hard: VOCAB_GRAPH.nodes.filter(n => n.difficulty === 'hard').length,
    },
  };
}

// 根据主题获取词汇
function getWordsByTopic(topicId) {
  const topic = VOCAB_GRAPH.topics.find(t => t.id === topicId);
  const nodes = VOCAB_GRAPH.nodes.filter(n => n.topic === topicId);
  
  return {
    topic,
    words: nodes.map(n => ({
      id: n.id,
      word: n.word,
      meaning: n.meaning,
      frequency: n.frequency,
      mastered: n.mastered,
      difficulty: n.difficulty,
    })),
  };
}

// === API 路由 ===

// GET / - 获取词汇图谱概览
router.get('/', (req, res) => {
  res.json({
    code: 0,
    data: {
      ...VOCAB_GRAPH,
      stats: getGraphStats(),
      progress: progressMap,
    },
  });
});

// GET /nodes - 获取所有词汇节点
router.get('/nodes', (req, res) => {
  res.json({
    code: 0,
    data: {
      nodes: VOCAB_GRAPH.nodes,
      total: VOCAB_GRAPH.nodes.length,
      mastered: VOCAB_GRAPH.nodes.filter(n => n.mastered).length,
    },
  });
});

// GET /topics - 获取主题列表
router.get('/topics', (req, res) => {
  const topicStats = VOCAB_GRAPH.topics.map(topic => {
    const nodes = VOCAB_GRAPH.nodes.filter(n => n.topic === topic.id);
    return {
      ...topic,
      total: nodes.length,
      mastered: nodes.filter(n => n.mastered).length,
    };
  });

  res.json({
    code: 0,
    data: {
      topics: topicStats,
    },
  });
});

// GET /topic/:id - 获取主题词汇
router.get('/topic/:id', (req, res) => {
  try {
    const result = getWordsByTopic(req.params.id);
    res.json({ code: 0, data: result });
  } catch {
    res.status(404).json({ code: 404, message: '主题不存在' });
  }
});

// GET /:wordId - 获取单个词汇详情
router.get('/:wordId', (req, res) => {
  const node = VOCAB_GRAPH.nodes.find(n => n.id === req.params.wordId);
  
  if (!node) {
    return res.status(404).json({
      code: 404,
      message: '词汇不存在',
    });
  }

  // 获取相关词汇
  const relatedEdges = VOCAB_GRAPH.edges.filter(
    e => e.source === req.params.wordId || e.target === req.params.wordId
  );
  
  const relatedNodes = relatedEdges.map(edge => {
    const relatedId = edge.source === req.params.wordId ? edge.target : edge.source;
    const related = VOCAB_GRAPH.nodes.find(n => n.id === relatedId);
    return { ...related, relation: edge.relation, weight: edge.weight };
  });

  res.json({
    code: 0,
    data: {
      ...node,
      relatedWords: relatedNodes,
    },
  });
});

// GET /edges - 获取关系边
router.get('/edges', (req, res) => {
  res.json({
    code: 0,
    data: {
      edges: VOCAB_GRAPH.edges,
      total: VOCAB_GRAPH.edges.length,
    },
  });
});

// POST /master - 更新词汇掌握度
router.post('/master', (req, res) => {
  const { wordId, mastered } = req.body;
  updateWordMastery(wordId, mastered);

  res.json({
    code: 0,
    data: {
      wordId,
      mastered: mastered ? 1 : 0,
      stats: getGraphStats(),
    },
  });
});

// GET /stats - 获取统计
router.get('/stats', (req, res) => {
  res.json({
    code: 0,
    data: getGraphStats(),
  });
});

// GET /trending - 获取趋势词汇
router.get('/trending', (req, res) => {
  const trending = VOCAB_GRAPH.nodes
    .filter(n => !n.mastered)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  res.json({
    code: 0,
    data: {
      trending,
      recentTrend: frequencyTrend.slice(-7),
    },
  });
});

module.exports = router;
