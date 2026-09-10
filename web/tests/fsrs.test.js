import { describe, it, expect } from 'vitest'
import {
  calculateNextDifficulty,
  calculateNextStability,
  getNextReviewDays,
  fsrsSchedule,
  calculateRetrievability,
  calculateNextInterval,
} from '../src/utils/fsrs'

describe('FSRS 算法', () => {
  describe('难度计算', () => {
    it('高质量评分应该增加难度', () => {
      const newDiff = calculateNextDifficulty(5, 10)
      expect(newDiff).toBeGreaterThan(5)
      expect(newDiff).toBeLessThanOrEqual(10)
    })

    it('低质量评分应该降低难度', () => {
      const newDiff = calculateNextDifficulty(5, 2)
      expect(newDiff).toBeLessThan(5)
      expect(newDiff).toBeGreaterThanOrEqual(1)
    })

    it('难度应该限制在 1-10 范围内', () => {
      expect(calculateNextDifficulty(10, 10)).toBeLessThanOrEqual(10)
      expect(calculateNextDifficulty(1, 0)).toBeGreaterThanOrEqual(1)
    })

    it('中等质量评分变化应较小', () => {
      const diff5 = calculateNextDifficulty(5, 4)
      const diff10 = calculateNextDifficulty(5, 10)
      expect(Math.abs(diff5 - 5)).toBeLessThan(Math.abs(diff10 - 5))
    })
  })

  describe('稳定性计算', () => {
    it('高质量评分应该增加稳定性', () => {
      const result = calculateNextStability(5, 5, 10)
      expect(result).toBeGreaterThan(5)
    })

    it('低质量评分应该减少稳定性', () => {
      const result = calculateNextStability(10, 5, 1)
      expect(result).toBeLessThan(10)
    })

    it('中等质量评分小幅减少', () => {
      const result = calculateNextStability(10, 5, 5)
      expect(result).toBeLessThan(10)
    })

    it('稳定性不能为负数', () => {
      const result = calculateNextStability(0.5, 1, 0)
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('全新题目应该产生合理初始稳定性', () => {
      const result = fsrsSchedule(0.1, 5, 3, 0)
      expect(result.stability).toBeGreaterThan(0)
    })
  })

  describe('间隔计算', () => {
    it('新题目应该安排在 1 天后', () => {
      const days = getNextReviewDays(0.1)
      expect(days).toBeGreaterThanOrEqual(1)
    })

    it('稳定后应该安排更长的复习间隔', () => {
      const days1 = getNextReviewDays(1)
      const days30 = getNextReviewDays(30)
      expect(days30).toBeGreaterThan(days1)
    })

    it('30 天稳定性应该产生合理的复习间隔', () => {
      const days = getNextReviewDays(30)
      expect(days).toBeGreaterThan(7)
      expect(days).toBeLessThanOrEqual(45)
    })

    it('间隔应该随稳定性单调递增', () => {
      for (let i = 1; i < 5; i++) {
        expect(getNextReviewDays(i + 10)).toBeGreaterThan(getNextReviewDays(i + 9))
      }
    })
  })

  describe('完整调度流程', () => {
    it('首次复习（质量 4）应该产生合理的参数', () => {
      const result = fsrsSchedule(0.1, 5, 4, 0)
      expect(result.stability).toBeGreaterThan(0)
      expect(result.difficulty).toBeGreaterThanOrEqual(1)
      expect(result.difficulty).toBeLessThanOrEqual(10)
      expect(result.nextReviewDays).toBeGreaterThan(0) // 新题间隔至少 0.1 天
    })

    it('连续高质量应该增加稳定性', () => {
      const result1 = fsrsSchedule(1, 5, 5, 0)
      const result2 = fsrsSchedule(result1.stability, result1.difficulty, 5, 1)
      expect(result2.stability).toBeGreaterThan(result1.stability)
      expect(result2.nextReviewDays).toBeGreaterThan(result1.nextReviewDays)
    })

    it('低质量评分应该减少稳定性', () => {
      const result1 = fsrsSchedule(10, 5, 3, 5)
      const result2 = fsrsSchedule(result1.stability, result1.difficulty, 1, 6)
      expect(result2.stability).toBeLessThan(result1.stability)
      expect(result2.nextReviewDays).toBeLessThan(result1.nextReviewDays)
    })

    it('质量 3 应该保持相对稳定', () => {
      const result = fsrsSchedule(10, 5, 3, 5)
      expect(result.stability).toBeGreaterThan(0)
    })
  })

  describe('可提取性计算', () => {
    it('时间流逝应该降低可提取性', () => {
      const retrievable0 = calculateRetrievability(0, 10)
      const retrievable30 = calculateRetrievability(30, 10)
      expect(retrievable30).toBeLessThan(retrievable0)
    })

    it('高稳定性应该保持较高可提取性', () => {
      const retrievable = calculateRetrievability(1, 100)
      expect(retrievable).toBeGreaterThan(0.9)
    })

    it('可提取性应该在 0.01-1 范围内', () => {
      for (const days of [0, 1, 7, 30, 90]) {
        for (const stab of [0.1, 1, 10, 100]) {
          const r = calculateRetrievability(days, stab)
          expect(r).toBeGreaterThanOrEqual(0.01)
          expect(r).toBeLessThanOrEqual(1)
        }
      }
    })
  })

  describe('间隔计算边界', () => {
    it('质量 5 应该获得最大间隔增长', () => {
      const interval5 = calculateNextInterval(5, 10)
      const interval1 = calculateNextInterval(5, 2)
      expect(interval5).toBeGreaterThan(interval1)
    })

    it('低稳定性+高质量不应该归零', () => {
      const interval = calculateNextInterval(0.1, 10)
      expect(interval).toBeGreaterThan(0.05)
    })
  })
})
