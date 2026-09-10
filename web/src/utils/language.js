import { describe, it, expect, vi } from 'vitest'

/**
 * 语言检测工具函数
 * 根据浏览器语言和 localStorage 返回当前语言
 */

// 检测浏览器语言
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'zh-CN'
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

// 获取持久化语言
function getPersistentLanguage() {
  try {
    return localStorage.getItem('toefl-lang') || null
  } catch {
    return null
  }
}

// 设置持久化语言
function setPersistentLanguage(lang) {
  try {
    localStorage.setItem('toefl-lang', lang)
    return true
  } catch {
    return false
  }
}

// 获取最终语言（优先持久化，回退到浏览器）
function getCurrentLanguage() {
  const persistent = getPersistentLanguage()
  if (persistent === 'zh-CN' || persistent === 'en') {
    return persistent
  }
  return detectBrowserLanguage()
}

export {
  detectBrowserLanguage,
  getPersistentLanguage,
  setPersistentLanguage,
  getCurrentLanguage,
}
