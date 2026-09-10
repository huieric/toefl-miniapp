<template>
  <div class="page-container xp-system-page">
    <div class="page-header">
      <el-button text @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>⚡ XP 经验值与等级</h2>
      <div class="header-spacer" />
    </div>

    <div class="xp-content">
      <!-- 等级概览 -->
      <div class="level-overview">
        <div class="level-card">
          <div class="level-icon">
            <span class="level-emoji">{{ currentLevelData.icon }}</span>
          </div>
          <div class="level-info">
            <h2 class="level-title">等级 {{ currentLevelData.level }}</h2>
            <p class="level-name">{{ currentLevelData.name }}</p>
          </div>
        </div>

        <div class="xp-progress">
          <div class="progress-header">
            <span>经验值进度</span>
            <span class="xp-values">{{ currentLevelXP }} / {{ xpPerLevel }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressToNextLevel + '%' }"></div>
          </div>
          <p class="progress-label">距离下一级还需 {{ xpPerLevel - currentLevelXP }} XP</p>
        </div>

        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-icon">💎</div>
            <div class="stat-value">{{ totalXP }}</div>
            <div class="stat-label">总经验值</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ todayXP }}</div>
            <div class="stat-label">今日 XP</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">{{ activeDays }}</div>
            <div class="stat-label">活跃天数</div>
          </div>
        </div>
      </div>

      <!-- XP 获取指南 -->
      <div class="xp-guide">
        <h3>🎯 如何获得 XP</h3>
        <div class="xp-actions">
          <div class="xp-action" v-for="action in xpActions" :key="action.category">
            <div class="action-icon">{{ action.icon }}</div>
            <div class="action-info">
              <span class="action-name">{{ action.name }}</span>
              <span class="action-xp">+{{ action.xp }} XP</span>
            </div>
            <el-button size="small" type="primary" @click="earnXP(action)">
              完成
            </el-button>
          </div>
        </div>
      </div>

      <!-- XP 获取历史 -->
      <div class="xp-history">
        <h3>📜 XP 记录</h3>
        <div class="history-list">
          <div v-for="record in recentXP" :key="record.id" class="history-item">
            <div class="history-icon">{{ getCategoryIcon(record.category) }}</div>
            <div class="history-info">
              <span class="history-desc">{{ record.description }}</span>
              <span class="history-time">{{ formatDate(record.created_at) }}</span>
            </div>
            <span class="history-xp" :class="{ 'xp-positive': record.xp > 0 }">
              {{ record.xp > 0 ? '+' : '' }}{{ record.xp }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { xpSystemAPI } from '@/api'

const xpData = ref({})
const recentXP = ref([])

const totalXP = computed(() => xpData.value.totalXP || 0)
const currentLevel = computed(() => xpData.value.currentLevel || 1)
const currentLevelXP = computed(() => xpData.value.currentLevelXP || 0)
const xpPerLevel = computed(() => xpData.value.xpPerLevel || 1000)
const progressToNextLevel = computed(() => xpData.value.progressToNextLevel || 0)
const todayXP = computed(() => xpData.value.todayXP || 0)
const activeDays = computed(() => xpData.value.activeDays || 0)

const currentLevelData = computed(() => getLevelData(currentLevel.value))

const xpActions = [
  { category: 'practice', name: '完成一篇阅读', xp: 50, icon: '📖' },
  { category: 'practice', name: '完成一组听力', xp: 50, icon: '🎧' },
  { category: 'speaking', name: '完成口语练习', xp: 75, icon: '🎤' },
  { category: 'writing', name: '完成写作练习', xp: 75, icon: '✍️' },
  { category: 'vocab', name: '学习 10 个单词', xp: 30, icon: '📚' },
  { category: 'streak', name: '每日打卡', xp: 20, icon: '🔥' },
]

onMounted(async () => {
  await loadOverview()
  loadXPHistory()
})

const loadOverview = async () => {
  try {
    const res = await xpSystemAPI.getOverview()
    xpData.value = res.data?.data || {}
  } catch (e) {
    // Use mock data
    xpData.value = {
      totalXP: 3500,
      currentLevel: 3,
      xpForCurrentLevel: 2000,
      xpForNextLevel: 3000,
      currentLevelXP: 1500,
      progressToNextLevel: 50,
      xpPerLevel: 1000,
      todayXP: 120,
      activeDays: 15,
    }
  }
}

const loadXPHistory = async () => {
  try {
    const res = await xpSystemAPI.getOverview()
    recentXP.value = res.data?.data?.recentXP || []
  } catch {
    // Use mock data
    recentXP.value = [
      { id: 1, category: 'practice', description: '完成阅读练习 +50 XP', xp: 50, created_at: new Date().toISOString() },
      { id: 2, category: 'vocab', description: '学习词汇 +30 XP', xp: 30, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, category: 'streak', description: '每日打卡 +20 XP', xp: 20, created_at: new Date(Date.now() - 7200000).toISOString() },
    ]
  }
}

const earnXP = async (action) => {
  try {
    const res = await xpSystemAPI.earn(action)
    if (res.data?.data?.leveledUp) {
      ElMessage.success(`🎉 升级！新等级：${getLevelData(res.data.data.newLevel).name}`)
    } else {
      ElMessage.success(`+${res.data.data.xpEarned} XP`)
    }
    await loadOverview()
  } catch (e) {
    ElMessage.success(`+${action.xp} XP (模拟)`)
    currentLevelXP.value += action.xp
    if (currentLevelXP.value >= xpPerLevel.value) {
      ElMessage.success('🎉 升级！')
      currentLevel.value++
      currentLevelXP.value = 0
    }
  }
}

const getCategoryIcon = (category) => {
  const map = { practice: '📖', vocab: '📚', streak: '🔥', speaking: '🎤', writing: '✍️' }
  return map[category] || '⭐'
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getLevelData = (level) => {
  const levels = {
    1: { name: '新手入门', icon: '🌱' },
    2: { name: '初学乍练', icon: '📚' },
    3: { name: '小有进步', icon: '⭐' },
    4: { name: '突飞猛进', icon: '🚀' },
    5: { name: 'TOEFL 战士', icon: '⚔️' },
    10: { name: '学习大师', icon: '👑' },
  }
  return levels[level] || { name: `等级 ${level}`, icon: '🎖️' }
}
</script>

<style scoped>
.xp-system-page {
  max-width: 800px;
  margin: 0 auto;
}

.level-overview {
  margin-bottom: 20px;
}

.level-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
  margin-bottom: 16px;
}

.level-icon {
  font-size: 48px;
}

.level-title {
  margin: 0;
  font-size: 24px;
}

.level-name {
  margin: 4px 0 0;
  opacity: 0.9;
}

.xp-progress {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.xp-values {
  font-weight: 600;
  color: #4a6cf7;
}

.progress-bar {
  height: 12px;
  background: #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7, #6366f1);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-label {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.xp-guide {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.xp-guide h3 {
  margin-bottom: 16px;
}

.xp-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xp-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.action-icon {
  font-size: 24px;
}

.action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-name {
  font-weight: 500;
}

.action-xp {
  font-size: 12px;
  color: #4a6cf7;
  font-weight: 600;
}

.xp-history {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.xp-history h3 {
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
}

.history-icon {
  font-size: 20px;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-desc {
  font-size: 14px;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-xp {
  font-weight: 600;
  color: #4a6cf7;
}

.xp-positive {
  color: #10b981 !important;
}
</style>
