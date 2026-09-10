<template>
  <div class="page-container mock-exam-page">
    <div class="page-header">
      <el-button text @click="$router.push('/mock-exam')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🤖 AI 模拟考场</h2>
      <div class="header-spacer" />
    </div>

    <div class="mock-exam-content">
      <!-- 配置选择 -->
      <div class="config-section" v-if="!examStarted">
        <h3>选择考试科目</h3>
        <div class="section-checkboxes">
          <label v-for="section in availableSections" :key="section.id" class="section-checkbox">
            <el-checkbox v-model="selectedSections" :label="section.id" />
            <span class="section-name">{{ section.name }}</span>
            <span class="section-duration">{{ section.duration }} 分钟</span>
          </label>
        </div>

        <div class="start-exam">
          <el-button type="primary" size="large" @click="startExam" :disabled="selectedSections.length === 0">
            开始模拟考试
          </el-button>
          <span class="total-duration">总计：{{ totalDuration }} 分钟</span>
        </div>
      </div>

      <!-- 考试界面 -->
      <div class="exam-interface" v-if="examStarted && !examComplete">
        <div class="exam-header">
          <div class="timer" :class="{ 'timer-warning': timeLeft < 60 }">
            ⏱️ {{ formatTime(timeLeft) }}
          </div>
          <div class="progress-info">
            题目 {{ currentQuestionIndex + 1 }} / {{ questions.length }}
          </div>
          <el-button @click="exitExam">退出考试</el-button>
        </div>

        <div class="question-area">
          <div class="question-type">{{ getCurrentSection().toUpperCase() }}</div>
          <div class="question-content" v-if="currentQuestion">
            <p class="question-text">{{ currentQuestion.question }}</p>
            <div class="passage-text" v-if="currentQuestion.passage">
              {{ currentQuestion.passage }}
            </div>
            <div class="options" v-if="currentQuestion.options">
              <div 
                v-for="(option, idx) in currentQuestion.options" 
                :key="idx"
                class="option"
                :class="{ 'option-selected': selectedAnswers[currentQuestion.id] === idx }"
                @click="selectAnswer(idx)"
              >
                <span class="option-label">{{ String.fromCharCode(65 + idx) }}</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="exam-actions">
          <el-button @click="prevQuestion" :disabled="currentQuestionIndex === 0">
            上一题
          </el-button>
          <el-button type="primary" @click="nextQuestion" :disabled="currentQuestionIndex >= questions.length - 1">
            下一题
          </el-button>
        </div>
      </div>

      <!-- 考试结果 -->
      <div class="exam-result" v-if="examComplete && result">
        <div class="result-header">
          <h2>🎉 模拟考试完成！</h2>
          <div class="total-score" :class="getScoreClass(result.total)">
            <span class="score-value">{{ result.total }}</span>
            <span class="score-max">/ 120</span>
          </div>
        </div>

        <div class="section-scores">
          <div class="score-card" v-for="(score, key) in result.sections" :key="key">
            <div class="score-label">{{ getSectionName(key) }}</div>
            <div class="score-value">{{ score }}</div>
          </div>
        </div>

        <div class="result-suggestion">
          <h3>💡 AI 建议</h3>
          <p>{{ result.suggestion }}</p>
        </div>

        <div class="result-actions">
          <el-button type="primary" @click="restartExam">
            再次考试
          </el-button>
          <el-button @click="$router.push('/')">
            返回首页
          </el-button>
        </div>
      </div>

      <!-- 考试历史 -->
      <div class="exam-history">
        <h3>📜 考试历史</h3>
        <div class="history-list">
          <div v-for="record in examHistory" :key="record.id" class="history-item">
            <span class="h-date">{{ formatDate(record.created_at) }}</span>
            <span class="h-score">总分：{{ record.total_score }}</span>
            <span class="h-detail">R:{{ record.reading_score }} L:{{ record.listening_score }} S:{{ record.speaking_score }} W:{{ record.writing_score }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { aiMockExamAPI } from '@/api'

const availableSections = [
  { id: 'reading', name: '📖 阅读', duration: 20 },
  { id: 'listening', name: '🎧 听力', duration: 15 },
  { id: 'speaking', name: '🎤 口语', duration: 10 },
  { id: 'writing', name: '✍️ 写作', duration: 30 },
]

const selectedSections = ref([])
const examStarted = ref(false)
const examComplete = ref(false)
const questions = ref([])
const currentQuestionIndex = ref(0)
const selectedAnswers = ref({})
const timeLeft = ref(0)
const result = ref(null)
const examHistory = ref([])

const totalDuration = computed(() => 
  selectedSections.value.reduce((total, id) => {
    const section = availableSections.find(s => s.id === id)
    return total + (section?.duration || 0)
  }, 0)
)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

onMounted(() => {
  loadHistory()
})

const loadHistory = async () => {
  try {
    const res = await aiMockExamAPI.getHistory()
    examHistory.value = res.data?.data?.results || []
  } catch {
    // Mock history
    examHistory.value = [
      { id: 1, total_score: 95, reading_score: 25, listening_score: 24, speaking_score: 22, writing_score: 24, created_at: new Date().toISOString() },
    ]
  }
}

const startExam = async () => {
  examStarted.value = true
  examComplete.value = false
  
  try {
    const res = await aiMockExamAPI.start({ sections: selectedSections.value })
    questions.value = res.data?.data?.questions || []
    timeLeft.value = (res.data?.data?.totalDuration || totalDuration.value) * 60
    startTimer()
  } catch {
    // Mock questions
    questions.value = [
      { id: 1, section: 'reading', question: 'What is the main idea?', options: ['A', 'B', 'C', 'D'], passage: 'Sample passage text...' },
    ]
    timeLeft.value = 600
    startTimer()
  }
}

const startTimer = () => {
  const timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      submitExam()
    }
  }, 1000)
}

const submitExam = async () => {
  try {
    const res = await aiMockExamAPI.submit({
      examId: 'exam_1',
      answers: selectedAnswers.value,
      duration: totalDuration.value,
    })
    result.value = res.data?.data || generateMockResult()
  } catch {
    result.value = generateMockResult()
  }
  examComplete.value = true
}

const generateMockResult = () => ({
  sections: {
    reading: Math.round((20 + Math.random() * 10) * 10) / 10,
    listening: Math.round((18 + Math.random() * 12) * 10) / 10,
    speaking: Math.round((17 + Math.random() * 13) * 10) / 10,
    writing: Math.round((18 + Math.random() * 12) * 10) / 10,
  },
  total: 0,
  suggestion: '建议加强口语部分练习。',
})

const selectAnswer = (idx) => {
  selectedAnswers.value[currentQuestion.value.id] = idx
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const exitExam = () => {
  if (confirm('确定要退出考试吗？')) {
    examStarted.value = false
    examComplete.value = false
    selectedSections.value = []
  }
}

const restartExam = () => {
  examComplete.value = false
  currentQuestionIndex.value = 0
  selectedAnswers.value = {}
  timeLeft.value = totalDuration.value * 60
}

const getCurrentSection = () => currentQuestion.value?.section || 'reading'

const getSectionName = (key) => {
  const map = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
  return map[key] || key
}

const getScoreClass = (score) => {
  if (score >= 100) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.mock-exam-page {
  max-width: 900px;
  margin: 0 auto;
}

.config-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.section-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-name {
  flex: 1;
  font-weight: 500;
}

.section-duration {
  color: #909399;
  font-size: 13px;
}

.start-exam {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
}

.total-duration {
  font-size: 14px;
  color: #666;
}

.exam-interface {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.timer {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.timer-warning {
  color: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.question-area {
  margin: 24px 0;
}

.question-type {
  display: inline-block;
  padding: 4px 12px;
  background: #4a6cf7;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

.question-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.passage-text {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  line-height: 1.8;
  max-height: 200px;
  overflow-y: auto;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #4a6cf7;
  background: #f0f5ff;
}

.option-selected {
  border-color: #4a6cf7;
  background: #e8f0ff;
}

.option-label {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7ed;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
}

.option-selected .option-label {
  background: #4a6cf7;
  color: #fff;
}

.exam-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.exam-result {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.result-header {
  margin-bottom: 32px;
}

.total-score {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  margin-top: 16px;
}

.total-score.excellent { background: #ecfdf5; }
.total-score.good { background: #f0f9ff; }
.total-score.fair { background: #fffbeb; }
.total-score.poor { background: #fef2f2; }

.score-value {
  font-size: 48px;
  font-weight: 700;
}

.score-max {
  font-size: 14px;
  color: #909399;
}

.section-scores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 24px 0;
}

.score-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.score-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.result-suggestion {
  text-align: left;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin: 24px 0;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.exam-history {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.h-date {
  color: #909399;
  font-size: 13px;
}

.h-score {
  font-weight: 600;
  color: #4a6cf7;
}

.h-detail {
  font-size: 12px;
  color: #666;
}
</style>
