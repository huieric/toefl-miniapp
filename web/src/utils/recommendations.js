import { describe, it, expect } from 'vitest'

/**
 * 智能题目推荐算法
 * 基于 60/20/20 难度平衡算法推荐题目
 */

/**
 * 难度平衡函数
 * @param {Array} questions - 题目列表
 * @param {number} limit - 推荐数量
 * @returns {Array} 平衡后的题目列表
 */
function balanceDifficulty(questions, limit = 10) {
  if (!questions || questions.length === 0) return []

  // 按难度分组
  const easy = questions.filter(q => q.difficulty === 'easy')
  const medium = questions.filter(q => q.difficulty === 'medium')
  const hard = questions.filter(q => q.difficulty === 'hard')

  // 计算各难度推荐数量（60/20/20）
  const easyCount = Math.max(1, Math.round(limit * 0.6))
  const mediumCount = Math.max(1, Math.round(limit * 0.2))
  const hardCount = limit - easyCount - mediumCount

  // 从各组中随机选择
  const selectRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  const selectedEasy = selectRandom(easy, easyCount)
  const selectedMedium = selectRandom(medium, mediumCount)
  const selectedHard = selectRandom(hard, hardCount)

  // 合并并限制总数
  const result = [...selectedEasy, ...selectedMedium, ...selectedHard]
  return result.slice(0, limit)
}

/**
 * 获取推荐理由
 */
function getRecommendationReason(weakPoints, questionCount) {
  if (!weakPoints || weakPoints.length === 0) {
    return '根据您的一般表现推荐'
  }

  const mainWeakness = weakPoints[0]
  const reason = `您的${mainWeakness}较弱，已为您精选 ${questionCount} 道相关题目`
  return reason
}

/**
 * 计算掌握度
 */
function calculateMastery(easeFactor) {
  // easeFactor 通常在 1-3.5 之间
  // 3.5 = 完全掌握，1.0 = 完全遗忘
  const mastery = Math.min(100, Math.round((easeFactor / 3.5) * 100))
  return mastery
}

/**
 * 获取掌握度颜色
 */
function getMasteryColor(mastery) {
  if (mastery >= 70) return '#67C23A' // 绿色
  if (mastery >= 40) return '#E6A23C' // 橙色
  return '#F56C6C' // 红色
}

/**
 * 格式化下次复习时间
 */
function formatNextReview(nextReviewDate) {
  if (!nextReviewDate) return '--'

  const now = new Date()
  const next = new Date(nextReviewDate)
  const diffMs = next - now
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 0) {
    return '已过期，请尽快复习'
  }

  if (diffHours < 24) {
    return `${diffHours} 小时后`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} 天后`
}

export {
  balanceDifficulty,
  getRecommendationReason,
  calculateMastery,
  getMasteryColor,
  formatNextReview,
}
