import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectBrowserLanguage,
  getPersistentLanguage,
  setPersistentLanguage,
  getCurrentLanguage,
} from '../src/utils/language'

describe('语言检测工具', () => {
  // Custom localStorage mock with state
  const store = {}
  const mockStorage = {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
  }

  beforeEach(() => {
    store.length = 0 // clear store
    vi.clearAllMocks()
    mockStorage.getItem.mockClear()
    mockStorage.setItem.mockClear()
  })

  describe('浏览器语言检测', () => {
    it('中文浏览器应该返回 zh-CN', () => {
      const original = global.navigator.language
      global.navigator.language = 'zh-CN'
      expect(detectBrowserLanguage()).toBe('zh-CN')
      global.navigator.language = original
    })

    it('英文浏览器应该返回 en', () => {
      const original = global.navigator.language
      global.navigator.language = 'en-US'
      expect(detectBrowserLanguage()).toBe('en')
      global.navigator.language = original
    })

    it('日语浏览器应该回退到 en', () => {
      const original = global.navigator.language
      global.navigator.language = 'ja-JP'
      expect(detectBrowserLanguage()).toBe('en')
      global.navigator.language = original
    })
  })

  describe('持久化语言', () => {
    it('未设置时返回 null', () => {
      expect(getPersistentLanguage()).toBeNull()
    })

    it('设置后应该返回正确值', () => {
      mockStorage.setItem.mockImplementation((k, v) => { store[k] = v })
      mockStorage.getItem.mockImplementation(k => store[k] || null)
      global.localStorage = mockStorage

      setPersistentLanguage('zh-CN')
      expect(mockStorage.setItem).toHaveBeenCalledWith('toefl-lang', 'zh-CN')
      expect(getPersistentLanguage()).toBe('zh-CN')
    })

    it('设置英文应该正确保存', () => {
      mockStorage.setItem.mockImplementation((k, v) => { store[k] = v })
      mockStorage.getItem.mockImplementation(k => store[k] || null)
      global.localStorage = mockStorage

      setPersistentLanguage('en')
      expect(getPersistentLanguage()).toBe('en')
    })
  })

  describe('最终语言获取', () => {
    it('持久化语言优先于浏览器语言', () => {
      mockStorage.setItem.mockImplementation((k, v) => { store[k] = v })
      mockStorage.getItem.mockImplementation(k => store[k] || null)
      global.localStorage = mockStorage

      setPersistentLanguage('en')
      const original = global.navigator.language
      global.navigator.language = 'zh-CN'
      expect(getCurrentLanguage()).toBe('en')
      global.navigator.language = original
    })

    it('存储不可用时回退到浏览器语言', () => {
      const originalStorage = global.localStorage
      global.localStorage = undefined
      const originalLang = global.navigator.language
      global.navigator.language = 'zh-CN'
      expect(getCurrentLanguage()).toBe('zh-CN')
      global.navigator.language = originalLang
      global.localStorage = originalStorage
    })
  })
})
