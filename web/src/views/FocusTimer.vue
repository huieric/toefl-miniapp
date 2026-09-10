<template>
  <div class="focus-page">
    <div class="focus-header">
      <el-button text @click="$router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🌳 专注森林</h2>
      <div class="header-spacer" />
    </div>

    <div v-loading="loading" class="focus-content">
      <template v-if="!loading && options">
        <!-- 当前树类型 -->
        <div class="tree-display">
          <div class="tree-icon">{{ currentTree.icon }}</div>
          <div class="tree-name">{{ currentTree.name }}</div>
          <div class="tree-progress">
            <div class="tree-progress-bar">
              <div class="tree-progress-fill" :style="{ width: treeProgressPercent + '%' }" />
            </div>
            <span class="tree-progress-text">{{ totalSessions }} / {{ nextTree.minSessions }} 次专注</span>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon">🌱</div>
            <div class="stat-value">{{ totalSessions }}</div>
            <div class="stat-label">专注次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ totalMinutes }}</div>
            <div class="stat-label">专注分钟</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ avgDuration }}</div>
            <div class="stat-label">平均时长</div>
          </div>
        </div>

        <!-- 时长选择 -->
        <div class="duration-section" v-if="!activeSession">
          <h3>选择专注时长</h3>
          <div class="duration-grid">
            <button
              v-for="d in options.durations"
              :key="d"
              class="duration-btn"
              :class="{ 'selected': selectedDuration === d }"
              @click="selectedDuration = d"
            >
              {{ d }} 分钟
            </button>
          </div>
          <button class="start-btn" :disabled="!selectedDuration" @click="startFocus">
            🌱 开始专注
          </button>
        </div>

        <!-- 进行中的专注 -->
        <div v-if="activeSession" class="active-focus">
          <div class="timer-display">
            <div class="timer-circle">
              <svg class="timer-svg" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" class="timer-bg" />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  class="timer-progress"
                  :style="{ strokeDashoffset: timerOffset }"
                  :class="timerColorClass"
                />
                <text x="100" y="90" text-anchor="middle" class="timer-text-main">{{ timerMinutes }}:{{ timerSeconds }}</text>
                <text x="100" y="115" text-anchor="middle" class="timer-text-sub">{{ sessionDuration }} 分钟专注</text>
              </svg>
            </div>
            <div class="timer-tree">{{ currentTree.icon }}</div>
          </div>

          <div class="timer-actions">
            <button class="action-btn complete-btn" @click="completeFocus">✅ 完成专注</button>
            <button class="action-btn abort-btn" @click="abortFocus">❌ 放弃</button>
          </div>

          <div class="timer-hint">
            💡 坚持到底可以种一棵树，获得 XP 奖励！
          </div>
        </div>

        <!-- 历史最近记录 -->
        <div class="history-section">
          <h3>最近专注</h3>
          <div v-if="recentHistory.length === 0" class="empty-history">
            暂无专注记录，开始你的第一次专注吧！
          </div>
          <div v-else class="history-list">
            <div v-for="h in recentHistory.slice(0, 5)" :key="h.id" class="history-item">
              <span class="history-icon">{{ currentTree.icon }}</span>
              <span class="history-duration">{{ h.actualMinutes }} / {{ h.duration }} 分钟</span>
              <span class="history-time">{{ formatTime(h.finishedAt || h.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 全部树类型 -->
        <div class="all-trees-section">
          <h3>🌲 全部树种</h3>
          <div class="trees-grid">
            <div
              v-for="(tree, i) in allTrees"
              :key="i"
              class="tree-item"
              :class="{ 'unlocked': totalSessions >= tree.minSessions, 'current': tree.name === currentTree.name }"
            >
              <span class="tree-item-icon">{{ tree.icon }}</span>
              <span class="tree-item-name">{{ tree.name }}</span>
              <span class="tree-item-req">{{ tree.minSessions }} 次</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { focusAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const options = ref(null)
const activeSession = ref(null)
const selectedDuration = ref(25)
const recentHistory = ref([])
let timerInterval = null

const allTrees = [
  { name: '树苗', icon: '🌱', minSessions: 0 },
  { name: '小花', icon: '🌸', minSessions: 5 },
  { name: '小树', icon: '🌳', minSessions: 15 },
  { name: '桃树', icon: '🍑', minSessions: 30 },
  { name: '银杏', icon: '🌿', minSessions: 50 },
  { name: '樱花', icon: '🌺', minSessions: 100 },
  { name: '神树', icon: '✨', minSessions: 200 },
]

const currentTree = computed(() => options.value?.currentTree || allTrees[0])
const totalSessions = computed(() => options.value?.totalSessions || 0)
const totalMinutes = computed(() => 0)
const avgDuration = computed(() => 0)
const nextTree = computed(() => {
  for (const tree of allTrees) {
    if (totalSessions.value < tree.minSessions) return tree
  }
  return allTrees[allTrees.length - 1]
})
const treeProgressPercent = computed(() => {
  const next = nextTree.value
  const prev = allTrees[allTrees.findIndex(t => t.name === currentTree.value.name) - 1]
  const prevReq = prev ? prev.minSessions : 0
  return Math.min(((totalSessions.value - prevReq) / (next.minSessions - prevReq)) * 100, 100)
})

const sessionDuration = ref(0)
const elapsedSeconds = ref(0)

const timerMinutes = computed(() => Math.floor(elapsedSeconds.value / 60).toString().padStart(2, '0'))
const timerSeconds = computed(() => (elapsedSeconds.value % 60).toString().padStart(2, '0'))

const circumference = 2 * Math.PI * 90
const timerOffset = computed(() => {
  if (!activeSession.value) return 0
  const progress = Math.min(elapsedSeconds.value / (activeSession.value.duration * 60), 1)
  return circumference * (1 - progress)
})

const timerColorClass = computed(() => {
  const progress = elapsedSeconds.value / (activeSession.value.duration * 60)
  if (progress < 0.5) return 'timer-green'
  if (progress < 0.8) return 'timer-yellow'
  return 'timer-red'
})

const fetchOptions = async () => {
  try {
    const res = await focusAPI.getOptions()
    options.value = res.data?.data
  } catch (e) {
    console.error('获取选项失败:', e)
  }
}

const fetchHistory = async () => {
  try {
    const res = await focusAPI.getHistory()
    recentHistory.value = res.data?.data || []
  } catch (e) {
    console.error('获取历史失败:', e)
  }
}

const startFocus = async () => {
  try {
    const res = await focusAPI.start(selectedDuration.value)
    const data = res.data?.data

    if (data.alreadyStarted) {
      activeSession.value = data.session
      sessionDuration.value = data.session.duration
      startTimer()
      return
    }

    activeSession.value = data
    sessionDuration.value = data.duration
    startTimer()
    ElMessage.success('专注开始！种下一棵树 🌱')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '开始专注失败')
  }
}

const startTimer = () => {
  elapsedSeconds.value = 0
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
    if (elapsedSeconds.value >= sessionDuration.value * 60) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }, 1000)
}

const completeFocus = async () => {
  if (!activeSession.value) return

  try {
    const res = await focusAPI.complete(activeSession.value.id)
    const data = res.data?.data

    clearInterval(timerInterval)
    timerInterval = null
    activeSession.value = null
    elapsedSeconds.value = 0

    if (data.treeUnlocked) {
      ElMessage.success(`🎉 解锁新树种：${data.currentTree.icon} ${data.currentTree.name}！`)
    } else {
      ElMessage.success(`专注完成！获得 ${data.xpReward} XP 🌱`)
    }

    await Promise.all([fetchOptions(), fetchHistory()])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '完成专注失败')
  }
}

const abortFocus = async () => {
  if (!activeSession.value) return

  try {
    await focusAPI.abort(activeSession.value.id)
    clearInterval(timerInterval)
    timerInterval = null
    activeSession.value = null
    elapsedSeconds.value = 0
    ElMessage.info('专注已取消')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '取消专注失败')
  }
}

const formatTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  Promise.all([fetchOptions(), fetchHistory()]).finally(() => {
    loading.value = false
  })
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})
</script>

<style scoped>
.focus-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  background: var(--page-bg);
}
.focus-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.focus-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.header-spacer { flex: 1; }

/* 树展示 */
.tree-display {
  text-align: center;
  padding: 24px;
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--border);
  margin-bottom: 16px;
}
.tree-icon { font-size: 64px; margin-bottom: 8px; }
.tree-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.tree-progress-bar {
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}
.tree-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  border-radius: 4px;
  transition: width 0.5s ease;
}
.tree-progress-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  border: 1px solid var(--border);
}
.stat-icon { font-size: 24px; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.stat-label { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

/* 时长选择 */
.duration-section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.duration-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--text-primary);
}
.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.duration-btn {
  padding: 10px 4px;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.duration-btn.selected {
  border-color: #4CAF50;
  background: #E8F5E9;
  color: #2E7D32;
}
.start-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4CAF50, #81C784);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 进行中的专注 */
.active-focus {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  text-align: center;
}
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.timer-circle {
  width: 200px;
  height: 200px;
  position: relative;
}
.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.timer-bg {
  fill: none;
  stroke: var(--bg);
  stroke-width: 8;
}
.timer-progress {
  fill: none;
  stroke: #4CAF50;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 565.48;
  transition: stroke-dashoffset 1s linear;
}
.timer-progress.timer-yellow { stroke: #FFC107; }
.timer-progress.timer-red { stroke: #FF5722; }
.timer-text-main {
  font-size: 28px;
  font-weight: 800;
  fill: var(--text-primary);
  text-anchor: middle;
  transform: rotate(90deg);
  transform-origin: center;
}
.timer-text-sub {
  font-size: 11px;
  fill: var(--text-secondary);
  text-anchor: middle;
  transform: rotate(90deg);
  transform-origin: center;
}
.timer-tree {
  font-size: 48px;
  margin-top: 12px;
}
.timer-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.complete-btn {
  background: #E8F5E9;
  color: #2E7D32;
  border: 2px solid #81C784;
}
.abort-btn {
  background: #FFEBEE;
  color: #C62828;
  border: 2px solid #EF9A9A;
}
.timer-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* 历史 */
.history-section, .all-trees-section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.history-section h3, .all-trees-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.empty-history {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px 0;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg);
  border-radius: 10px;
}
.history-icon { font-size: 20px; }
.history-duration {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.history-time {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 全部树种 */
.trees-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.tree-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 10px;
  background: var(--bg);
  border: 1px solid var(--border);
}
.tree-item.unlocked {
  opacity: 1;
}
.tree-item:not(.unlocked) {
  opacity: 0.4;
}
.tree-item.current {
  border-color: #4CAF50;
  background: #E8F5E9;
}
.tree-item-icon { font-size: 24px; }
.tree-item-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}
.tree-item-req {
  font-size: 10px;
  color: var(--text-secondary);
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .duration-grid { grid-template-columns: repeat(3, 1fr); }
  .trees-grid { grid-template-columns: repeat(3, 1fr); }
  .timer-circle { width: 180px; height: 180px; }
}

@media (max-width: 480px) {
  .duration-grid { grid-template-columns: repeat(2, 1fr); }
  .trees-grid { grid-template-columns: repeat(2, 1fr); }
  .timer-circle { width: 160px; height: 160px; }
  .stats-cards { grid-template-columns: repeat(3, 1fr); }
}
</style>
