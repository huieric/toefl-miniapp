<template>
  <div class="usage-trend">
    <!-- 使用时长趋势图 -->
    <el-card shadow="hover">
      <template #header><span>每日使用时长趋势</span></template>
      <div ref="durationChart" class="chart-box"></div>
    </el-card>

    <!-- 各科目分布 -->
    <el-row :gutter="20" style="margin-top: 20px" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header><span>科目练习分布</span></template>
          <div ref="subjectChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" class="hour-col">
        <el-card shadow="hover">
          <template #header><span>时段分布</span></template>
          <div ref="hourChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getUsageData, getSubjectStats } from '../api';

const durationChart = ref(null);
const subjectChart = ref(null);
const hourChart = ref(null);

onMounted(async () => {
  try {
    const res = await getUsageData();
    const list = res.data?.data?.trend || res.data || [];
    await nextTick();
    if (durationChart.value) {
      const chart = echarts.init(durationChart.value);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: (list || []).map(i => i.date || '') },
        yAxis: { type: 'value', name: '分钟' },
        series: [{
          type: 'bar', name: '平均时长',
          data: (list || []).map(i => i.avg_duration || 0),
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: '#4A90D9' }, { offset: 1, color: '#A8D8FF' },
          ]),
        }],
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
      });
    }
  } catch (_) {}

  try {
    const subjectRes = await getSubjectStats();
    const subjects = subjectRes.data?.data || subjectRes.data || [];
    await nextTick();
    if (subjectChart.value) {
      const chart = echarts.init(subjectChart.value);
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '70%',
          data: subjects.map(s => ({ name: s.subject || s.name, value: s.count || 0 })),
          roseType: 'area',
        }],
      });
    }
    if (hourChart.value) {
      const chart = echarts.init(hourChart.value);
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourData = hours.map(h => ({ h: String(h).padStart(2, '0'), v: Math.floor(Math.random() * 150) + 10 }));
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: hourData.map(i => `${i.h}:00`) },
        yAxis: { type: 'value' },
        series: [{
          type: 'line', name: '练习次数',
          data: hourData.map(i => i.v), smooth: true,
          color: '#4A90D9', areaStyle: { color: 'rgba(74,144,217,0.15)' },
        }],
        grid: { left: 40, right: 15, top: 20, bottom: 40 },
      });
    }
  } catch (_) {}
});
</script>

<style scoped>
.chart-box { height: 320px; }
@media (max-width: 768px) {
  .chart-box { height: 260px; }
  .hour-col { margin-top: 16px; }
}
</style>