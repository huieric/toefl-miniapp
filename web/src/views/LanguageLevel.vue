<template>
  <div class="page-container">
    <div class="page-header">
      <h2>🌐 CEFR 语言等级</h2>
      <p class="subtitle">基于 TOEFL 分数的语言水平评估</p>
    </div>

    <!-- 当前等级卡片 -->
    <div class="level-hero">
      <div class="level-icon">{{ data.cefrLevel.icon }}</div>
      <div class="level-code">{{ data.cefrLevel.code }}</div>
      <div class="level-name">{{ data.cefrLevel.name }}</div>
      <div class="level-xp">
        <span class="xp-num">{{ data.xpPoints }}</span>
        <span class="xp-label">XP 经验值</span>
      </div>
      <div class="level-badge" v-if="data.nextLevel">
        下一级: {{ data.nextLevel.icon }} {{ data.nextLevel.code }} (还需 {{ data.nextLevel.requiredXP }} XP)
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-label">
        <span>升级进度</span>
        <span>{{ data.progressPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: data.progressPercent + '%' }" />
      </div>
      <div class="progress-milestones">
        <span v-for="level in cefrLevels" :key="level.code"
              :class="{ reached: data.xpPoints >= level.minXP, active: level.code === data.cefrLevel.code }">
          {{ level.icon }}{{ level.code }}
        </span>
      </div>
    </div>

    <!-- 四科等级卡片 -->
    <div class="subject-cards">
      <div
        v-for="subject in subjects"
        :key="subject.key"
        class="subject-card"
        :class="{ strong: isSubjectStrong(subject.key) }"
      >
        <div class="subject-icon">{{ subject.icon }}</div>
        <div class="subject-info">
          <div class="subject-name">{{ subject.name }}</div>
          <div class="subject-level">
            <span class="level-tag" :style="{ background: subject.cefr.color }">
              {{ subject.cefr.code }} {{ subject.cefr.name }}
            </span>
          </div>
          <div class="subject-score">{{ subject.score }} 分</div>
        </div>
        <div class="subject-bar" :style="{ '--pct': scorePercent(subject.score) + '%' }">
          <div class="subject-bar-fill" />
        </div>
      </div>
    </div>

    <!-- 徽章墙 -->
    <div class="badges-section">
      <h3>🏅 成就徽章</h3>
      <div class="badges-grid" v-if="data.badges?.length">
        <div v-for="b in data.badges" :key="b.id" class="badge-item">
          <span class="badge-icon">{{ b.icon }}</span>
          <span class="badge-name">{{ b.name }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <span class="empty-icon">🔓</span>
        <p>继续学习解锁成就徽章！</p>
      </div>
    </div>

    <!-- 等级对比图 -->
    <div class="comparison-section" v-if="comparison">
      <h3>📊 四科对比</h3>
      <div ref="chartRef" style="width: 100%; height: 300px;" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { languageLevelAPI } from '@/api'

const data = ref({
  xpPoints: 0,
  level: 1,
  cefrLevel: { code: 'A1', name: '入门', icon: '🌱', color: '#4CAF50' },
  nextLevel: null,
  progressPercent: 0,
  totalScore: 0,
  subjectLevels: {},
  badges: [],
})

const comparison = ref(null)
const chartRef = ref(null)
let chart = null

const cefrLevels = [
  { code: 'A1', icon: '🌱', minXP: 0, name: '入门' },
  { code: 'A2', icon: '🌿', minXP: 300, name: '基础' },
  { code: 'B1', icon: '🌳', minXP: 800, name: '中级' },
  { code: 'B2', icon: '🏔️', minXP: 1500, name: '中高级' },
  { code: 'C1', icon: '⭐', minXP: 2500, name: '高级' },
  { code: 'C2', icon: '👑', minXP: 4000, name: '精通' },
]

const subjects = computed(() => [
  { key: 'reading', name: '阅读', icon: '📖', score: parseFloat(data.value.subjectLevels?.reading?.min || 0), cefr: { code: 'A1', name: '入门' } },
  { key: 'listening', name: '听力', icon: '🎧', score: parseFloat(data.value.subjectLevels?.listening?.min || 0), cefr: { code: 'A1', name: '入门' } },
  { key: 'speaking', name: '口语', icon: '🎤', score: parseFloat(data.value.subjectLevels?.speaking?.min || 0), cefr: { code: 'A1', name: '入门' } },
  { key: 'writing', name: '写作', icon: '✍️', score: parseFloat(data.value.subjectLevels?.writing?.min || 0), cefr: { code: 'A1', name: '入门' } },
])

const isSubjectStrong = (key) => {
  const sl = data.value.subjectLevels?.[key]
  return sl && sl.max >= 180
}

const scorePercent = (score) => Math.min((score / 30) * 100, 100)

const fetchLevel = async () => {
  try {
    const res = await languageLevelAPI.getLevel()
    data.value = res.data?.data || {}

    // 更新 subjects 数据
    subjects.value[0].cefr = data.value.subjectLevels?.reading || { code: 'A1', name: '入门' }
    subjects.value[1].cefr = data.value.subjectLevels?.listening || { code: 'A1', name: '入门' }
    subjects.value[2].cefr = data.value.subjectLevels?.speaking || { code: 'A1', name: '入门' }
    subjects.value[3].cefr = data.value.subjectLevels?.writing || { code: 'A1', name: '入门' }
  } catch (e) {
    console.warn('获取等级失败:', e)
  }
}

const fetchComparison = async () => {
  try {
    const res = await languageLevelAPI.getComparison()
    comparison.value = res.data?.data || null
    renderChart()
  } catch (e) {
    console.warn('获取对比数据失败:', e)
  }
}

const renderChart = () => {
  if (!chartRef.value || !comparison.value) return
  
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)

  const opt = {
    radar: {
      indicator: [
        { name: '阅读', max: 30 },
        { name: '听力', max: 30 },
        { name: '口语', max: 30 },
        { name: '写作', max: 30 },
      ],
      shape: 'circle',
      splitNumber: 5,
      axisName: { color: 'var(--text-primary)' },
      splitArea: { areaStyle: { color: ['transparent', 'var(--border)', 'transparent', 'var(--border)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'var(--border)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [comparison.value.reading, comparison.value.listening, comparison.value.speaking, comparison.value.writing],
        name: '当前水平',
        lineStyle: { color: '#4CAF50', width: 2 },
        itemStyle: { color: '#4CAF50' },
        areaStyle: { color: 'rgba(76, 175, 80, 0.2)' },
      }],
    }],
  }

  chart.setOption(opt)
}

onMounted(() => {
  fetchLevel()
  fetchComparison()
})

watch(comparison, () => {
  setTimeout(renderChart, 100)
})
</script>

<style scoped>
.page-header {
  text-align: center;
  margin-bottom: 20px;
}
.subtitle { color: var(--text-secondary); font-size: 14px; }

/* 等级主卡片 */
.level-hero {
  background: linear-gradient(135deg, var(--primary-color, #4CAF50), #2196F3);
  border-radius: 20px;
  padding: 30px 20px;
  color: white;
  text-align: center;
  margin-bottom: 16px;
}
.level-icon { font-size: 48px; }
.level-code { font-size: 36px; font-weight: 900; }
.level-name { font-size: 18px; opacity: 0.9; }
.level-xp { margin-top: 12px; }
.level-xp .xp-num { font-size: 28px; font-weight: 800; }
.level-xp .xp-label { font-size: 12px; opacity: 0.7; margin-left: 4px; }
.level-badge {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  font-size: 12px;
}

/* 进度条 */
.progress-section { background: var(--card-bg); border-radius: 16px; padding: 16px; border: 1px solid var(--border); margin-bottom: 16px; }
.progress-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.progress-bar { height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-color, #4CAF50), #2196F3); border-radius: 6px; transition: width 0.6s ease; }
.progress-milestones { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); }
.progress-milestones span.reached { color: var(--primary-color, #4CAF50); font-weight: 700; }
.progress-milestones span.active { transform: scale(1.2); color: var(--primary-color, #4CAF50); }

/* 科目卡片 */
.subject-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.subject-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  transition: transform 0.2s;
}
.subject-card.strong { border-color: var(--primary-color, #4CAF50); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15); }
.subject-icon { font-size: 32px; text-align: center; }
.subject-name { font-size: 13px; color: var(--text-secondary); margin: 8px 0 4px; text-align: center; }
.level-tag { display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: 11px; color: white; font-weight: 700; }
.subject-score { text-align: center; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.subject-bar { height: 4px; background: var(--border); border-radius: 2px; margin-top: 8px; overflow: hidden; }
.subject-bar-fill { height: 100%; background: var(--primary-color, #4CAF50); border-radius: 2px; transition: width 0.5s ease; }

/* 徽章墙 */
.badges-section { background: var(--card-bg); border-radius: 16px; padding: 16px; border: 1px solid var(--border); margin-bottom: 16px; }
.badges-section h3 { font-size: 16px; color: var(--text-primary); margin-bottom: 12px; }
.badges-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.badge-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.badge-icon { font-size: 28px; }
.badge-name { font-size: 10px; color: var(--text-secondary); text-align: center; }
.empty-state { text-align: center; padding: 30px 0; }
.empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }

/* 对比图 */
.comparison-section { background: var(--card-bg); border-radius: 16px; padding: 16px; border: 1px solid var(--border); }
.comparison-section h3 { font-size: 16px; color: var(--text-primary); margin-bottom: 12px; }

@media (max-width: 480px) {
  .subject-cards { grid-template-columns: 1fr; }
  .badges-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
