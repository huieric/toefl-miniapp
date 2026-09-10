import { describe, it, expect } from 'vitest'

/**
 * FSRS (Free Spaced Repetition Scheduler) 算法核心实现
 * 基于改进的间隔重复算法
 */

// FSRS 默认参数（17 个）
const DEFAULT_PARAMETERS = [
  0.40255, 1.17372, 3.12316, 15.69103, 7.1949, 0.5317, 1.01627, 2.01834,
  0.09094, 2.07246, 0.22144, 0.00073, 4.70392, 0.91033, 1.74763, 0.14606, 1.00000,
]

const REQUEST_RETENTION = 0.9

// 难度映射：评分 1-5 → 质量 0-10
function ratingToQuality(rating) {
  return rating * 2 // 1→2, 2→4, 3→6, 4→8, 5→10
}

// 计算下次复习间隔（天）— 简化的 FSRS 间隔计算
function calculateNextInterval(currentStability, quality) {
  // quality: 0-10
  const qFactor = (quality - 5) / 5 // -1 to 1

  // 高质量增加间隔，低质量减少间隔
  const baseFactor = currentStability
  const qualityMultiplier = 1 + qFactor * 0.5 // 0.5 到 1.5
  const minInterval = 0.1 // 最小间隔 0.1 天（约 2.4 小时）

  const newInterval = Math.max(minInterval, baseFactor * qualityMultiplier)
  return Math.round(newInterval * 10) / 10
}

// 计算难度变化
function calculateNextDifficulty(currentDifficulty, quality) {
  // quality: 0-10
  // 质量高 → 难度增加；质量低 → 难度降低
  const difficultyChange = (quality - 5) * 0.15 // -0.75 到 0.75
  let newDifficulty = currentDifficulty + difficultyChange
  newDifficulty = Math.max(1, Math.min(10, newDifficulty))
  return Math.round(newDifficulty * 100) / 100
}

// 计算稳定性变化
function calculateNextStability(currentStability, currentDifficulty, quality) {
  // quality: 0-10

  if (quality < 4) {
    // 严重遗忘：大幅降低稳定性
    return Math.round(currentStability * 0.4 * 100) / 100
  }

  if (quality < 7) {
    // 部分遗忘：小幅降低
    return Math.round(currentStability * 0.8 * 100) / 100
  }

  // 良好记忆：增加稳定性
  const qualityBonus = (quality - 5) * 0.3 // 0 到 1.5
  const newStability = currentStability * (1 + qualityBonus)
  return Math.round(newStability * 100) / 100
}

// 获取可提取性
function calculateRetrievability(daysElapsed, stability) {
  if (stability <= 0 || daysElapsed < 0) return 1
  const decay = Math.exp(-0.5 * daysElapsed / stability)
  return Math.max(0.01, decay)
}

// FSRS 主函数
function fsrsSchedule(currentStability, currentDifficulty, rating, repetitionCount = 0) {
  const quality = ratingToQuality(rating)

  const newDifficulty = calculateNextDifficulty(currentDifficulty, quality)
  const newStability = calculateNextStability(currentStability, currentDifficulty, quality)
  const newDurability = newStability

  return {
    stability: newStability,
    difficulty: newDifficulty,
    retrievability: calculateRetrievability(0, newStability),
    durability: newDurability,
    nextReviewDays: calculateNextInterval(newStability, quality),
  }
}

// 获取下次复习天数
function getNextReviewDays(stability) {
  if (stability <= 0.1) return 1
  const days = Math.max(1, Math.round(stability * 1.5))
  return days
}

export {
  DEFAULT_PARAMETERS,
  REQUEST_RETENTION,
  ratingToQuality,
  calculateNextInterval,
  calculateNextDifficulty,
  calculateNextStability,
  calculateRetrievability,
  getNextReviewDays,
  fsrsSchedule,
}
