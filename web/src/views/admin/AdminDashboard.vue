<template>
  <div>
    <h2 class="admin-page-title">数据总览</h2>
    <p class="admin-page-desc">平台核心数据指标（模拟数据）</p>

    <!-- Stat Cards -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="s in statCards" :key="s.label">
        <div class="stat-card">
          <div class="stat-icon" :style="{ color: s.color }"><el-icon :size="24"><component :is="s.icon" /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12">
        <div class="card chart-card">
          <h3 class="chart-title">用户增长趋势</h3>
          <div ref="userChartRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12">
        <div class="card chart-card">
          <h3 class="chart-title">日活跃用户</h3>
          <div ref="activeChartRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :xs="24" :sm="12">
        <div class="card chart-card">
          <h3 class="chart-title">练习时长分布（分钟）</h3>
          <div ref="durationChartRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12">
        <div class="card chart-card">
          <h3 class="chart-title">科目使用分布</h3>
          <div ref="subjectChartRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { User, Clock, Document, ChatDotRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const statCards = ref([
  { label: '用户总数', value: '12,847', color: '#4A90D9', icon: 'User' },
  { label: '日活跃用户', value: '1,203', color: '#67C23A', icon: 'Clock' },
  { label: '练习总时长(h)', value: '38,562', color: '#E6A23C', icon: 'Document' },
  { label: 'AI陪练次数', value: '5,671', color: '#F56C6C', icon: 'ChatDotRound' },
])

const userChartRef = ref(null)
const activeChartRef = ref(null)
const durationChartRef = ref(null)
const subjectChartRef = ref(null)

let charts = []

// 模拟最近 7 天数据
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i)); return `${d.getMonth() + 1}/${d.getDate()}`
})

const initCharts = () => {
  // 用户增长趋势（折线图）
  if (userChartRef.value) {
    const c = echarts.init(userChartRef.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: last7Days, axisTick: { show: false } },
      yAxis: { type: 'value' },
      series: [{
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: [120, 98, 156, 134, 187, 210, 176],
        areaStyle: { color: 'rgba(74,144,217,0.15)' },
        itemStyle: { color: '#4A90D9' },
      }],
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
    })
    charts.push(c)
  }

  // 日活跃用户（柱状图）
  if (activeChartRef.value) {
    const c = echarts.init(activeChartRef.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: last7Days, axisTick: { show: false } },
      yAxis: { type: 'value' },
      series: [{
        name: 'DAU',
        type: 'bar',
        data: [890, 1020, 980, 1100, 1150, 1203, 1180],
        itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      }],
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
    })
    charts.push(c)
  }

  // 练习时长分布（折线图）
  if (durationChartRef.value) {
    const c = echarts.init(durationChartRef.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: last7Days, axisTick: { show: false } },
      yAxis: { type: 'value', name: '分钟' },
      series: [{
        name: '总时长',
        type: 'line',
        smooth: true,
        data: [4200, 5100, 4800, 5600, 6200, 5800, 6100],
        itemStyle: { color: '#E6A23C' },
      }],
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
    })
    charts.push(c)
  }

  // 科目使用分布（饼图）
  if (subjectChartRef.value) {
    const c = echarts.init(subjectChartRef.value)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        data: [
          { value: 4230, name: '阅读', itemStyle: { color: '#4A90D9' } },
          { value: 3890, name: '听力', itemStyle: { color: '#67C23A' } },
          { value: 2150, name: '口语', itemStyle: { color: '#E6A23C' } },
          { value: 2670, name: '写作', itemStyle: { color: '#F56C6C' } },
        ],
        label: { formatter: '{b}\n{d}%', fontSize: 12 },
      }],
    })
    charts.push(c)
  }
}

const handleResize = () => charts.forEach(c => c.resize())

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>

<style scoped>
.admin-page-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.admin-page-desc { color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; }
.stat-row { margin-bottom: 20px; }
.stat-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 10px; padding: 16px;
  margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-icon { flex-shrink: 0; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.chart-card { padding: 16px; }
.chart-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.chart-box { width: 100%; height: 260px; }
</style>
