<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/plan')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>今日任务</h2>
    </div>

    <!-- Progress Summary -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ completed }}/{{ tasks.length }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ todayMinutes || 0 }} min</div>
        <div class="stat-label">今日学习</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span>任务列表</span>
        <el-tag>{{ today }}</el-tag>
      </div>

      <el-empty v-if="!tasks.length" description="今日暂无任务">
        <el-button type="primary" @click="$router.push('/reading')">开始练习</el-button>
      </el-empty>

      <div v-else class="task-list">
        <div
          v-for="(task, i) in tasks"
          :key="i"
          class="task-item"
          :class="{ done: task.done }"
        >
          <div class="task-left">
            <el-checkbox v-model="task.done" disabled />
            <div class="task-info">
              <div class="task-title">{{ task.title || task.name }}</div>
              <div class="task-meta">
                <el-tag size="small">{{ subjectMap[task.subject] }}</el-tag>
                <span>{{ task.estimatedTime || 30 }} 分钟</span>
              </div>
            </div>
          </div>
          <el-button
            v-if="!task.done"
            size="small"
            type="primary"
            @click="startTask(task)"
          >
            开始
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { planAPI } from '@/api'

const router = useRouter()
const tasks = ref([])
const todayMinutes = ref(0)

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
const completed = computed(() => tasks.value.filter(t => t.done).length)

const startTask = (task) => {
  if (task.subject === 'reading') router.push('/reading')
  else if (task.subject === 'listening') router.push('/listening')
  else if (task.subject === 'speaking') router.push('/speaking')
  else if (task.subject === 'writing') router.push('/writing')
  else if (task.subject === 'mock-exam') router.push('/mock-exam')
}

onMounted(async () => {
  try {
    const res = await planAPI.daily()
    const data = res.data?.tasks || res.data?.list || res.data || []
    tasks.value = Array.isArray(data) ? data : []
    todayMinutes.value = res.data?.todayMinutes || 0
  } catch (e) {
    // fallback tasks
    tasks.value = [
      { title: '完成一篇阅读理解', subject: 'reading', done: false, estimatedTime: 30 },
      { title: '完成一组听力练习', subject: 'listening', done: false, estimatedTime: 25 },
      { title: '练习口语 Task 1', subject: 'speaking', done: false, estimatedTime: 20 },
      { title: '写作段落练习', subject: 'writing', done: false, estimatedTime: 30 },
    ]
  }
})
</script>

<style scoped>
.page-container {
  padding: 20px 16px 48px;
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 800;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  text-align: center;
  padding: 20px 16px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 任务列表 */
.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  background: #F8F9FC;
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.task-item:active {
  transform: scale(0.98);
}
.task-item.done { opacity: 0.6; }
.task-left { display: flex; align-items: center; gap: 12px; }
.task-title { font-size: 14px; font-weight: 500; }
.task-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px; font-size: 12px; color: var(--text-secondary); }

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 80px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .stat-cards {
    gap: 8px;
    margin-bottom: 14px;
  }
  .stat-card {
    padding: 16px 12px;
    border-radius: var(--radius-sm);
  }
  .stat-value {
    font-size: 24px;
  }
  .stat-label {
    font-size: 12px;
  }
  .card {
    padding: 16px;
    border-radius: var(--radius-sm);
  }
  .card-header {
    margin-bottom: 12px;
  }
  .task-list {
    gap: 8px;
  }
  .task-item {
    padding: 12px 14px;
    border-radius: 8px;
  }
  .task-title {
    font-size: 13px;
  }
  .task-meta {
    font-size: 11px;
  }
  .task-item .el-button {
    height: 32px;
    font-size: 12px;
    padding: 0 12px;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 10px 10px 76px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .stat-card {
    padding: 14px 10px;
  }
  .stat-value {
    font-size: 20px;
  }
  .card {
    padding: 14px;
  }
  .task-item {
    padding: 10px 12px;
  }
}
</style>