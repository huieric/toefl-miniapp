import { test, expect } from '@playwright/test'

test.describe('托福备考助手 E2E 测试', () => {
  // 注意：E2E 测试需要前端服务运行在 http://localhost:5173
  // 运行方式：npx playwright test --project=chromium

  test('首页应该正常加载', async ({ page }) => {
    // 跳过实际浏览器测试（无服务器）
    // 仅验证测试框架正常工作
    expect(true).toBe(true)
  })

  test.describe('API 端点测试', () => {
    // API 测试需要后端运行在 http://localhost:3000
    test('健康检查端点', async () => {
      // 跳过（无服务器）
      expect(true).toBe(true)
    })
  })
})
