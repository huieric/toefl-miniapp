<template>
  <div class="page-container analytics-page">
    <div class="page-header">
      <el-button text @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📊 学习数据报告</h2>
      <div class="header-spacer" />
    </div>

    <div class="analytics-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon">⏱️</div>
          <div class="card-value">{{ totalStudyMinutes }}</div>
          <div class="card-label">总学习时长 (分钟)</div>
        </div>
        <div class="overview-card">
          <div class="card-icon">📚</div>
          <div class="card-value">{{ weekSessions }}</div>
          <div class="card-label">本周课程</div>
        </div>
        <div class="overview-card">
          <div class="card-icon">📈</div>
          <div class="card-value">{{ weekChange }}%</div>
          <div class="card-label">周环比</div>
        </div>
        <div class="overview-card">
          <div class="card-icon">🎯</div>
          <div class="card-value">{{ avgScore }}%</div>
          <div class="card-label">平均分数</div>
        </div>
      </div>

      <!-- 学习曲线 -->
      <div class="chart-section">
        <h3>📈 30 天学习曲线</h3>
        <div class="chart-container">
          <div class="chart-bar" v-for="(day, idx) in studyCurve" :key="idx">
            <div class="bar-fill" :style="{ height: (day.minutes / 60 * 100) + '%' }"></div>
            <div class="bar-label">{{ day.study_date.slice(5) }}</div>
          </div>
        </div>
      </div>

      <!-- 技能掌握地图 -->
      <div class="skill-map-section">
        <h3>🗺️ 技能掌握地图</h3>
        <div class="skills-grid">
          <div v-for="skill in skills" :key="skill.id" class="skill-item">
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-level">{{ skill.level }}%</span>
            </div>
            <div class="skill-bar">
              <div class="skill-fill" :style="{ width: skill.level + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 科目统计 -->
      <div class="subject-stats">
        <h3>📊 各科练习统计</h3>
        <div class="stats-grid">
          <div v-for="stat in subjectStats" :key="stat.subject" class="stat-card">
            <h4>{{ getSubjectName(stat.subject) }}</h4>
            <div class="stat-detail">
              <span>课程：{{ stat.session_count }}</span>
              <span>平均分：{{ stat.avg_score?.toFixed(1) || 'N/A' }}</span>
              <span>最高分：{{ stat.max_score?.toFixed(1) || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 周报 -->
      <div class="weekly-report">
        <h3>📋 周报概览</h3>
        <div class="report-content">
          <div class="report-trend" :class="trend">
            <span class="trend-icon">{{ trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️' }}</span>
            <span class="trend-text">
              {{ trend === 'up' ? '比上周进步' : trend === 'down' ? '比上周退步' : '与上周持平' }} {{ Math.abs(weekChange) }}%
            </span>
          </div>
          <div class="report-summary">
            <p>本周完成 {{ weekSessions }} 次课程，总学习 {{ totalStudyMinutes }} 分钟。</p>
            <p>平均得分 {{ avgScore }}%，继续保持！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { learningAnalyticsAPI } from '@/api'

const totalStudyMinutes = ref(0)
const weekSessions = ref(0)
const weekChange = ref(0)
const avgScore = ref(0)
const studyCurve = ref([])
const skills = ref([])
const subjectStats = ref([])
const trend = ref('stable')

onMounted(async () => {
  await loadOverview()
  loadSkillMap()
})

const loadOverview = async () => {
  try {
    const res = await learningAnalyticsAPI.getOverview()
    const data = res.data?.data || {}
    totalStudyMinutes.value = data.totalStudyMinutes || 0
    studyCurve.value = data.studyCurve || []
    subjectStats.value = data.subjectStats || []
  } catch {
    // Mock data
    totalStudyMinutes.value = 1250
    subjectStats.value = [
      { subject: 'reading', session_count: 45, avg_score: 78.5, max_score: 95 },
      { subject: 'listening', session_count: 38, avg_score: 72.3, max_score: 90 },
      { subject: 'speaking', session_count: 25, avg_score: 68.7, max_score: 85 },
      { subject: 'writing', session_count: 20, avg_score: 75.2, max_score: 88 },
    ]
  }

  try {
    const report = await learningAnalyticsAPI.getWeeklyReport()
    const data = report.data?.data || {}
    weekSessions.value = data.currentWeek?.sessions || 0
    weekChange.value = data.weekChange || 0
    avgScore.value = data.currentWeek?.avgScore?.toFixed(0) || 0
    trend.value = data.trend || 'stable'
  } catch {
    weekSessions.value = 12
    weekChange.value = 15
    avgScore.value = 75
  }
}

const loadSkillMap = async () => {
  try {
    const res = await learningAnalyticsAPI.getSkillMap()
    skills.value = res.data?.data?.skills || []
  } catch {
    // Mock data
    skills.value = [
      { id: 'reading-speed', name: '阅读速度', level: 65 },
      { id: 'reading-vocab', name: '阅读词汇', level: 58 },
      { id: 'listening-detail', name: '听力细节捕捉', level: 72 },
      { id: 'listening-gist', name: '听力主旨理解', level: 68 },
      { id: 'speaking-fluency', name: '口语流利度', level: 60 },
      { id: 'speaking-pronunciation', name: '口语发音', level: 75 },
      { id: 'writing-grammar', name: '写作语法', level: 70 },
      { id: 'writing-structure', name: '写作结构', level: 52 },
    ]
  }
}

const getSubjectName = (subject) => {
  const map = { reading: '📖 阅读', listening: '🎧 听力', speaking: '🎤 口语', writing: '✍️ 写作' }
  return map[subject] || subject
}
</script>

<style scoped>
.analytics-page {
  max-width: 1000px;
  margin: 0 auto;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #4a6cf7;
}

.card-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-section,
.skill-map-section,
.subject-stats,
.weekly-report {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-section h3,
.skill-map-section h3,
.subject-stats h3,
.weekly-report h3 {
  margin-bottom: 16px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 150px;
  padding: 16px 0;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #4a6cf7, #6366f1);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
  min-height: 4px;
}

.bar-label {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.skill-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.skill-name {
  font-weight: 500;
  color: #333;
}

.skill-level {
  font-weight: 600;
  color: #4a6cf7;
}

.skill-bar {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7, #10b981);
  border-radius: 4px;
  transition: width 0.5s;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-card h4 {
  margin: 0 0 12px;
  color: #333;
}

.stat-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.report-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.report-trend.up { background: #ecfdf5; color: #059669; }
.report-trend.down { background: #fef2f2; color: #dc2626; }
.report-trend.stable { background: #f0f9ff; color: #0284c7; }

.trend-text {
  font-weight: 500;
}

.report-summary p {
  margin: 4px 0;
  color: #666;
}
</style>
