<template>
  <div class="page-container dictation-page">
    <div class="page-header">
      <el-button text @click="$router.push('/listening')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎧 听力听写训练</h2>
      <div class="header-spacer" />
    </div>

    <div class="dictation-content">
      <!-- 课程列表 -->
      <div class="sessions-section" v-if="!activeSession">
        <h3>选择听写课程</h3>
        <div class="sessions-grid">
          <div 
            v-for="session in sessions" 
            :key="session.id"
            class="session-card"
            :class="{ 'session-completed': session.completed }"
            @click="startSession(session)"
          >
            <div class="session-icon">{{ session.icon }}</div>
            <div class="session-info">
              <h4>{{ session.title }}</h4>
              <p>{{ session.description }}</p>
              <div class="session-meta">
                <el-tag :type="getDifficultyTag(session.difficulty)" size="small">
                  {{ getDifficultyLabel(session.difficulty) }}
                </el-tag>
                <span class="question-count">{{ session.questionCount }} 题</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 听写练习 -->
      <div class="practice-section" v-if="activeSession && currentQuestion">
        <div class="practice-header">
          <div class="progress-info">
            <span>题目 {{ currentQuestionIndex + 1 }}/{{ questions.length }}</span>
            <el-progress :percentage="progressPercentage" :stroke-width="6" />
          </div>
          <el-button @click="exitPractice">退出</el-button>
        </div>

        <div class="practice-area">
          <!-- 播放控制 -->
          <div class="audio-controls">
            <el-button circle size="large" @click="playAudio" :loading="playing">
              <el-icon v-if="!playing"><VideoPlay /></el-icon>
              <el-icon v-else><VideoPause /></el-icon>
            </el-button>
            <div class="playback-info">
              <span>点击播放音频</span>
              <span class="hint-text">{{ questions[currentQuestionIndex]?.hint }}</span>
            </div>
          </div>

          <!-- 听写输入 -->
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="4"
            placeholder="请仔细听音频，将听到的内容完整写出..."
            :maxlength="300"
            show-word-limit
            @keyup.enter.ctrl="submitAnswer"
          />
          <div class="answer-actions">
            <el-button type="primary" @click="submitAnswer" :disabled="!userAnswer.trim()">
              提交答案
            </el-button>
            <el-button @click="showHint = true" v-if="!showHint">
              查看提示
            </el-button>
          </div>

          <!-- 提示 -->
          <div class="hint-box" v-if="showHint">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ questions[currentQuestionIndex]?.hint }}</span>
          </div>

          <!-- 结果展示 -->
          <div class="result-box" v-if="showResult">
            <div class="result-score" :class="getScoreClass(result.score)">
              <span class="score-value">{{ result.score }}%</span>
              <span class="score-label">{{ result.suggestion }}</span>
            </div>
            <div class="comparison">
              <div class="correct-answer">
                <strong>正确答案：</strong>
                <p>{{ questions[currentQuestionIndex]?.text }}</p>
              </div>
              <div class="your-answer" :class="{ 'answer-error': result.score < 90 }">
                <strong>你的答案：</strong>
                <p>{{ userAnswer }}</p>
              </div>
            </div>
            <el-button type="primary" @click="nextQuestion">
              {{ currentQuestionIndex < questions.length - 1 ? '下一题' : '查看结果' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 练习结果 -->
      <div class="results-section" v-if="practiceComplete">
        <div class="results-card">
          <h3>🎉 听写完成！</h3>
          <div class="results-stats">
            <div class="stat-item">
              <span class="stat-value">{{ totalScore }}%</span>
              <span class="stat-label">平均分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ perfectCount }}/{{ questions.length }}</span>
              <span class="stat-label">完美正确</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalTime }}s</span>
              <span class="stat-label">总用时</span>
            </div>
          </div>
          <div class="results-actions">
            <el-button type="primary" @click="resetPractice">
              重新开始
            </el-button>
            <el-button @click="$router.push('/listening')">
              返回听力列表
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay, VideoPause, InfoFilled } from '@element-plus/icons-vue'
import { listeningDictationAPI } from '@/api'

const sessions = ref([])
const activeSession = ref(null)
const questions = ref([])
const currentQuestionIndex = ref(0)
const userAnswer = ref('')
const showHint = ref(false)
const showResult = ref(false)
const playing = ref(false)
const practiceComplete = ref(false)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const progressPercentage = computed(() => 
  Math.round(((currentQuestionIndex.value + 1) / questions.value) * 100)
)

const totalScore = ref(0)
const perfectCount = ref(0)
const totalTime = ref(0)

onMounted(async () => {
  await loadSessions()
})

const loadSessions = async () => {
  try {
    const res = await listeningDictationAPI.getSessions()
    sessions.value = res.data?.data?.sessions || []
  } catch {
    // Mock data
    sessions.value = [
      { id: 1, title: '学术讲座听写 - 基础', description: '适合 TOEFL 听力基础练习', difficulty: 'easy', questionCount: 5, icon: '🎧' },
      { id: 2, title: '课堂讨论听写 - 中等', description: '模拟真实课堂对话', difficulty: 'medium', questionCount: 5, icon: '🗣️' },
      { id: 3, title: '学术讲座听写 - 困难', description: '高难度学术内容', difficulty: 'hard', questionCount: 5, icon: '📚' },
    ]
  }
}

const startSession = async (session) => {
  activeSession.value = session
  practiceComplete.value = false
  
  try {
    const res = await listeningDictationAPI.getSession(session.id)
    questions.value = res.data?.data?.questions || []
  } catch {
    // Mock questions
    questions.value = [
      { id: 1, text: 'The biodiversity of ecosystems is essential for environmental stability.', hint: '生态系统的生物多样性对环境稳定性至关重要' },
      { id: 2, text: 'Scientists have observed a correlation between habitat loss and species extinction.', hint: '科学家观察到栖息地丧失与物种灭绝之间的相关性' },
    ]
  }
  
  currentQuestionIndex.value = 0
  resetAnswer()
}

const resetAnswer = () => {
  userAnswer.value = ''
  showHint.value = false
  showResult.value = false
}

const playAudio = () => {
  playing.value = true
  setTimeout(() => {
    playing.value = false
    ElMessage.info('音频播放完成，请开始听写')
  }, 3000)
}

const submitAnswer = async () => {
  if (!userAnswer.value.trim()) {
    ElMessage.warning('请输入听写内容')
    return
  }

  try {
    const res = await listeningDictationAPI.submit({
      sessionId: activeSession.value.id,
      questionId: currentQuestion.value.id,
      userAnswer: userAnswer.value,
      correctAnswer: currentQuestion.value.text,
    })
    
    result.value = res.data?.data || generateMockResult()
    showResult.value = true

    if (result.value.score >= 90) perfectCount.value++
    totalScore.value += result.value.score
    totalTime.value += Math.floor(Math.random() * 30) + 20
  } catch {
    result.value = generateMockResult()
    showResult.value = true
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    resetAnswer()
  } else {
    practiceComplete.value = true
  }
}

const exitPractice = () => {
  if (confirm('确定要退出听写练习吗？')) {
    activeSession.value = null
    practiceComplete.value = false
  }
}

const resetPractice = () => {
  currentQuestionIndex.value = 0
  totalScore.value = 0
  perfectCount.value = 0
  totalTime.value = 0
  practiceComplete.value = false
  resetAnswer()
}

const result = ref({})

const generateMockResult = () => {
  const score = Math.round(50 + Math.random() * 50)
  return {
    score,
    suggestion: score >= 90 ? '完美！' : score >= 70 ? '不错，注意细节！' : '继续练习！',
  }
}

const getDifficultyTag = (d) => ({ easy: '', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '基础', medium: '中等', hard: '困难' }[d] || d)
const getScoreClass = (score) => score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'fair'
</script>

<style scoped>
.dictation-page {
  max-width: 800px;
  margin: 0 auto;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.session-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.session-card:hover {
  transform: translateY(-4px);
}

.session-icon {
  font-size: 48px;
}

.session-info h4 {
  margin: 0 0 8px;
  color: #333;
}

.session-info p {
  margin: 0 0 12px;
  font-size: 13px;
  color: #666;
}

.session-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.question-count {
  font-size: 12px;
  color: #909399;
}

.practice-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.playback-info {
  display: flex;
  flex-direction: column;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.hint-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #92400e;
}

.result-box {
  margin-top: 24px;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 8px;
}

.result-score {
  text-align: center;
  margin-bottom: 16px;
}

.score-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: #10b981;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.correct-answer p,
.your-answer p {
  margin: 8px 0 0;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.your-answer.answer-error {
  border-color: #fecaca;
}

.results-section {
  text-align: center;
  padding: 40px 20px;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin: 24px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.results-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.excellent .score-value { color: #10b981; }
.good .score-value { color: #3b82f6; }
.fair .score-value { color: #f59e0b; }
</style>
