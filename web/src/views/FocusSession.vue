<template>
  <div class="focus-page">
    <div class="page-header">
      <h2>🌳 专注时间线</h2>
      <p class="subtitle">Forest 式专注会话历史</p>
    </div>

    <!-- 树种等级 -->
    <div class="tree-level-card">
      <div class="tree-icon">{{ treeLevel?.icon || '🌱' }}</div>
      <div class="tree-info">
        <div class="tree-name">{{ treeLevel?.name || '幼苗' }}</div>
        <div class="tree-progress">
          <div class="tree-bar">
            <div class="tree-bar-fill" :style="{ width: `${treeProgress}%` }"></div>
          </div>
          <span class="tree-bar-text">{{ completedSessions }} / {{ nextTree?.required || 0 }} 次专注</span>
        </div>
      </div>
      <div class="tree-visual">
        <svg viewBox="0 0 100 100" class="tree-svg">
          <text x="50" y="55" text-anchor="middle" font-size="50">{{ treeLevel?.icon || '🌱' }}</text>
        </svg>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🌲</div>
        <div class="stat-value">{{ stats?.total_sessions || 0 }}</div>
        <div class="stat-label">总会话</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ stats?.completed_sessions || 0 }}</div>
        <div class="stat-label">完成会话</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ stats?.total_minutes || 0 }}</div>
        <div class="stat-label">总分钟</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ stats?.avg_minutes || 0 }}</div>
        <div class="stat-label">平均分钟</div>
      </div>
    </div>

    <!-- 本周统计 -->
    <div class="week-summary">
      <h3>📅 本周统计</h3>
      <div class="week-grid">
        <div class="week-item">
          <div class="week-value">{{ week?.sessions || 0 }}</div>
          <div class="week-label">会话</div>
        </div>
        <div class="week-item">
          <div class="week-value">{{ week?.minutes || 0 }}</div>
          <div class="week-label">分钟</div>
        </div>
        <div class="week-item">
          <div class="week-value">{{ week?.minutes > 0 ? Math.round((week?.minutes || 0) / (week?.sessions || 1)) : 0 }}</div>
          <div class="week-label">平均分钟</div>
        </div>
      </div>
    </div>

    <!-- 每日趋势 -->
    <div class="trend-chart" v-if="trend?.length">
      <h3>📈 最近 7 天趋势</h3>
      <div class="trend-bars">
        <div 
          v-for="t in trend" 
          :key="t.date"
          class="trend-bar-wrapper"
        >
          <div class="trend-bar-value">{{ t.minutes }}m</div>
          <div class="trend-bar" :style="{ height: `${(t.minutes / 120) * 100}%` }"></div>
          <div class="trend-bar-date">{{ getShortDate(t.date) }}</div>
        </div>
      </div>
    </div>

    <!-- 会话时间线 -->
    <div class="timeline">
      <h3>🕐 会话历史</h3>
      
      <div class="timeline-list">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="timeline-item"
          :class="{ today: session.isToday, completed: session.completed }"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-date">{{ session.date }}</span>
              <span class="timeline-time">{{ session.time }}</span>
              <span v-if="session.isToday" class="today-badge">今天</span>
              <span v-if="!session.completed" class="uncompleted-badge">未完成</span>
            </div>
            <div class="timeline-body">
              <div class="timeline-detail">
                <span class="detail-label">计划时长：</span>
                <span class="detail-value">{{ session.duration }} 分钟</span>
              </div>
              <div class="timeline-detail">
                <span class="detail-label">实际时长：</span>
                <span class="detail-value">{{ session.actualMinutes }} 分钟</span>
              </div>
            </div>
            <div class="timeline-status">
              <span v-if="session.completed" class="status-complete">✅ 完成</span>
              <span v-else class="status-incomplete">⏳ 未完成</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!sessions?.length" class="empty-state">
        <div class="empty-icon">🌱</div>
        <p>还没有专注会话，快去开始一次专注吧！</p>
      </div>

      <div v-if="hasMore" class="load-more">
        <el-button @click="loadMore">加载更多</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { focusSessionAPI } from '@/api'

const sessions = ref([])
const stats = ref({})
const week = ref({})
const trend = ref([])
const treeLevel = ref({})
const treeProgress = ref(0)
const hasMore = ref(false)
const completedSessions = ref(0)
const nextTree = ref(null)

const loadData = async () => {
  try {
    const res = await focusSessionAPI.timeline()
    const data = res.data?.data

    sessions.value = data?.sessions || []
    stats.value = data?.stats || {}
    week.value = data?.week || {}
    trend.value = data?.trend || []
    treeLevel.value = data?.treeLevel || {}
    nextTree.value = data?.nextTree || null

    completedSessions.value = stats.value?.completed_sessions || 0

    // 计算树种进度
    if (data?.allTrees) {
      const allTrees = data.allTrees
      const nextTree = allTrees.find(t => !t.unlocked)
      const currentTree = allTrees.filter(t => t.unlocked).pop()
      if (currentTree && nextTree) {
        treeProgress.value = Math.round(
          ((completedSessions.value - currentTree.required) / (nextTree.required - currentTree.required)) * 100
        )
      } else if (currentTree && !nextTree) {
        treeProgress.value = 100
      } else {
        treeProgress.value = 0
      }
    }
  } catch (e) {
    console.error('时间线加载失败:', e)
    // 模拟数据
    sessions.value = [
      { id: 1, duration: 25, actualMinutes: 25, completed: true, isToday: true, date: '2026-01-15', time: '14:30', createdAt: new Date() },
      { id: 2, duration: 30, actualMinutes: 28, completed: true, isToday: false, date: '2026-01-14', time: '10:00', createdAt: new Date() },
      { id: 3, duration: 20, actualMinutes: 15, completed: false, isToday: false, date: '2026-01-13', time: '16:45', createdAt: new Date() },
    ]
    stats.value = { total_sessions: 3, completed_sessions: 2, total_minutes: 53, avg_minutes: 26 }
    week.value = { sessions: 3, minutes: 53 }
    trend.value = [
      { date: '2026-01-09', minutes: 0 },
      { date: '2026-01-10', minutes: 0 },
      { date: '2026-01-11', minutes: 0 },
      { date: '2026-01-12', minutes: 30 },
      { date: '2026-01-13', minutes: 15 },
      { date: '2026-01-14', minutes: 28 },
      { date: '2026-01-15', minutes: 25 },
    ]
    treeLevel.value = { name: '幼苗', icon: '🌱' }
  }
}

const loadMore = async () => {
  try {
    const res = await focusSessionAPI.timeline({ offset: sessions.value.length })
    const more = res.data?.data?.sessions || []
    sessions.value.push(...more)
    hasMore.value = res.data?.data?.hasMore || false
  } catch (e) {
    console.error('加载更多失败:', e)
  }
}

const getShortDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.focus-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 24px;
  margin: 0 0 4px;
}
.subtitle {
  color: var(--text-secondary);
  margin: 0;
}

.tree-level-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}
.tree-icon {
  font-size: 48px;
}
.tree-info {
  flex: 1;
}
.tree-name {
  font-size: 20px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 8px;
}
.tree-progress {
  margin-bottom: 4px;
}
.tree-bar {
  height: 8px;
  background: rgba(255,255,255,0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}
.tree-bar-fill {
  height: 100%;
  background: #4caf50;
  border-radius: 4px;
  transition: width 0.3s;
}
.tree-bar-text {
  font-size: 12px;
  color: #66bb6a;
}
.tree-visual {
  width: 60px;
  height: 60px;
}
.tree-svg {
  width: 100%;
  height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border);
}
.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.week-summary {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.week-summary h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.week-grid {
  display: flex;
  gap: 24px;
  justify-content: center;
}
.week-item {
  text-align: center;
  padding: 12px 24px;
  background: #f8f9fa;
  border-radius: 8px;
}
.week-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}
.week-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.trend-chart {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.trend-chart h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.trend-bars {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  height: 120px;
}
.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}
.trend-bar-value {
  font-size: 11px;
  color: var(--text-secondary);
}
.trend-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(to top, #4caf50, #81c784);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}
.trend-bar-date {
  font-size: 11px;
  color: var(--text-secondary);
}

.timeline {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.timeline h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.timeline-list {
  position: relative;
}
.timeline-list::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}
.timeline-item {
  position: relative;
  padding: 12px 12px 12px 48px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.2s;
}
.timeline-item:hover {
  transform: translateX(4px);
}
.timeline-item.today {
  background: #e3f2fd;
  border: 1px solid #90caf9;
}
.timeline-dot {
  position: absolute;
  left: 14px;
  top: 16px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
}
.timeline-item.today .timeline-dot {
  background: #1976d2;
}
.timeline-item.completed .timeline-dot {
  background: #4caf50;
}
.timeline-content {
  position: relative;
}
.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.timeline-date {
  font-size: 14px;
  font-weight: 600;
}
.timeline-time {
  font-size: 12px;
  color: var(--text-secondary);
}
.today-badge {
  background: #1976d2;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.uncompleted-badge {
  background: #ff9800;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.timeline-body {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.timeline-detail {
  font-size: 13px;
}
.detail-label {
  color: var(--text-secondary);
}
.detail-value {
  font-weight: 600;
}
.timeline-status {
  font-size: 12px;
}
.status-complete { color: #4caf50; }
.status-incomplete { color: #ff9800; }

.load-more {
  text-align: center;
  margin-top: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state p {
  color: var(--text-secondary);
}
</style>
