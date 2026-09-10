import { config } from '@vue/test-utils'

// Global test setup for Vue component testing
config.global.stubs = {
  // Stub ElMessage to avoid Element Plus injection issues
  ElMessage: false,
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock navigator.language
Object.defineProperty(global.navigator, 'language', {
  value: 'zh-CN',
  writable: true,
})
