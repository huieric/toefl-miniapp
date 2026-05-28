<template>
  <div class="page-container">
    <div class="page-header">
      <h2>错题本</h2>
      <p class="subtitle">基于 SM-2 记忆算法，智能安排复习时间</p>
    </div>

    <!-- Stats -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">错题总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayReview || 0 }}</div>
        <div class="stat-label">今日待复习</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.mastered || 0 }}</div>
        <div class="stat-label">已掌握</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span>错题列表</span>
        <el-button type="primary" size="small" @click="$router.push('/wrong-book/redo')" v-if="list.length">
          重做错题
        </el-button>
      </div>

      <el-empty v-if="!list.length" description="暂无错题，继续保持！">
        <el-button type="primary" @click="$router.push('/reading')">去练习</el-button>
      </el-empty>

      <el-table v-else :data="list" stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="科目" width="80">
          <template #default="{ row }">{{ subjectMap[row.subject] }}</template>
        </el-table-column>
        <el-table-column prop="question" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column label="错误次数" width="80">
          <template #default="{ row }">{{ row.wrongCount || row.count || 1 }}</template>
        </el-table-column>
        <el-table-column label="下次复习" width="160">
          <template #default="{ row }">
            <span v-if="row.nextReview">{{ formatNextReview(row.nextReview) }}</span>
            <el-tag v-else size="small" type="warning">待复习</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="掌握度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="getMastery(row)" :stroke-width="6" :color="masteryColor(row)" />
          </template>
        </el-table-column>
      </el-table>
    </div>
    <AdBanner placement="wrong-book" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { wrongAPI } from '@/api'
import AdBanner from '@/components/AdBanner.vue'

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
const list = ref([])
const stats = reactive({ total: 0, todayReview: 0, mastered: 0 })

const getMastery = (row) => {
  const ease = row.ease || 2.5
  return Math.min(100, Math.round(ease / 3.5 * 100))
}
const masteryColor = (row) => {
  const p = getMastery(row)
  if (p >= 70) return '#67C23A'
  if (p >= 40) return '#E6A23C'
  return '#F56C6C'
}
const formatNextReview = (d) => {
  if (!d) return '--'
  const now = new Date()
  const next = new Date(d)
  const diff = next - now
  if (diff < 0) return '现在'
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours} 小时后`
  const days = Math.floor(hours / 24)
  return `${days} 天后`
}

onMounted(async () => {
  try {
    const [listRes, statsRes] = await Promise.all([wrongAPI.list({}), wrongAPI.stats()])
    list.value = listRes.data?.list || listRes.data?.wrongs || listRes.data || []
    if (statsRes.data) Object.assign(stats, statsRes.data)
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; font-weight: 600;
}
</style>