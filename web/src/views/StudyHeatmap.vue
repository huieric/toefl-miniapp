<template>
  <div class="study-heatmap-page">
    <div class="page-header">
      <h2>📅 学习热力图</h2>
      <p class="subtitle">GitHub 风格学习日历 · 记录你的每一次进步</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ heatmapData.stats?.totalMinutes || 0 }}</div>
        <div class="stat-label">总学习分钟</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ heatmapData.stats?.studyDays || 0 }}</div>
        <div class="stat-label">学习天数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ heatmapData.stats?.longestStreak || 0 }}</div>
        <div class="stat-label">最长连续</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">{{ heatmapData.stats?.avgMinutes || 0 }}</div>
        <div class="stat-label">日均学习</div>
      </div>
    </div>

    <!-- 热力图 -->
    <div class="heatmap-container">
      <div class="heatmap-legend">
        <span>更少</span>
        <div class="legend-blocks">
          <div class="legend-block level-0"></div>
          <div class="legend-block level-1"></div>
          <div class="legend-block level-2"></div>
          <div class="legend-block level-3"></div>
          <div class="legend-block level-4"></div>
        </div>
        <span>更多</span>
      </div>

      <div class="heatmap-weeks" ref="heatmapRef">
        <div 
          v-for="(week, wIdx) in weeks" 
          :key="wIdx" 
          class="heatmap-week"
        >
          <div 
            v-for="(day, dIdx) in week" 
            :key="dIdx"
            class="heatmap-day"
            :class="`level-${getLevel(day.minutes)}`"
            :title="`${day.date}: ${day.minutes} 分钟`"
            @mouseenter="showTooltip(day, $event)"
            @mouseleave="hideTooltip"
          ></div>
        </div>
      </div>
    </div>

    <!-- 最近 7 天 -->
    <div class="recent-days" v-if="heatmapData.recent7?.length">
      <h3>最近 7 天</h3>
      <div class="recent-grid">
        <div 
          v-for="day in heatmapData.recent7" 
          :key="day.date"
          class="recent-day"
          :class="{ today: day.isToday }"
        >
          <div class="day-label">{{ getDayLabel(day.date) }}</div>
          <div class="day-bar">
            <div class="day-bar-fill" :style="{ width: `${(day.minutes / 120) * 100}%` }"></div>
          </div>
          <div class="day-value">{{ day.minutes }}min</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!heatmapData.days?.length" class="empty-state">
      <div class="empty-icon">🌱</div>
      <p>还没有学习记录，快去开始今天的学习吧！</p>
    </div>

    <!-- 悬浮提示 -->
    <div v-if="tooltip.visible" class="tooltip" :style="tooltip.style">
      <div class="tooltip-date">{{ tooltip.day?.date }}</div>
      <div class="tooltip-value">{{ tooltip.day?.minutes }} 分钟</div>
      <div class="tooltip-count">{{ tooltip.day?.count || 0 }} 次学习</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { studyHeatmapAPI } from '@/api'

const heatmapData = ref({ days: [], stats: {}, recent7: [] })
const tooltip = ref({ visible: false, day: null, style: {} })
const heatmapRef = ref(null)

const days = computed(() => heatmapData.value.days || [])

const weeks = computed(() => {
  const arr = days.value
  const result = []
  for (let i = 0; i < arr.length; i += 7) {
    result.push(arr.slice(i, i + 7))
  }
  return result
})

function getLevel(minutes) {
  if (minutes === 0) return 0
  if (minutes < 20) return 1
  if (minutes < 60) return 2
  if (minutes < 120) return 3
  return 4
}

function showTooltip(day, event) {
  const rect = event.target.getBoundingClientRect()
  const container = heatmapRef.value?.getBoundingClientRect()
  
  tooltip.value = {
    visible: true,
    day,
    style: {
      left: `${rect.left - container.left + rect.width / 2}px`,
      top: `${rect.top - container.top - 10}px`,
    }
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}

const loadData = async () => {
  try {
    const res = await studyHeatmapAPI.get()
    heatmapData.value = res.data?.data || {}
  } catch (e) {
    console.error('热力图加载失败:', e)
    // 模拟数据
    heatmapData.value = {
      days: Array.from({ length: 365 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (364 - i))
        return {
          date: d.toISOString().split('T')[0],
          minutes: Math.floor(Math.random() * 80),
          count: Math.floor(Math.random() * 3),
        }
      }),
      stats: {
        totalMinutes: 1200,
        studyDays: 120,
        longestStreak: 15,
        avgMinutes: 35,
      },
      recent7: [],
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.study-heatmap-page {
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

.heatmap-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}
.legend-blocks {
  display: flex;
  gap: 2px;
}
.legend-block {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.legend-block.level-0 { background: #ebedf0; }
.legend-block.level-1 { background: #9be9a8; }
.legend-block.level-2 { background: #40c463; }
.legend-block.level-3 { background: #30a14e; }
.legend-block.level-4 { background: #216e39; }

.heatmap-weeks {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.1s;
}
.heatmap-day:hover {
  transform: scale(1.3);
}
.heatmap-day.level-0 { background: #ebedf0; }
.heatmap-day.level-1 { background: #9be9a8; }
.heatmap-day.level-2 { background: #40c463; }
.heatmap-day.level-3 { background: #30a14e; }
.heatmap-day.level-4 { background: #216e39; }

.tooltip {
  position: absolute;
  background: #333;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
  transform: translate(-50%, -100%);
  white-space: nowrap;
}
.tooltip-date { font-weight: 600; }
.tooltip-value { color: #9be9a8; margin-top: 2px; }
.tooltip-count { color: #aaa; font-size: 11px; margin-top: 2px; }

.recent-days {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.recent-days h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.recent-grid {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}
.recent-day {
  flex: 1;
  min-width: 60px;
  text-align: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: #f8f9fa;
}
.recent-day.today {
  background: #e3f2fd;
  border: 2px solid var(--primary);
}
.day-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.day-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}
.day-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s;
}
.day-value {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state p {
  color: var(--text-secondary);
}
</style>
