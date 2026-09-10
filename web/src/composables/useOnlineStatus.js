/**
 * 托福备考助手 — 在线状态 Composable
 *
 * 提供:
 *   1. 网络在线/离线状态
 *   2. 网络类型检测（WiFi/4G/慢速）
 *   3. 联网恢复通知
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

const isOnline = ref(navigator.onLine)
const connectionType = ref(null)

// 网络类型检测
function detectConnection() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (conn) {
    connectionType.value = conn.effectiveType // 'slow-2g', '2g', '3g', '4g'
    conn.addEventListener('change', () => {
      connectionType.value = conn.effectiveType
    })
  }
}

// 监听网络变化
function handleOnline() {
  isOnline.value = true
  // 通知 SW 开始后台同步
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.sync) {
        reg.sync.register('sync-practice-logs').catch(() => {})
      }
    })
  }
}

function handleOffline() {
  isOnline.value = false
}

export function useOnlineStatus() {
  const isWeakConnection = computed(() => {
    const type = connectionType.value
    return type === 'slow-2g' || type === '2g' || type === '3g'
  })

  const connectionLabel = computed(() => {
    const type = connectionType.value
    const labels = { '4g': '4G', '3g': '3G', '2g': '2G', 'slow-2g': '慢速' }
    return labels[type] || (isOnline.value ? '网络正常' : '离线')
  })

  onMounted(() => {
    detectConnection()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline,
    isWeakConnection,
    connectionType,
    connectionLabel,
  }
}
