<template>
  <div class="page-container">
    <div class="page-header"><h2>模拟考试</h2></div>

    <div class="card">
      <h3>托福全真模拟考试</h3>
      <p class="exam-desc">模拟真实托福考试环境，包含阅读、听力、口语、写作四个部分。考试时间约 2 小时。</p>

      <div class="exam-info">
        <div class="info-item">
          <el-icon :size="24"><Timer /></el-icon>
          <span>总时长：约 120 分钟</span>
        </div>
        <div class="info-item">
          <el-icon :size="24"><Reading /></el-icon>
          <span>阅读：3-4 篇</span>
        </div>
        <div class="info-item">
          <el-icon :size="24"><Headset /></el-icon>
          <span>听力：2-3 个对话/讲座</span>
        </div>
        <div class="info-item">
          <el-icon :size="24"><Microphone /></el-icon>
          <span>口语：4 题</span>
        </div>
        <div class="info-item">
          <el-icon :size="24"><Edit /></el-icon>
          <span>写作：2 篇</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <el-button type="primary" size="large" @click="startExam" :loading="starting">
          开始考试
        </el-button>
      </div>
    </div>

    <!-- History -->
    <div class="card" v-if="history.length">
      <h3 class="section-title">历史成绩</h3>
      <el-table :data="history" stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column label="阅读" width="60">
          <template #default="{ row }">{{ row.scores?.reading || '--' }}</template>
        </el-table-column>
        <el-table-column label="听力" width="60">
          <template #default="{ row }">{{ row.scores?.listening || '--' }}</template>
        </el-table-column>
        <el-table-column label="口语" width="60">
          <template #default="{ row }">{{ row.scores?.speaking || '--' }}</template>
        </el-table-column>
        <el-table-column label="写作" width="60">
          <template #default="{ row }">{{ row.scores?.writing || '--' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" min-width="160">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="$router.push(`/mock-exam/${row._id || row.id}/result`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { examAPI } from '@/api'

const router = useRouter()
const starting = ref(false)
const history = ref([])

const fmt = (d) => d ? new Date(d).toLocaleString('zh-CN') : '--'

const startExam = async () => {
  starting.value = true
  try {
    const res = await examAPI.start({})
    const id = res.data?.exam?._id || res.data?._id || res.data?.examId
    if (id) {
      router.push(`/mock-exam/${id}`)
    } else {
      ElMessage.error('创建考试失败')
    }
  } catch (e) {
    ElMessage.error('创建考试失败')
  } finally {
    starting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await examAPI.history({})
    history.value = res.data?.list || res.data?.exams || res.data || []
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.exam-desc { font-size: 14px; color: var(--text-secondary); margin-top: 8px; }
.exam-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.info-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; background: #f9fafb; border-radius: 8px;
  font-size: 14px;
}
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
</style>