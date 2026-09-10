<template>
  <div class="achievement-page">
    <!-- XP 头部 -->
    <div class="xp-header">
      <div class="xp-top">
        <div class="xp-avatar">
          <el-avatar :size="56">{{ nickname?.charAt(0) || '👤' }}</el-avatar>
        </div>
        <div class="xp-info">
          <div class="xp-name">{{ nickname || '学习者' }}</div>
          <div class="xp-badge">
            <el-icon><Trophy /></el-icon>
            <span class="level-num">Lv.{{ level }}</span>
          </div>
        </div>
        <div class="xp-bar-container">
          <div class="xp-bar">
            <div class="xp-bar-fill" :style="{ width: xpPercent + '%' }"></div>
          </div>
          <span class="xp-label">{{ xpPoints }} / {{ xpNeeded }} XP</span>
        </div>
      </div>
    </div>

    <!-- 成就统计 -->
    <div class="ach-stats">
      <div class="ach-stat-item">
        <div class="ach-stat-val">{{ totalUnlocked }}</div>
        <div class="ach-stat-label">已解锁</div>
      </div>
      <div class="ach-stat-item">
        <div class="ach-stat-val">{{ totalAvailable }}</div>
        <div class="ach-stat-label">总计</div>
      </div>
      <div class="ach-stat-item">
        <div class="ach-stat-val">{{ rate }}%</div>
        <div class="ach-stat-label">完成率</div>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="ach-tabs">
      <el-radio-group v-model="filterCategory" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="study">学习</el-radio-button>
        <el-radio-button value="quiz">答题</el-radio-button>
        <el-radio-button value="accuracy">正确率</el-radio-button>
        <el-radio-button value="review">复习</el-radio-button>
        <el-radio-button value="overall">综合</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 成就列表 -->
    <div class="ach-list">
      <div
        v-for="ach in filteredAchievements"
        :key="ach.id"
        class="ach-card"
        :class="{ unlocked: ach.unlocked }"
      >
        <div class="ach-icon">{{ ach.unlocked ? ach.icon : '🔒' }}</div>
        <div class="ach-info">
          <div class="ach-title-row">
            <span class="ach-title">{{ ach.title }}</span>
            <span class="ach-xp">+{{ ach.xp_reward }} XP</span>
          </div>
          <div class="ach-desc">{{ ach.desc }}</div>
          <div class="ach-progress">
            <div class="ach-bar-bg">
              <div class="ach-bar-fill" :style="{ width: ach.progress + '%' }"></div>
            </div>
            <span class="ach-pct">{{ ach.progress }}%</span>
          </div>
          <div v-if="ach.unlocked && ach.unlockedAt" class="ach-unlocked-time">
            🔓 已解锁 · {{ formatDate(ach.unlockedAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="filteredAchievements.length === 0" description="暂无成就" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { achievementAPI } from '@/api'

const nickname = ref('')
const level = ref(1)
const xpPoints = ref(0)
const xpNeeded = ref(100)
const totalUnlocked = ref(0)
const totalAvailable = ref(0)
const filterCategory = ref('all')

const achievements = ref([])
const rate = computed(() => totalAvailable.value > 0 ? Math.round((totalUnlocked.value / totalAvailable.value) * 100) : 0)
const xpPercent = computed(() => xpNeeded.value > 0 ? Math.round((xpPoints.value % xpNeeded.value) / xpNeeded.value * 100) : 100)

const filteredAchievements = computed(() => {
  if (filterCategory.value === 'all') return achievements.value
  return achievements.value.filter(a => a.category === filterCategory.value)
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  try {
    const [listRes, profileRes] = await Promise.all([
      achievementAPI.list(),
      achievementAPI.stats(),
    ])
    const profile = await achievementAPI.getProfile()
    if (profile.data?.data) {
      nickname.value = profile.data.data.nickname || ''
      level.value = profile.data.data.level || 1
      xpPoints.value = profile.data.data.xpPoints || 0
    }

    const data = listRes.data?.data || {}
    achievements.value = data.achievements || []
    totalUnlocked.value = data.totalUnlocked || 0
    totalAvailable.value = data.totalAvailable || 0
    xpPoints.value = data.totalXP || 0
    level.value = data.level || 1
    xpNeeded.value = data.xpNeeded || 100
  } catch (e) {
    console.error('加载成就失败:', e)
  }
})
</script>

<style scoped>
.achievement-page {
  min-height: 100vh;
  background: #F5F7FA;
}

.xp-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px 24px;
  color: #fff;
}
.xp-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.xp-avatar .el-avatar {
  background: rgba(255,255,255,0.3);
  color: #fff;
  font-size: 24px;
}
.xp-info {
  flex: 1;
}
.xp-name {
  font-size: 16px;
  font-weight: 700;
}
.xp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.2);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}
.level-num {
  font-weight: 700;
}
.xp-bar-container {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.xp-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: #FFD700;
  border-radius: 4px;
  transition: width 0.3s;
}
.xp-label {
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
}

.ach-stats {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.ach-stat-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border-right: 1px solid #f0f0f0;
}
.ach-stat-item:last-child { border-right: none; }
.ach-stat-val {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
}
.ach-stat-label {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.ach-tabs {
  padding: 12px 16px;
  background: #fff;
}

.ach-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ach-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  transition: all 0.2s;
}
.ach-card.unlocked {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}
.ach-icon {
  font-size: 36px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12px;
  flex-shrink: 0;
}
.ach-card.unlocked .ach-icon {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}
.ach-info {
  flex: 1;
  min-width: 0;
}
.ach-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ach-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.ach-card:not(.unlocked) .ach-title { color: #999; }
.ach-xp {
  font-size: 13px;
  font-weight: 700;
  color: #FFD700;
}
.ach-desc {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.ach-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
.ach-bar-bg {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.ach-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s;
}
.ach-pct {
  font-size: 11px;
  color: #999;
  width: 32px;
  text-align: right;
}
.ach-unlocked-time {
  font-size: 11px;
  color: #667eea;
  margin-top: 4px;
}
</style>
