<template>
  <div class="page-container instant-feedback-page">
    <div class="page-header">
      <el-button text @click="$router.push('/reading')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>⚡ AI 即时解题</h2>
      <div class="header-spacer" />
    </div>

    <div class="feedback-content">
      <!-- 做题区域 -->
      <div class="question-area" v-if="currentQuestion">
        <div class="question-meta">
          <el-tag :type="getDifficultyTag(currentQuestion.difficulty)">
            {{ getDifficultyLabel(currentQuestion.difficulty) }}
          </el-tag>
          <el-tag type="info">{{ subjectMap[currentQuestion.subject] }}</el-tag>
          <span class="progress">第 {{ questionIndex + 1 }} / {{ questions.length }} 题</span>
        </div>

        <div class="question-text" v-html="currentQuestion.text"></div>

        <div class="options" v-if="currentQuestion.options">
          <div
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: selectedAnswer === String.fromCharCode(65 + idx),
              disabled: answering,
            }"
            @click="submitAnswer(String.fromCharCode(65 + idx))"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
            <span class="option-text">{{ opt }}</span>
          </div>
        </div>
      </div>

      <!-- 即时反馈 -->
      <div class="instant-feedback-card" v-if="feedback && !loading">
        <div class="feedback-header" :class="feedback.type">
          <el-icon :size="32" v-if="feedback.type === 'correct'">
            <CircleCheck />
          </el-icon>
          <el-icon :size="32" v-else>
            <CircleClose />
          </el-icon>
          <span class="feedback-title">{{ feedback.title }}</span>
        </div>

        <div class="feedback-body">
          <p class="feedback-message">{{ feedback.message }}</p>
          <div class="feedback-explanation">
            <h4>📖 详细解析</h4>
            <p>{{ feedback.explanation }}</p>
          </div>
        </div>

        <div class="feedback-actions">
          <el-button type="primary" @click="nextQuestion" :loading="loading">
            下一题 <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button @click="reviewAnswer">
            <el-icon><Refresh /></el-icon> 重做
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-if="loading">
        <el-skeleton :rows="6" animated />
        <p>AI 正在分析...</p>
      </div>

      <!-- 统计面板 -->
      <div class="stats-panel" v-if="stats.total > 0">
        <div class="stat-item">
          <span class="stat-value">{{ stats.correct }}</span>
          <span class="stat-label">正确</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.wrong }}</span>
          <span class="stat-label">错误</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.accuracy }}%</span>
          <span class="stat-label">正确率</span>
        </div>
      </div>

      <!-- 开始练习按钮 -->
      <div class="start-section" v-if="!currentQuestion && !loading">
        <el-button type="primary" size="large" @click="startPractice" :loading="loading">
          <el-icon><VideoPlay /></el-icon> 开始即时练习
        </el-button>
        <p class="hint">每答一题即可获得 AI 即时反馈，帮助你快速掌握知识点</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck, CircleClose, ArrowRight, Refresh, VideoPlay } from '@element-plus/icons-vue'
import { instantFeedbackAPI } from '@/api'

const questions = ref([])
const questionIndex = ref(0)
const currentQuestion = ref(null)
const selectedAnswer = ref('')
const feedback = ref(null)
const loading = ref(false)
const answering = ref(false)

const stats = ref({ total: 0, correct: 0, wrong: 0, accuracy: 0 })

const subjectMap = {
  reading: '阅读',
  listening: '听力',
  speaking: '口语',
  writing: '写作',
}

onMounted(() => {
  // 加载统计
  loadStats()
})

const loadStats = () => {
  // 模拟数据（实际应调用 API）
  stats.value = { total: 150, correct: 98, wrong: 52, accuracy: 65 }
}

const startPractice = async () => {
  loading.value = true
  try {
    // 获取题目列表（模拟）
    questions.value = generateMockQuestions(10)
    questionIndex.value = 0
    await loadCurrentQuestion()
  } catch (e) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

const loadCurrentQuestion = async () => {
  if (questionIndex.value < questions.value.length) {
    currentQuestion.value = questions.value[questionIndex.value]
    selectedAnswer.value = ''
    feedback.value = null
  }
}

const submitAnswer = async (answer) => {
  if (!currentQuestion.value || answering.value) return

  answering.value = true
  loading.value = true
  selectedAnswer.value = answer

  try {
    const res = await instantFeedbackAPI.submit({
      questionId: currentQuestion.value.id,
      userAnswer: answer,
      subject: currentQuestion.value.subject,
      attemptNumber: questionIndex.value + 1,
    })

    feedback.value = res.data?.data?.feedback
    stats.value.total++
    if (res.data?.data?.isCorrect) {
      stats.value.correct++
    } else {
      stats.value.wrong++
    }
    stats.value.accuracy = Math.round(stats.value.correct / stats.value.total * 100)
  } catch (e) {
    ElMessage.error('提交答案失败')
  } finally {
    loading.value = false
    answering.value = false
  }
}

const nextQuestion = () => {
  questionIndex.value++
  if (questionIndex.value < questions.value.length) {
    loadCurrentQuestion()
  } else {
    ElMessage.success(`练习完成！正确率：${stats.value.accuracy}%`)
    questions.value = []
    currentQuestion.value = null
  }
}

const reviewAnswer = () => {
  selectedAnswer.value = ''
  feedback.value = null
}

const getDifficultyTag = (d) => ({ easy: '', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)

function generateMockQuestions(count) {
  const subjects = ['reading', 'listening', 'speaking', 'writing']
  const questions = []
  for (let i = 0; i < count; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    questions.push({
      id: 1000 + i,
      subject,
      text: `这是一道模拟题目，用于测试即时反馈功能。第 ${i + 1} 题。`,
      options: ['选项 A', '选项 B', '选项 C', '选项 D'],
      correct: 'A',
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    })
  }
  return questions
}
</script>

<style scoped>
.instant-feedback-page {
  max-width: 800px;
  margin: 0 auto;
}

.question-area {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.question-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.progress {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover:not(.disabled) {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.option.selected {
  border-color: #4a6cf7;
  background: #eef2ff;
}

.option.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-letter {
  font-weight: 700;
  color: #4a6cf7;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef2ff;
}

.instant-feedback-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.feedback-header.correct {
  color: #10b981;
}

.feedback-header.incorrect {
  color: #ef4444;
}

.feedback-title {
  font-size: 18px;
  font-weight: 700;
}

.feedback-message {
  font-size: 15px;
  color: #333;
  margin-bottom: 16px;
}

.feedback-explanation {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.feedback-explanation h4 {
  margin-bottom: 8px;
  color: #4a6cf7;
}

.feedback-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.stats-panel {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.start-section {
  text-align: center;
  padding: 60px 20px;
}

.hint {
  color: #909399;
  margin-top: 12px;
}

.loading-section {
  text-align: center;
  padding: 40px;
}

.loading-section p {
  margin-top: 16px;
  color: #909399;
}
</style>
