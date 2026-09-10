<template>
  <div class="report-page">
    <div class="report-header">
      <el-button text @click="$router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📊 学习周报</h2>
      <div class="header-spacer" />
    </div>

    <div v-loading="loading" class="report-content">
      <template v-if="!loading && report">
        <!-- 本周概览 -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="icon">⏱️</div>
            <div class="value">{{ report.weeklySummary.totalMinutes }}</div>
            <div class="label">本周学习（分钟）</div>
          </div>
          <div class="summary-card">
            <div class="icon">📝</div>
            <div class="value">{{ report.weeklySummary.totalQuestions }}</div>
            <div class="label">本周做题</div>
          </div>
          <div class="summary-card">
            <div class="icon">🎯</div>
            <div class="value">{{ Math.round(report.weeklySummary.avgAccuracy) }}%</div>
            <div class="label">平均正确率</div>
          </div>
          <div class="summary-card">
            <div class="icon">📖</div>
            <div class="value">{{ report.weeklySummary.newVocab }}</div>
            <div class="label">新增生词</div>
          </div>
        </div>

        <!-- 每日学习时长趋势 -->
        <div class="chart-section">
          <h3>📈 每日学习时长</h3>
          <div ref="chartMinutes" class="chart-container" />
        </div>

        <!-- 每日做题正确率 -->
        <div class="chart-section">
          <h3>📉 每日做题正确率</h3>
          <div ref="chartAccuracy" class="chart-container" />
        </div>

        <!-- 各科目表现 -->
        <div class="chart-section" v-if="report.subjectStats.length > 0">
          <h3>🎓 各科目表现</h3>
          <div ref="chartSubject" class="chart-container" />
        </div>

        <!-- 考试数据 -->
        <div class="chart-section" v-if="report.weeklySummary.totalExams > 0">
          <h3>🏆 考试统计</h3>
          <div class="exam-stats">
            <div class="exam-stat">
              <div class="exam-value">{{ report.weeklySummary.totalExams }}</div>
              <div class="exam-label">完成考试</div>
            </div>
            <div class="exam-stat">
              <div class="exam-value">{{ Math.round(report.weeklySummary.avgExamScore) }}</div>
              <div class="exam-label">平均分数</div>
            </div>
          </div>
        </div>

        <!-- 连续学习天数 -->
        <div class="chart-section">
          <h3>🔥 连续学习</h3>
          <div class="streak-display">
            <div class="streak-icon">🔥</div>
            <div class="streak-value">{{ streakDays }}</div>
            <div class="streak-label">天连续学习</div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="report-actions">
          <el-button type="primary" @click="$router.push('/dashboard')">
            返回仪表盘
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { userAPI } from '@/api'

const loading = ref(true)
const report = ref(null)
const streakDays = ref(0)
const chartMinutes = ref(null)
const chartAccuracy = ref(null)
const chartSubject = ref(null)
let charts = []

const fetchReport = async () => {
  loading.value = true
  try {
    const res = await userAPI.getWeeklyReport()
    report.value = res.data?.data || null
    await nextTick()
    renderCharts()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载周报失败')
  } finally {
    loading.value = false
  }
}

const fetchStreak = async () => {
  try {
    const res = await userAPI.getStreak()
    streakDays.value = res.data?.data?.streakDays || 0
  } catch (e) {
    // ignore
  }
}

const renderCharts = () => {
  // 销毁旧图表
  charts.forEach(c => c.dispose())
  charts = []

  if (!report.value) return

  // 1. 每日学习时长柱状图
  if (chartMinutes.value) {
    const chart = echarts.init(chartMinutes.value)
    const days = report.value.weekDays.map(d => d.label)
    const minutes = report.value.weekDays.map(d => d.minutes)
    chart.setOption({
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '分钟' },
      series: [{
        type: 'bar',
        data: minutes.map((v, i) => ({
          value: v,
          itemStyle: {
            color: i === minutes.length - 1
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#4CAF50' },
                  { offset: 1, color: '#81C784' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#2196F3' },
                  { offset: 1, color: '#64B5F6' }
                ])
          }
        }))
      }],
      visualMap: { show: false }
    })
    charts.push(chart)
  }

  // 2. 每日正确率折线图
  if (chartAccuracy.value) {
    const chart = echarts.init(chartAccuracy.value)
    const days = report.value.weekDays.map(d => d.label)
    const accuracy = report.value.weekDays.map(d =>
      d.questions > 0 ? Math.round((d.correct / d.questions) * 100) : 0
    )
    chart.setOption({
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: [{
        type: 'line',
        smooth: true,
        data: accuracy,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(76, 175, 80, 0.4)' },
            { offset: 1, color: 'rgba(76, 175, 80, 0.05)' }
          ])
        },
        lineStyle: { width: 3, color: '#4CAF50' },
        itemStyle: { color: '#4CAF50' }
      }]
    })
    charts.push(chart)
  }

  // 3. 各科目正确率柱状图
  if (chartSubject.value && report.value.subjectStats.length > 0) {
    const chart = echarts.init(chartSubject.value)
    const subjects = report.value.subjectStats.map(s => {
      const names = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
      return names[s.subject] || s.subject
    })
    const accuracies = report.value.subjectStats.map(s => s.accuracy)
    const totals = report.value.subjectStats.map(s => s.total)
    chart.setOption({
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        formatter: params => {
          const idx = params[0].dataIndex
          const s = report.value.subjectStats[idx]
          return `${subjects[idx]}<br/>做题: ${s.total}<br/>正确率: ${s.accuracy}%`
        }
      },
      xAxis: { type: 'category', data: subjects },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: [
        {
          type: 'bar',
          name: '正确率',
          data: accuracies,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF9800' },
              { offset: 1, color: '#FFB74D' }
            ])
          }
        }
      ]
    })
    charts.push(chart)
  }
}

const handleResize = () => {
  charts.forEach(c => c.resize())
}

onMounted(() => {
  fetchReport()
  fetchStreak()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  charts.forEach(c => c.dispose())
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.report-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  background: var(--page-bg);
}
.report-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.report-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.header-spacer { flex: 1; }

/* 概览卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.summary-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  border: 1px solid var(--border);
}
.summary-card .icon { font-size: 24px; margin-bottom: 6px; }
.summary-card .value { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.summary-card .label { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

/* 图表区域 */
.chart-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.chart-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.chart-container {
  width: 100%;
  height: 220px;
}

/* 考试统计 */
.exam-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.exam-stat {
  text-align: center;
  padding: 16px 24px;
  background: var(--bg);
  border-radius: 12px;
}
.exam-value {
  font-size: 28px;
  font-weight: 800;
  color: #2196F3;
}
.exam-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 连续学习 */
.streak-display {
  text-align: center;
  padding: 24px;
}
.streak-icon { font-size: 48px; margin-bottom: 8px; }
.streak-value {
  font-size: 36px;
  font-weight: 800;
  color: #FF6D00;
}
.streak-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 底部按钮 */
.report-actions {
  margin-top: 20px;
  text-align: center;
}
.report-actions .el-button {
  width: 100%;
  height: 44px;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-container {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .summary-card .value {
    font-size: 18px;
  }
  .chart-container {
    height: 180px;
  }
  .chart-section {
    padding: 12px;
  }
}
</style>
