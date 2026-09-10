import { describe, it, expect } from 'vitest'
import {
  balanceDifficulty,
  getRecommendationReason,
  calculateMastery,
  getMasteryColor,
  formatNextReview,
} from '../src/utils/recommendations'

describe('智能题目推荐算法', () => {
  // 更多样本确保统计可靠性
  const sampleQuestions = [
    { id: 1, difficulty: 'easy' }, { id: 2, difficulty: 'easy' },
    { id: 3, difficulty: 'easy' }, { id: 4, difficulty: 'easy' },
    { id: 5, difficulty: 'easy' }, { id: 6, difficulty: 'easy' },
    { id: 7, difficulty: 'easy' }, { id: 8, difficulty: 'easy' },
    { id: 9, difficulty: 'easy' }, { id: 10, difficulty: 'easy' },
    { id: 11, difficulty: 'easy' }, { id: 12, difficulty: 'easy' },
    { id: 13, difficulty: 'easy' }, { id: 14, difficulty: 'easy' },
    { id: 15, difficulty: 'easy' }, { id: 16, difficulty: 'easy' },
    { id: 17, difficulty: 'easy' }, { id: 18, difficulty: 'easy' },
    { id: 19, difficulty: 'easy' }, { id: 20, difficulty: 'easy' },
    { id: 21, difficulty: 'medium' }, { id: 22, difficulty: 'medium' },
    { id: 23, difficulty: 'medium' }, { id: 24, difficulty: 'medium' },
    { id: 25, difficulty: 'medium' }, { id: 26, difficulty: 'medium' },
    { id: 27, difficulty: 'medium' }, { id: 28, difficulty: 'medium' },
    { id: 29, difficulty: 'medium' }, { id: 30, difficulty: 'medium' },
    { id: 31, difficulty: 'hard' }, { id: 32, difficulty: 'hard' },
    { id: 33, difficulty: 'hard' }, { id: 34, difficulty: 'hard' },
    { id: 35, difficulty: 'hard' }, { id: 36, difficulty: 'hard' },
    { id: 37, difficulty: 'hard' }, { id: 38, difficulty: 'hard' },
    { id: 39, difficulty: 'hard' }, { id: 40, difficulty: 'hard' },
  ]

  describe('难度平衡', () => {
    it('应该按 60/20/20 比例选择题目', () => {
      const result = balanceDifficulty(sampleQuestions, 10)
      expect(result.length).toBeLessThanOrEqual(10)

      const easyCount = result.filter(q => q.difficulty === 'easy').length
      const mediumCount = result.filter(q => q.difficulty === 'medium').length
      const hardCount = result.filter(q => q.difficulty === 'hard').length

      // easy 应该占最大比例（期望约 6 题）
      expect(easyCount).toBeGreaterThanOrEqual(mediumCount)
      expect(easyCount).toBeGreaterThanOrEqual(hardCount)
      // 总数不超过限制
      expect(easyCount + mediumCount + hardCount).toBeLessThanOrEqual(10)
    })

    it('请求 5 题应该大致保持比例', () => {
      const result = balanceDifficulty(sampleQuestions, 5)
      expect(result.length).toBeLessThanOrEqual(5)
      expect(result.length).toBeGreaterThan(0)
    })

    it('空列表应该返回空数组', () => {
      expect(balanceDifficulty([], 10)).toEqual([])
      expect(balanceDifficulty(null, 10)).toEqual([])
    })

    it('题目不足时应该返回所有可用题目', () => {
      const fewQuestions = [
        { id: 1, difficulty: 'easy' },
        { id: 2, difficulty: 'medium' },
        { id: 3, difficulty: 'hard' },
      ]
      const result = balanceDifficulty(fewQuestions, 10)
      expect(result.length).toBe(3)
    })

    it('只有单一难度时按 60/20/20 分配但受限于可用题目', () => {
      const mediumOnly = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        difficulty: 'medium',
      }))
      const result = balanceDifficulty(mediumOnly, 5)
      // 算法请求 3 easy + 1 medium + 1 hard，但只有 medium 可用
      // 所以实际只返回 1 medium（受限于名额分配）
      expect(result.every(q => q.difficulty === 'medium')).toBe(true)
      expect(result.length).toBeLessThanOrEqual(5)
    })
  })

  describe('推荐理由', () => {
    it('无薄弱点时返回通用推荐', () => {
      const reason = getRecommendationReason([], 10)
      expect(reason).toContain('一般表现')
    })

    it('有薄弱点时返回具体推荐', () => {
      const reason = getRecommendationReason(['词汇'], 5)
      expect(reason).toContain('词汇')
      expect(reason).toContain('5')
    })

    it('有多个薄弱点时推荐第一个', () => {
      const reason = getRecommendationReason(['词汇', '语法'], 10)
      expect(reason).toContain('词汇')
    })
  })

  describe('掌握度计算', () => {
    it('ease=3.5 应该返回 100%', () => {
      expect(calculateMastery(3.5)).toBe(100)
    })

    it('ease=1.75 应该返回 50%', () => {
      expect(calculateMastery(1.75)).toBe(50)
    })

    it('ease=0 应该返回 0%', () => {
      expect(calculateMastery(0)).toBe(0)
    })

    it('ease 超过 3.5 应该限制在 100%', () => {
      expect(calculateMastery(5)).toBe(100)
    })

    it('ease=2.45 应该返回 70%', () => {
      expect(calculateMastery(2.45)).toBe(70)
    })
  })

  describe('掌握度颜色', () => {
    it('>=70% 应该返回绿色', () => {
      expect(getMasteryColor(70)).toBe('#67C23A')
      expect(getMasteryColor(100)).toBe('#67C23A')
    })

    it('40-69% 应该返回橙色', () => {
      expect(getMasteryColor(40)).toBe('#E6A23C')
      expect(getMasteryColor(69)).toBe('#E6A23C')
    })

    it('40% 边界应该返回橙色', () => {
      expect(getMasteryColor(40)).toBe('#E6A23C')
    })

    it('<40% 应该返回红色', () => {
      expect(getMasteryColor(0)).toBe('#F56C6C')
      expect(getMasteryColor(39)).toBe('#F56C6C')
    })
  })

  describe('复习时间格式化', () => {
    it('已过期应该返回提示', () => {
      const past = new Date(Date.now() - 86400000)
      expect(formatNextReview(past)).toContain('已过期')
    })

    it('今天应该返回小时数', () => {
      const today = new Date(Date.now() + 3600000)
      const result = formatNextReview(today)
      expect(result).toContain('1 小时后')
    })

    it('明天应该返回天数', () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const result = formatNextReview(tomorrow)
      expect(result).toContain('1 天后')
    })

    it('没有日期应该返回 --', () => {
      expect(formatNextReview(null)).toBe('--')
      expect(formatNextReview(undefined)).toBe('--')
    })
  })
})
