<template>
  <div class="page-container">
    <div class="page-header"><h2>模拟考试</h2></div>

    <!-- Hero Card -->
    <div class="card exam-hero">
      <div class="hero-content">
        <span class="hero-badge"><el-icon :size="14"><Trophy /></el-icon> 全真模拟</span>
        <h3 class="hero-title">托福全真模拟考试</h3>
        <p class="hero-desc">模拟真实托福考试环境，完整覆盖阅读、听力、口语、写作四个部分，考试时长约 2 小时。</p>

        <div class="exam-info">
          <div class="info-item">
            <div class="info-icon" style="background:var(--primary-soft);color:var(--primary)"><el-icon :size="20"><Timer /></el-icon></div>
            <div class="info-text"><strong>总时长</strong><span>约 120 分钟</span></div>
          </div>
          <div class="info-item">
            <div class="info-icon" style="background:#EAF2FF;color:#2563EB"><el-icon :size="20"><Reading /></el-icon></div>
            <div class="info-text"><strong>阅读</strong><span>3-4 篇</span></div>
          </div>
          <div class="info-item">
            <div class="info-icon" style="background:var(--success-soft);color:var(--success)"><el-icon :size="20"><Headset /></el-icon></div>
            <div class="info-text"><strong>听力</strong><span>2-3 个对话/讲座</span></div>
          </div>
          <div class="info-item">
            <div class="info-icon" style="background:var(--warning-soft);color:var(--warning)"><el-icon :size="20"><Microphone /></el-icon></div>
            <div class="info-text"><strong>口语</strong><span>4 题</span></div>
          </div>
          <div class="info-item">
            <div class="info-icon" style="background:#EFE9FF;color:#7C5CFF"><el-icon :size="20"><Edit /></el-icon></div>
            <div class="info-text"><strong>写作</strong><span>2 篇</span></div>
          </div>
        </div>

        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="startExam" :loading="starting">
            <el-icon :size="18" style="margin-right:6px"><VideoPlay /></el-icon>开始考试
          </el-button>
          <span class="hero-hint">建议预留 2 小时完整时间，保持安静环境</span>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card" v-if="history.length">
      <h3 class="section-title">历史成绩</h3>
      <el-table :data="history">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="totalScore" label="总分" width="90">
          <template #default="{ row }">
            <span class="score-badge">{{ row.totalScore ?? '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="阅读" width="70">
          <template #default="{ row }">{{ row.scores?.reading ?? '--' }}</template>
        </el-table-column>
        <el-table-column label="听力" width="70">
          <template #default="{ row }">{{ row.scores?.listening ?? '--' }}</template>
        </el-table-column>
        <el-table-column label="口语" width="70">
          <template #default="{ row }">{{ row.scores?.speaking ?? '--' }}</template>
        </el-table-column>
        <el-table-column label="写作" width="70">
          <template #default="{ row }">{{ row.scores?.writing ?? '--' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" min-width="160">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90">
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
import { Timer, Reading, Headset, Microphone, Edit, Trophy, VideoPlay } from '@element-plus/icons-vue'
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
.exam-hero {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  background:
    radial-gradient(720px 320px at 100% 0%, rgba(124, 92, 255, 0.16), transparent 60%),
    radial-gradient(600px 300px at 0% 100%, rgba(66, 85, 255, 0.12), transparent 55%),
    #fff;
}
.hero-content {
  padding: 34px 36px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.hero-desc {
  font-size: 14.5px;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 620px;
  margin: 0 0 26px;
}
.exam-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #F8F9FC;
  border-radius: 14px;
  border: 1px solid var(--border);
  transition: all 0.18s ease;
}
.info-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-text {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.info-text strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.info-text span {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.hero-hint {
  font-size: 12.5px;
  color: var(--text-muted);
}
.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 800;
  font-size: 14px;
}
.section-title { font-size: 17px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.01em; }

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 80px;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .card {
    border-radius: var(--radius-sm);
  }
  
  /* Hero Card */
  .exam-hero {
    border-radius: var(--radius-sm);
  }
  .hero-content {
    padding: 20px 16px;
  }
  .hero-badge {
    font-size: 11px;
    padding: 4px 10px;
    margin-bottom: 12px;
  }
  .hero-title {
    font-size: 20px;
    margin-bottom: 6px;
  }
  .hero-desc {
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 18px;
  }
  
  /* 考试信息 2x2 网格 */
  .exam-info {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 18px;
  }
  .info-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 14px 12px;
    gap: 8px;
  }
  .info-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .info-icon .el-icon {
    --el-icon-size: 18px;
  }
  .info-text {
    align-items: center;
  }
  .info-text strong {
    font-size: 13px;
  }
  .info-text span {
    font-size: 11px;
  }
  
  /* 开始按钮 */
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .hero-actions .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }
  .hero-hint {
    font-size: 11px;
    text-align: center;
  }
  
  /* 历史成绩 */
  .section-title {
    font-size: 15px;
    margin-bottom: 12px;
  }
  .card :deep(.el-table) {
    font-size: 12px;
  }
  .card :deep(.el-table th),
  .card :deep(.el-table td) {
    padding: 8px 4px;
  }
}
</style>