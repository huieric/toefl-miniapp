<template>
  <div class="user-analytics">
    <!-- 用户增长折线图 -->
    <el-card shadow="hover">
      <template #header><span>用户增长趋势</span></template>
      <div ref="growthChart" class="chart-box"></div>
    </el-card>

    <!-- 留存率表格 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header><span>用户留存率</span></template>
      <div class="table-wrap">
        <el-table :data="retentionList" border stripe>
          <el-table-column prop="date_range" label="时间段" min-width="140" />
          <el-table-column prop="new_users" label="新增用户" width="80" />
          <el-table-column prop="day1" label="次日" width="70" />
          <el-table-column prop="day3" label="3日" width="70" />
          <el-table-column prop="day7" label="7日" width="70" />
          <el-table-column prop="day14" label="14日" width="70" />
          <el-table-column prop="day30" label="30日" width="70" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getUsersAnalysis, getRetentionData } from '../api';

const growthChart = ref(null);
const retentionList = ref([]);

onMounted(async () => {
  try {
    const res = await getUsersAnalysis();
    const data = res.data?.data || res.data || [];
    await nextTick();
    if (growthChart.value) {
      const chart = echarts.init(growthChart.value);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['新增', '累计'] },
        xAxis: { type: 'category', data: (data || []).map(i => i.date || '') },
        yAxis: { type: 'value' },
        series: [
          { name: '新增', type: 'bar', data: (data || []).map(i => i.new_users || 0), color: '#4A90D9' },
          { name: '累计', type: 'line', data: (data || []).map(i => i.total || 0), smooth: true, color: '#52C41A' },
        ],
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
      });
    }
  } catch (_) {}

  try {
    const res = await getRetentionData();
    retentionList.value = res.data?.data || res.data || [];
  } catch (_) {}
});
</script>

<style scoped>
.chart-box { height: 360px; }
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 768px) { .chart-box { height: 260px; } }
</style>