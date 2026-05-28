<template>
  <div class="page-container">
    <div class="page-header"><h2>学习计划</h2></div>

    <!-- Active Plan -->
    <div class="card" v-if="plan">
      <div class="plan-header">
        <h3>当前学习计划</h3>
        <el-tag type="primary">{{ plan.status === 'active' ? '进行中' : '已完成' }}</el-tag>
      </div>

      <div class="plan-info">
        <div class="plan-item">
          <span class="plan-label">目标分数</span>
          <span class="plan-value">{{ plan.targetScore || '--' }}</span>
        </div>
        <div class="plan-item">
          <span class="plan-label">考试日期</span>
          <span class="plan-value">{{ plan.examDate ? new Date(plan.examDate).toLocaleDateString('zh-CN') : '--' }}</span>
        </div>
        <div class="plan-item">
          <span class="plan-label">每日学习时长</span>
          <span class="plan-value">{{ plan.dailyHours || 0 }} 小时</span>
        </div>
        <div class="plan-item">
          <span class="plan-label">剩余天数</span>
          <span class="plan-value">{{ remainingDays }} 天</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <el-button type="primary" @click="$router.push('/plan/daily')">查看今日任务</el-button>
        <el-button @click="$router.push('/plan/setup')">调整计划</el-button>
      </div>
    </div>

    <!-- No Plan -->
    <div class="card" v-else>
      <el-empty description="还没有学习计划">
        <el-button type="primary" @click="$router.push('/plan/setup')">创建学习计划</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { planAPI } from '@/api'

const plan = ref(null)

const remainingDays = computed(() => {
  if (!plan.value?.examDate) return '--'
  const diff = new Date(plan.value.examDate) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
})

onMounted(async () => {
  try {
    const res = await planAPI.get()
    plan.value = res.data?.plan || res.data || null
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plan-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.plan-item { padding: 16px; background: #f9fafb; border-radius: 10px; text-align: center; }
.plan-label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.plan-value { font-size: 22px; font-weight: 700; color: var(--primary); }
</style>