<template>
  <div class="upload-progress-card" v-if="upload">
    <div class="card-header">
      <div class="header-left">
        <el-icon :size="18" class="icon-spinner" v-if="upload.status === 'processing'"><Loading /></el-icon>
        <el-icon :size="18" class="icon-success" v-else-if="upload.status === 'completed'"><Select /></el-icon>
        <el-icon :size="18" class="icon-error" v-else-if="upload.status === 'failed'"><CircleCloseFilled /></el-icon>
        <span class="upload-name">{{ upload.fileName }}</span>
      </div>
      <div class="header-right">
        <el-tag :type="statusTagType" size="small" effect="plain">{{ statusText }}</el-tag>
        <el-button text size="small" @click="dismiss">关闭</el-button>
      </div>
    </div>

    <el-progress
      :percentage="percentage"
      :stroke-width="10"
      :color="progressColor"
      :status="progressStatus"
    />

    <div class="progress-details">
      <span v-if="upload.status === 'processing'">
        已解析 <strong>{{ upload.parsedPassages || 0 }}</strong> 篇（共 {{ upload.totalPassages || '未知' }} 篇）
        · {{ upload.parsedCount }} 道题
      </span>
      <span v-else-if="upload.status === 'completed'">
        解析完成：共 <strong>{{ upload.passageCount }}</strong> 篇文章（{{ upload.parsedCount }} 道题）
      </span>
      <span v-else-if="upload.status === 'failed'" style="color: var(--danger);">
        解析失败：{{ upload.error || '未知错误' }}
      </span>
      <span v-else style="color: var(--text-secondary);">
        后台解析中，请稍候...
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading, Select, CircleCloseFilled } from '@element-plus/icons-vue'
import { questionAPI } from '@/api'

const STORAGE_KEY = 'toefl_active_upload'
const MAX_AGE_MS = 30 * 60 * 1000 // 30 分钟

const upload = ref(loadFromStorage())
const polling = ref(null)

// 从 localStorage 加载活跃上传
function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // 检查是否过期
    if (Date.now() - (data.timestamp || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveUpload(data) {
  try {
    data.timestamp = Date.now()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // 通知其他标签页
    window.dispatchEvent(new CustomEvent('upload-progress-change', { detail: data }))
  } catch { /* 忽略存储错误 */ }
}

function clearUpload() {
  sessionStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('upload-progress-change'))
}

const statusTagType = computed(() => {
  if (!upload.value) return ''
  if (upload.value.status === 'completed') return 'success'
  if (upload.value.status === 'failed') return 'danger'
  return 'warning'
})

const statusText = computed(() => {
  if (!upload.value) return ''
  if (upload.value.status === 'completed') return '完成'
  if (upload.value.status === 'failed') return '失败'
  return '解析中'
})

const percentage = computed(() => {
  if (!upload.value) return 0
  if (upload.value.status === 'failed') return 0
  if (upload.value.status === 'completed') return 100
  const parsed = upload.value.parsedPassages || 0
  const total = upload.value.totalPassages || 0
  if (total > 0) return Math.min(Math.round((parsed / total) * 100), 99)
  return 30 // 预估进度
})

const progressColor = computed(() => {
  if (!upload.value) return ''
  if (upload.value.status === 'completed') return '#23B26D'
  if (upload.value.status === 'failed') return '#F56C6C'
  return '#4255FF'
})

const progressStatus = computed(() => {
  if (!upload.value) return undefined
  if (upload.value.status === 'completed') return 'success'
  if (upload.value.status === 'failed') return 'exception'
  return undefined
})

// 轮询上传状态
function startPolling() {
  if (!upload.value) return
  polling.value = setInterval(async () => {
    try {
      const res = await questionAPI.uploadStatus(upload.value.id)
      const st = res.data?.data
      if (!st) return
      const updated = { ...st, id: upload.value.id }
      saveUpload(updated)
      if (st.status === 'completed' || st.status === 'failed') {
        stopPolling()
        // 完成后延迟 5 秒自动关闭
        setTimeout(dismiss, 5000)
      }
    } catch {
      // 忽略轮询错误
    }
  }, 3000)
}

function stopPolling() {
  if (polling.value) {
    clearInterval(polling.value)
    polling.value = null
  }
}

function dismiss() {
  stopPolling()
  clearUpload()
}

// 监听其他标签页的进度更新
function onStorageSync(e) {
  if (e.key === STORAGE_KEY) {
    upload.value = e.newValue ? JSON.parse(e.newValue) : null
    if (upload.value && upload.value.status !== 'completed' && upload.value.status !== 'failed') {
      startPolling()
    } else {
      stopPolling()
    }
  }
}

onMounted(() => {
  window.addEventListener('storage', onStorageSync)
  window.addEventListener('upload-progress-change', (e) => {
    upload.value = e.detail || null
    if (upload.value && upload.value.status !== 'completed' && upload.value.status !== 'failed') {
      startPolling()
    } else if (!upload.value) {
      stopPolling()
    }
  })
  if (upload.value) startPolling()
})

onUnmounted(() => stopPolling())
</script>

<style scoped>
.upload-progress-card {
  background: linear-gradient(135deg, #f0f7ff, #f8fbff);
  border: 1px solid #d4e4ff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.upload-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.icon-spinner {
  color: #4255FF;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.icon-success { color: #23B26D; }
.icon-error { color: #F56C6C; }
.progress-details {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.progress-details strong {
  color: var(--text-primary);
}
</style>
