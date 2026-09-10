<template>
  <div class="mastery-page">
    <div class="mastery-header">
      <el-button text @click="$router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📊 技能掌握</h2>
      <div class="header-spacer" />
    </div>

    <div v-loading="loading" class="mastery-content">
      <template v-if="!loading && masteryData">
        <!-- 科目选择 -->
        <div class="subject-tabs">
          <button
            v-for="s in subjects"
            :key="s.key"
            class="subject-tab"
            :class="{ active: activeSubject === s.key }"
            @click="activeSubject = s.key; fetchSkillMastery(s.key)"
          >
            <span class="tab-icon">{{ s.icon }}</span>
            <span>{{ s.label }}</span>
          </button>
        </div>

        <!-- 总体正确率 -->
        <div class="overall-stats">
          <div class="overall-circle">
            <svg viewBox="0 0 120 120" class="accuracy-ring">
              <circle cx="60" cy="60" r="50" class="ring-bg" />
              <circle
                cx="60"
                cy="60"
                r="50"
                class="ring-progress"
                :stroke="accuracyColor"
                :style="{ strokeDashoffset: ringOffset }"
              />
              <text x="60" y="55" text-anchor="middle" class="ring-text-value">{{ masteryData.overallAccuracy }}%</text>
              <text x="60" y="72" text-anchor="middle" class="ring-text-label">总体正确率</text>
            </svg>
          </div>
          <div class="overall-detail">
            <div class="detail-item">
              <span class="detail-label">最强技能</span>
              <span class="detail-value">{{ masteryData.strongestSkill?.name }} ({{ masteryData.strongestSkill?.accuracy }}%)</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">需提升</span>
              <span class="detail-value">{{ masteryData.weakestSkill?.name }} ({{ masteryData.weakestSkill?.accuracy }}%)</span>
            </div>
          </div>
        </div>

        <!-- 技能雷达图 -->
        <div class="radar-section" v-if="masteryData.skills.length > 0">
          <h3>技能雷达</h3>
          <div ref="radarChart" class="chart-container" />
        </div>

        <!-- 技能列表 -->
        <div class="skills-list">
          <div
            v-for="skill in masteryData.skills"
            :key="skill.key"
            class="skill-card"
            :class="`level-${skill.masteryLevel}`"
          >
            <div class="skill-header">
              <span class="skill-icon">{{ skill.icon }}</span>
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-level">{{ getLevelLabel(skill.masteryLevel) }}</span>
            </div>
            <div class="skill-bar">
              <div class="skill-bar-track">
                <div class="skill-bar-fill" :style="{ width: skill.accuracy + '%', background: getLevelColor(skill.masteryLevel) }" />
              </div>
              <div class="skill-stats">
                <span class="skill-accuracy">{{ skill.accuracy }}%</span>
                <span class="skill-count">{{ skill.total }} 题</span>
                <span v-if="skill.avgTime" class="skill-time">{{ skill.avgTime }}s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="mastery-footer">
          <p>💡 每个技能至少完成 3 题才会显示掌握度</p>
          <p>🎯 建议优先提升掌握度低于 60% 的技能</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { skillMasteryAPI } from '@/api'

const loading = ref(true)
const masteryData = ref(null)
const activeSubject = ref('reading')
const radarChart = ref(null)
let chartInstance = null

const subjects = [
  { key: 'reading', label: '阅读', icon: '📖' },
  { key: 'listening', label: '听力', icon: '🎧' },
  { key: 'speaking', label: '口语', icon: '🗣️' },
  { key: 'writing', label: '写作', icon: '✍️' },
]

const accuracyColor = computed(() => {
  const acc = masteryData.value?.overallAccuracy || 0
  if (acc >= 80) return '#4CAF50'
  if (acc >= 60) return '#FFC107'
  return '#FF5722'
})

const ringOffset = computed(() => {
  const circumference = 2 * Math.PI * 50
  const progress = (masteryData.value?.overallAccuracy || 0) / 100
  return circumference * (1 - progress)
})

const fetchSkillMastery = async (subject) => {
  try {
    const res = await skillMasteryAPI.getBySubject(subject)
    masteryData.value = res.data?.data
    await nextTick()
    renderRadarChart()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载技能数据失败')
  }
}

const renderRadarChart = () => {
  if (!radarChart.value || !masteryData.value) return

  if (chartInstance) chartInstance.dispose()

  const skills = masteryData.value.skills.filter(s => s.total > 0)
  if (skills.length === 0) return

  chartInstance = echarts.init(radarChart.value)
  chartInstance.setOption({
    radar: {
      indicator: skills.map(s => ({ name: s.name, max: 100 })),
      radius: '65%',
      axisName: { color: 'var(--text-secondary)', fontSize: 11 },
      splitArea: {
        areaStyle: {
          color: ['rgba(76,175,80,0.05)', 'rgba(76,175,80,0.1)', 'rgba(76,175,80,0.15)', 'rgba(76,175,80,0.2)'],
        },
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: skills.map(s => s.accuracy),
        name: '掌握度',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(76,175,80,0.4)' },
            { offset: 1, color: 'rgba(76,175,80,0.1)' },
          ]),
        },
        lineStyle: { color: '#4CAF50', width: 2 },
        itemStyle: { color: '#4CAF50' },
      }],
    }],
  })
}

const getLevelLabel = (level) => {
  const labels = {
    master: '🏆 精通',
    proficient: '💪 熟练',
    intermediate: '👍 中等',
    beginner: '🌱 入门',
    struggling: '⚠️ 薄弱',
    learning: '📚 学习中',
    not_started: '⬜ 未练习',
  }
  return labels[level] || '⬜ 未练习'
}

const getLevelColor = (level) => {
  const colors = {
    master: '#4CAF50',
    proficient: '#8BC34A',
    intermediate: '#FFC107',
    beginner: '#FF9800',
    struggling: '#FF5722',
    learning: '#9E9E9E',
    not_started: '#E0E0E0',
  }
  return colors[level] || '#E0E0E0'
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  fetchSkillMastery('reading').finally(() => {
    loading.value = false
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) chartInstance.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.mastery-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  background: var(--page-bg);
}
.mastery-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.mastery-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.header-spacer { flex: 1; }

/* 科目标签 */
.subject-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.subject-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--card-bg);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}
.subject-tab.active {
  border-color: #4CAF50;
  background: #E8F5E9;
  color: #2E7D32;
}
.subject-tab .tab-icon { font-size: 20px; }

/* 总体统计 */
.overall-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.overall-circle {
  flex-shrink: 0;
}
.accuracy-ring {
  width: 120px;
  height: 120px;
}
.ring-bg {
  fill: none;
  stroke: var(--bg);
  stroke-width: 8;
}
.ring-progress {
  fill: none;
  stroke: #4CAF50;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 314.16;
  transition: stroke-dashoffset 0.8s ease;
}
.ring-text-value {
  font-size: 24px;
  font-weight: 800;
  fill: var(--text-primary);
  text-anchor: middle;
}
.ring-text-label {
  font-size: 10px;
  fill: var(--text-secondary);
  text-anchor: middle;
}
.overall-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 11px;
  color: var(--text-secondary);
}
.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 雷达图 */
.radar-section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.radar-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.chart-container {
  width: 100%;
  height: 260px;
}

/* 技能列表 */
.skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skill-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-left: 4px solid #E0E0E0;
}
.skill-card.level-master { border-left-color: #4CAF50; }
.skill-card.level-proficient { border-left-color: #8BC34A; }
.skill-card.level-intermediate { border-left-color: #FFC107; }
.skill-card.level-beginner { border-left-color: #FF9800; }
.skill-card.level-struggling { border-left-color: #FF5722; }
.skill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.skill-icon { font-size: 18px; }
.skill-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.skill-level {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.skill-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.skill-bar-track {
  flex: 1;
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}
.skill-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.skill-stats {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.skill-accuracy { font-weight: 700; color: var(--text-primary); }

/* 底部 */
.mastery-footer {
  margin-top: 20px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: center;
}
.mastery-footer p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .overall-stats { flex-direction: column; text-align: center; }
  .accuracy-ring { width: 100px; height: 100px; }
  .chart-container { height: 220px; }
}

@media (max-width: 480px) {
  .accuracy-ring { width: 90px; height: 90px; }
  .ring-text-value { font-size: 18px; }
  .skill-stats { font-size: 10px; }
}
</style>
