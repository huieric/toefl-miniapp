<template>
  <div class="page-container">
    <div class="page-header">
      <h2>📋 学习计划</h2>
      <p class="subtitle">基于您的错题数据和薄弱科目，智能生成个性化学习方案</p>
    </div>

    <!-- 无计划状态 -->
    <el-empty v-if="!plan && !loading" description="尚未创建学习计划" class="empty-state">
      <el-button type="primary" size="large" @click="showCreateDialog = true">创建学习计划</el-button>
    </el-empty>

    <!-- 有计划的概览 -->
    <template v-else-if="plan">
      <!-- 倒计时卡片 -->
      <div class="countdown-card">
        <div class="countdown-header">
          <span class="countdown-label">距离托福考试</span>
          <span class="countdown-days">{{ plan.daysRemaining }}天</span>
        </div>
        <div class="countdown-meta">
          <el-tag size="small">目标: {{ plan.targetScore }}分</el-tag>
          <el-tag size="small" type="info">当前: {{ plan.currentScore || '待评估' }}</el-tag>
          <el-tag v-if="plan.weakSubjects && plan.weakSubjects.length" size="small" type="danger">
            薄弱: {{ plan.weakSubjects.map(s => subjectMap[s] || s).join('、') }}
          </el-tag>
        </div>
        <el-progress :percentage="phaseProgress" :status="plan.currentPhase === 3 ? 'success' : ''" :stroke-width="8" />
        <div class="phase-indicator">
          <span :class="{ active: plan.currentPhase === 1 }">① 基础巩固</span>
          <span class="arrow">→</span>
          <span :class="{ active: plan.currentPhase === 2 }">② 强化提升</span>
          <span class="arrow">→</span>
          <span :class="{ active: plan.currentPhase === 3 }">③ 冲刺模考</span>
        </div>
      </div>

      <!-- 今日任务 -->
      <div class="card">
        <div class="card-header">
          <span>📅 今日任务</span>
          <span class="task-progress">{{ dailyProgress.completedTasks }} / {{ dailyProgress.totalTasks }}</span>
        </div>
        <el-empty v-if="!dailyProgress.tasks?.length" description="今日暂无任务，请创建学习计划" />
        <div v-else class="task-list">
          <div v-for="task in dailyProgress.tasks" :key="task.id" class="task-item">
            <el-checkbox v-model="task.completed" @change="(val) => toggleTask(task, val)">
              <span :class="{ 'task-done': task.completed }">{{ task.title }}</span>
            </el-checkbox>
            <span class="task-desc">{{ task.description }}</span>
            <el-tag size="small" :type="subjectType(task.subject)">{{ subjectMap[task.subject] || task.subject }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 三阶段计划详情 -->
      <div class="card">
        <div class="card-header">
          <span>📊 三阶段学习计划</span>
        </div>
        <div class="phase-cards">
          <div v-for="(phase, i) in plan.phases" :key="i" class="phase-card" :class="{ 'phase-current': plan.currentPhase === i + 1 }">
            <div class="phase-header">
              <span class="phase-num">{{ i + 1 }}</span>
              <span class="phase-name">{{ phase.name }}</span>
              <span class="phase-days">{{ phase.days }}天</span>
            </div>
            <p class="phase-desc">{{ phase.description }}</p>
            <div class="phase-focus">
              <el-tag v-for="f in phase.focusAreas" :key="f" size="small" effect="plain">{{ f }}</el-tag>
            </div>
            <div class="phase-tasks">
              <h5>每日任务</h5>
              <ul>
                <li v-for="t in phase.dailyTasks" :key="t.title">{{ t.title }}（{{ t.description }}）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 创建计划对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建学习计划" width="min(92vw, 500px)" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px">
        <el-form-item label="目标分数">
          <el-radio-group v-model="form.targetScore">
            <el-radio :label="80">80</el-radio>
            <el-radio :label="90">90</el-radio>
            <el-radio :label="100">100</el-radio>
            <el-radio :label="110">110</el-radio>
            <el-radio :label="120">120</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="当前水平">
          <el-input-number v-model="form.currentScore" :min="0" :max="120" placeholder="可选" />
        </el-form-item>
        <el-form-item label="考试日期">
          <el-date-picker v-model="form.examDate" type="date" placeholder="选择考试日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日学习">
          <el-slider v-model="form.dailyMinutes" :min="30" :max="240" :step="15" show-input />
          <span class="slider-label">分钟/天</span>
        </el-form-item>
        <el-form-item label="薄弱科目">
          <el-checkbox-group v-model="form.weakSubjects">
            <el-checkbox label="reading">阅读</el-checkbox>
            <el-checkbox label="listening">听力</el-checkbox>
            <el-checkbox label="speaking">口语</el-checkbox>
            <el-checkbox label="writing">写作</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPlan" :loading="creating" :disabled="!form.targetScore || !form.examDate">
          生成计划
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { planAPI } from '@/api'
import { ElMessage } from 'element-plus'

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作', all: '全部' }
const subjectType = (s) => ({ reading: '', listening: 'warning', speaking: 'danger', writing: 'info' }[s] || '')

const loading = ref(false)
const plan = ref(null)
const dailyProgress = reactive({ tasks: [], totalTasks: 0, completedTasks: 0, progress: 0 })
const showCreateDialog = ref(false)
const creating = ref(false)

const form = reactive({
  targetScore: 90,
  currentScore: 0,
  examDate: '',
  dailyMinutes: 60,
  weakSubjects: ['reading', 'listening', 'speaking', 'writing'],
})

const phaseProgress = computed(() => {
  if (!plan.value || !plan.value.phases?.length) return 0
  const phases = plan.value.phases
  const daysLeft = plan.value.daysRemaining
  const totalPlannedDays = phases.reduce((s, p) => s + p.days, 0)
  if (totalPlannedDays === 0) return 0
  return Math.min(100, Math.round(((totalPlannedDays - daysLeft) / totalPlannedDays) * 100))
})

const loadPlan = async () => {
  try {
    loading.value = true
    const res = await planAPI.current()
    if (res.data?.data) {
      plan.value = res.data.data
    }
  } catch (e) {
    console.error('加载计划失败:', e)
  } finally {
    loading.value = false
  }
}

const loadDailyTasks = async () => {
  try {
    const res = await planAPI.daily()
    if (res.data?.data) {
      dailyProgress.tasks = res.data.data.tasks || []
      dailyProgress.totalTasks = res.data.data.totalTasks || 0
      dailyProgress.completedTasks = res.data.data.completedTasks || 0
      dailyProgress.progress = res.data.data.progress || 0
      // 同步 checkbox 状态
      dailyProgress.tasks.forEach(t => { t.completed = t.isCompleted || t.completed || false })
    }
  } catch (e) {
    console.error('加载今日任务失败:', e)
  }
}

const toggleTask = async (task, checked) => {
  try {
    await planAPI.toggleTask(task.id, checked)
    task.completed = checked
    if (checked) {
      ElMessage.success(`✅ ${task.title} 已完成！`)
      dailyProgress.completedTasks++
    }
  } catch (e) {
    task.completed = !checked
    ElMessage.error('更新任务状态失败')
  }
}

const createPlan = async () => {
  if (!form.targetScore || !form.examDate) {
    ElMessage.warning('请填写目标分数和考试日期')
    return
  }
  creating.value = true
  try {
    const res = await planAPI.create({
      targetScore: form.targetScore,
      currentScore: form.currentScore,
      examDate: form.examDate,
      dailyMinutes: form.dailyMinutes,
      weakSubjects: form.weakSubjects.length ? form.weakSubjects : ['reading', 'listening', 'speaking', 'writing'],
    })
    if (res.data?.code === 200) {
      ElMessage.success('学习计划创建成功！')
      showCreateDialog.value = false
      await loadPlan()
      await loadDailyTasks()
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadPlan(), loadDailyTasks()])
})
</script>

<style scoped>
.page-container {
  padding: 0 16px 24px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  padding: 20px 0 12px;
}
.page-header h2 {
  font-size: 22px;
  margin-bottom: 4px;
}
.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 15px;
}
.task-progress {
  font-size: 13px;
  color: var(--el-color-primary);
}

/* 倒计时卡片 */
.countdown-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.countdown-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.countdown-label { font-size: 14px; opacity: 0.8; }
.countdown-days { font-size: 36px; font-weight: 800; }
.countdown-meta {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  flex-wrap: wrap;
}
.countdown-meta .el-tag {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: white;
}
.phase-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
}
.phase-indicator span:not(.arrow) {
  opacity: 0.5;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.3s;
}
.phase-indicator span.active {
  opacity: 1;
  background: rgba(255,255,255,0.2);
  font-weight: 600;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: #fafafa;
}
.task-item .task-desc {
  font-size: 12px;
  color: var(--text-secondary);
  padding-left: 24px;
}
.task-done {
  text-decoration: line-through;
  opacity: 0.6;
}

/* 阶段卡片 */
.phase-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.phase-card {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #eee;
  transition: all 0.3s;
}
.phase-card.phase-current {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64,158,255,0.15);
}
.phase-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.phase-num {
  width: 24px;
  height: 24px;
  background: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.phase-card.phase-current .phase-num {
  background: var(--el-color-primary);
  color: white;
}
.phase-name { font-weight: 600; font-size: 14px; flex: 1; }
.phase-days { font-size: 12px; color: var(--text-secondary); }
.phase-desc {
  font-size: 13px;
  color: var(--text);
  margin: 6px 0 10px;
}
.phase-focus {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}
.phase-tasks h5 {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}
.phase-tasks ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--text);
}
.phase-tasks li {
  margin-bottom: 2px;
  line-height: 1.4;
}

/* 滑块标签 */
.slider-label {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .countdown-days { font-size: 28px; }
  .phase-cards { gap: 8px; }
  .phase-card { padding: 10px; }
}
</style>
