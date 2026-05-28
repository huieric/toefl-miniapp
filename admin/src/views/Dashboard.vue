<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in statCards" :key="card.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon">
            <el-icon :size="32" :color="card.color"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.title }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-row :gutter="20" style="margin-top: 20px" class="chart-row">
      <el-col :xs="24" :md="16">
        <el-card shadow="hover">
          <template #header><span>活跃趋势（近30天）</span></template>
          <div ref="trendChart" style="height: 320px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8" class="pie-col">
        <el-card shadow="hover">
          <template #header><span>科目分布</span></template>
          <div ref="pieChart" style="height: 320px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近练习记录 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header><span>最近练习记录</span></template>
      <div class="table-wrap">
        <el-table :data="recentPractices" style="width: 100%">
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column prop="subject" label="科目" width="70" />
          <el-table-column prop="score" label="分数" width="60" />
          <el-table-column prop="accuracy" label="正确率" width="80" />
          <el-table-column prop="duration" label="时长" width="70" />
          <el-table-column prop="created_at" label="时间" min-width="140" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getOverview, getSubjectStats, getUsageData } from '../api';

const trendChart = ref(null);
const pieChart = ref(null);

const statCards = ref([
  { title: '总用户数', value: '--', icon: 'User', color: '#4A90D9' },
  { title: '今日活跃', value: '--', icon: 'DataLine', color: '#52C41A' },
  { title: '今日练习', value: '--', icon: 'Document', color: '#FA8C16' },
  { title: '平均时长(min)', value: '--', icon: 'Timer', color: '#9B59B6' },
]);

const recentPractices = ref([]);

onMounted(async () => {
  try {
    const overview = await getOverview();
    const data = overview.data || overview;
    if (data) {
      statCards.value[0].value = data.total_users || 0;
      statCards.value[1].value = data.daily_active || 0;
      statCards.value[2].value = data.today_practices || 0;
      statCards.value[3].value = data.avg_duration || 0;
    }
  } catch (_) {}

  try {
    const usageData = await getUsageData();
    const list = usageData.data?.data?.trend || usageData.data || [];
    await nextTick();
    if (trendChart.value) {
      const chart = echarts.init(trendChart.value);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: (list || []).map(i => i.date || '') },
        yAxis: { type: 'value' },
        series: [
          { name: '活跃用户', type: 'line', data: (list || []).map(i => i.active || 0), smooth: true, color: '#4A90D9', areaStyle: { color: 'rgba(74,144,217,0.1)' } },
          { name: '练习次数', type: 'line', data: (list || []).map(i => i.practices || 0), smooth: true, color: '#52C41A' },
        ],
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
      });
    }
  } catch (_) {}

  try {
    const subjectData = await getSubjectStats();
    const subjects = subjectData.data?.data || [];
    await nextTick();
    if (pieChart.value) {
      const chart = echarts.init(pieChart.value);
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['50%', '75%'],
          data: subjects.map(s => ({ name: s.subject, value: s.count || 0 })),
          label: { formatter: '{b}\n{d}%' },
        }],
      });
    }
  } catch (_) {}
});
</script>

<style scoped>
.dashboard { }
.stat-card { cursor: pointer; }
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 16px; padding: 24px; }
.stat-value { font-size: 28px; font-weight: 700; color: #333; }
.stat-label { font-size: 14px; color: #999; margin-top: 4px; }
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

@media (max-width: 768px) {
  .stat-row .el-col { margin-bottom: 12px; }
  .stat-card :deep(.el-card__body) { padding: 16px; gap: 12px; }
  .stat-value { font-size: 22px; }
  .stat-label { font-size: 13px; }
  .pie-col { margin-top: 16px; }
}
</style>