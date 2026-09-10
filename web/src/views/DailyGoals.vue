<template>
  <div class="page-container">
    <div class="page-header">
      <h2>🎯 今日目标</h2>
      <p class="subtitle">{{ todayStr }}</p>
    </div>

    <!-- 完成状态横幅 -->
    <div class="goal-banner" :class="{ done: today.completed }">
      <div v-if="!today.completed" class="banner-content">
        <span class="banner-icon">🚀</span>
        <span class="banner-text">继续加油，今天的目标一定能完成！</span>
      </div>
      <div v-else class="banner-content banner-done">
        <span class="banner-icon">🎉</span>
        <span class="banner-text">太棒了！今日目标全部完成！</span>
      </div>
    </div>

    <!-- 目标进度环 -->
    <div class="progress-overview">
      <div class="progress-ring" ref="ringRef">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" class="ring-bg" />
          <circle cx="60" cy="60" r="50" class="ring-fill" :style="{ strokeDashoffset: ringOffset }" />
        </svg>
        <div class="ring-center">
          <span class="ring-pct">{{ overallPct }}%</span>
          <span class="ring-label">完成度</span>
        </div>
      </div>
      <div class="streak-info">
        <div class="streak-item">
          <span class="streak-fire">🔥</span>
          <span class="streak-num">{{ currentStreak }}</span>
          <span class="streak-label">连续完成</span>
        </div>
        <div class="streak-item">
          <span class="streak-num">{{ completionRate }}</span>
          <span class="streak-label">完成率</span>
        </div>
        <div class="streak-item">
          <span class="streak-num">{{ today.completed ? '✅' : '⏳' }}</span>
          <span class="streak-label">{{ today.completed ? '已完成' : '进行中' }}</span>
        </div>
      </div>
    </div>

    <!-- 目标卡片列表 -->
    <div class="goal-items">
      <!-- 学习时间 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">⏱️</span>
          <span class="goal-title">学习时间</span>
          <span class="goal-badge">{{ currentMinutes }} / {{ today.studyMinutes }} 分钟</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentMinutes, today.studyMinutes * 60) + '%' }" />
        </div>
        <div class="goal-tips">
          <el-progress :percentage="pct(currentMinutes, today.studyMinutes * 60)" :stroke-width="8" :color="'#4CAF50'" />
        </div>
      </div>

      <!-- 做题总数 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">📝</span>
          <span class="goal-title">做题数量</span>
          <span class="goal-badge">{{ currentQuestions }} / {{ today.targetQuestions }} 题</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentQuestions, today.targetQuestions) + '%' }" />
        </div>
        <div class="goal-tips">
          <el-progress :percentage="pct(currentQuestions, today.targetQuestions)" :stroke-width="8" :color="'#2196F3'" />
        </div>
      </div>

      <!-- 阅读 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">📖</span>
          <span class="goal-title">阅读</span>
          <span class="goal-badge">{{ currentReading }} / {{ today.readingCount }} 篇</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentReading, today.readingCount) + '%' }" />
        </div>
      </div>

      <!-- 听力 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">🎧</span>
          <span class="goal-title">听力</span>
          <span class="goal-badge">{{ currentListening }} / {{ today.listeningCount }} 篇</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentListening, today.listeningCount) + '%' }" />
        </div>
      </div>

      <!-- 口语 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">🎤</span>
          <span class="goal-title">口语</span>
          <span class="goal-badge">{{ currentSpeaking }} / {{ today.speakingCount }} 次</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentSpeaking, today.speakingCount) + '%' }" />
        </div>
      </div>

      <!-- 写作 -->
      <div class="goal-card">
        <div class="goal-card-header">
          <span class="goal-icon">✍️</span>
          <span class="goal-title">写作</span>
          <span class="goal-badge">{{ currentWriting }} / {{ today.writingCount }} 篇</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: pct(currentWriting, today.writingCount) + '%' }" />
        </div>
      </div>
    </div>

    <!-- 编辑目标 -->
    <div class="edit-section" v-if="!today.completed">
      <el-button type="primary" @click="showEdit = true" round>
        <el-icon><Setting /></el-icon>
        调整今日目标
      </el-button>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEdit" title="调整今日目标" width="400px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="学习时间">
          <el-input-number v-model="editForm.studyMinutes" :min="10" :max="300" /> 分钟
        </el-form-item>
        <el-form-item label="做题数量">
          <el-input-number v-model="editForm.targetQuestions" :min="1" :max="100" /> 题
        </el-form-item>
        <el-divider>分项目标</el-divider>
        <el-form-item label="阅读">
          <el-input-number v-model="editForm.readingCount" :min="0" :max="50" /> 篇
        </el-form-item>
        <el-form-item label="听力">
          <el-input-number v-model="editForm.listeningCount" :min="0" :max="50" /> 篇
        </el-form-item>
        <el-form-item label="口语">
          <el-input-number v-model="editForm.speakingCount" :min="0" :max="20" /> 次
        </el-form-item>
        <el-form-item label="写作">
          <el-input-number v-model="editForm.writingCount" :min="0" :max="20" /> 篇
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveGoal">保存</el-button>
      </template>
    </el-dialog>

    <!-- 历史记录 -->
    <div class="history-section">
      <h3>📅 完成历史</h3>
      <div v-if="history?.length" class="history-grid">
        <div v-for="h in history" :key="h.date" class="history-day" :class="{ done: h.completed }">
          <span class="history-date">{{ formatDate(h.date) }}</span>
          <span class="history-result">{{ h.completed ? '✅' : '❌' }}</span>
          <span class="history-minutes">{{ h.studyMinutes }} 分钟</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <span class="empty-icon">📝</span>
        <p>完成今天的任务后，历史记录将出现这里</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dailyGoalsAPI } from '@/api'

const todayStr = new Date().toISOString().split('T')[0]
const today = ref({
  studyMinutes: 30, targetQuestions: 20,
  readingCount: 5, listeningCount: 5, speakingCount: 2, writingCount: 2, completed: false,
})
const progress = ref({ studyMinutes: 0, totalQuestions: 0, practiceCount: 0, examCount: 0 })
const history = ref([])
const currentStreak = ref(0)
const completionRate = ref(0)
const showEdit = ref(false)
const ringRef = ref(null)

const editForm = ref({})
const currentMinutes = ref(0)
const currentQuestions = ref(0)
const currentReading = ref(0)
const currentListening = ref(0)
const currentSpeaking = ref(0)
const currentWriting = ref(0)

const overallPct = computed(() => {
  if (today.value.completed) return 100
  if (!progress.value) return 0
  const items = [
    pct(progress.value.studyMinutes, today.value.studyMinutes * 60),
    pct(progress.value.totalQuestions, today.value.targetQuestions),
    pct(currentReading.value, today.value.readingCount),
    pct(currentListening.value, today.value.listeningCount),
    pct(currentSpeaking.value, today.value.speakingCount),
    pct(currentWriting.value, today.value.writingCount),
  ]
  return Math.round(items.reduce((a, b) => a + b, 0) / items.length)
})

const ringOffset = computed(() => {
  const circumference = 2 * Math.PI * 50
  return circumference - (overallPct.value / 100) * circumference
})

const pct = (current, target) => target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

const fetchGoals = async () => {
  try {
    const res = await dailyGoalsAPI.getGoals()
    const d = res.data?.data
    if (d) {
      today.value = d.goal
      progress.value = d.progress
      // 更新各个分项计数
      currentMinutes.value = Math.floor(d.progress.studyMinutes / 60)
      currentQuestions.value = d.progress.totalQuestions
      // 粗略分配
      currentReading.value = Math.round(d.progress.practiceCount * 0.25)
      currentListening.value = Math.round(d.progress.practiceCount * 0.25)
      currentSpeaking.value = Math.round(d.progress.examCount * 0.3)
      currentWriting.value = d.progress.examCount - currentSpeaking.value
    }
  } catch (e) {
    console.warn('获取目标失败:', e)
  }
}

const fetchHistory = async () => {
  try {
    const res = await dailyGoalsAPI.getHistory()
    const d = res.data?.data
    if (d) {
      history.value = d.history || []
      currentStreak.value = d.currentStreak || 0
      completionRate.value = d.completionRate || 0
    }
  } catch (e) {
    console.warn('获取历史失败:', e)
  }
}

const saveGoal = async () => {
  try {
    await dailyGoalsAPI.updateGoal(editForm.value)
    await fetchGoals()
    showEdit.value = false
  } catch (e) {
    console.warn('保存目标失败:', e)
  }
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  fetchGoals()
  fetchHistory()
  // 填充编辑表单
  editForm.value = { ...today.value }
})
</script>

<style scoped>
.page-header { text-align: center; margin-bottom: 20px; }
.subtitle { color: var(--text-secondary); font-size: 14px; }

/* 状态横幅 */
.goal-banner {
  background: linear-gradient(135deg, var(--primary-color, #4CAF50), #2196F3);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  color: white;
}
.goal-banner.banner-done {
  background: linear-gradient(135deg, #FF6B35, #FF4500);
}
.banner-content { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 700; }
.banner-icon { font-size: 28px; }

/* 进度总览 */
.progress-overview {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 16px;
}
.progress-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--border); stroke-width: 6; }
.ring-fill { fill: none; stroke: var(--primary-color, #4CAF50); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 314.16; transition: stroke-dashoffset 0.5s ease; }
.ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.ring-pct { display: block; font-size: 24px; font-weight: 900; color: var(--text-primary); }
.ring-label { display: block; font-size: 10px; color: var(--text-secondary); }
.streak-info { display: flex; gap: 16px; flex-wrap: wrap; }
.streak-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.streak-fire { font-size: 24px; }
.streak-num { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.streak-label { font-size: 10px; color: var(--text-secondary); }

/* 目标卡片 */
.goal-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.goal-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
}
.goal-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.goal-icon { font-size: 20px; }
.goal-title { flex: 1; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.goal-badge { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.goal-progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.goal-progress-fill { height: 100%; background: var(--primary-color, #4CAF50); border-radius: 3px; transition: width 0.4s ease; }
.goal-tips { margin-top: 4px; }

/* 编辑 */
.edit-section { text-align: center; margin-bottom: 16px; }

/* 历史记录 */
.history-section { background: var(--card-bg); border-radius: 16px; padding: 16px; border: 1px solid var(--border); }
.history-section h3 { font-size: 16px; color: var(--text-primary); margin-bottom: 12px; }
.history-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 300px; overflow-y: auto; }
.history-day { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary); }
.history-day.done { background: rgba(76, 175, 80, 0.1); }
.history-result { font-size: 16px; }
.history-minutes { margin-left: auto; font-weight: 600; }

.empty-state { text-align: center; padding: 30px 0; }
.empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }

@media (max-width: 480px) {
  .progress-overview { flex-direction: column; }
  .streak-info { justify-content: center; }
  .history-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
