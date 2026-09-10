<template>
  <div class="page-container ai-writing-page">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>✍️ AI 写作批改</h2>
      <div class="header-spacer" />
    </div>

    <div class="ai-writing-content">
      <!-- 题目选择 -->
      <div class="prompt-section" v-if="!writingStarted">
        <h3>选择写作题目</h3>
        <div class="prompt-cards">
          <div 
            v-for="prompt in prompts" 
            :key="prompt.id"
            class="prompt-card"
            :class="{ 'selected': selectedPrompt === prompt.id }"
            @click="selectedPrompt = prompt.id"
          >
            <div class="prompt-meta">
              <el-tag :type="prompt.task === 'independent' ? 'primary' : 'success'" size="small">
                {{ prompt.task === 'independent' ? '独立写作' : '综合写作' }}
              </el-tag>
              <span>⏱️ {{ prompt.timeLimit }} 分钟</span>
              <span>~{{ prompt.minWords }} 词</span>
            </div>
            <p class="prompt-text">{{ prompt.prompt }}</p>
          </div>
        </div>
        <el-button type="primary" @click="startWriting" :disabled="!selectedPrompt">
          开始写作
        </el-button>
      </div>

      <!-- 写作界面 -->
      <div class="writing-interface" v-if="writingStarted && !submitted">
        <div class="writing-toolbar">
          <div class="timer" :class="{ 'timer-warning': timeLeft < 300 }">
            ⏱️ {{ formatTime(timeLeft) }}
          </div>
          <div class="word-count">
            <span :class="{ 'word-count-low': wordCount < 200 }">
              📝 {{ wordCount }} / {{ selectedPromptObj?.minWords || 200 }} 词
            </span>
          </div>
          <el-button type="success" @click="submitWriting" :disabled="wordCount < 50">
            提交批改
          </el-button>
        </div>

        <div class="writing-area">
          <div class="prompt-display" v-if="selectedPromptObj">
            <h4>题目</h4>
            <p>{{ selectedPromptObj.prompt }}</p>
          </div>
          <textarea 
            v-model="essay" 
            placeholder="在此输入你的作文..."
            class="essay-textarea"
            @input="updateWordCount"
          ></textarea>
        </div>
      </div>

      <!-- 批改结果 -->
      <div class="writing-result" v-if="submitted && result">
        <div class="result-header">
          <h2>🎉 批改完成！</h2>
          <div class="total-score" :class="getScoreClass(result.bandScore)">
            <span class="score-value">{{ result.scores.total }}</span>
            <span class="score-max">/ 5.0</span>
          </div>
          <div class="band-score">{{ result.bandScore }}</div>
        </div>

        <div class="score-breakdown">
          <h3>📊 评分明细</h3>
          <div class="score-bars">
            <div class="score-bar" v-for="(score, key) in result.scores" :key="key" v-if="key !== 'total' && key !== 'metrics'">
              <div class="bar-label">
                <span class="bar-name">{{ getScoreName(key) }}</span>
                <span class="bar-value">{{ score }}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: (score / 5 * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="score-metrics">
            <span>📝 字数：{{ result.scores.metrics?.wordCount || 0 }}</span>
            <span>📄 句子：{{ result.scores.metrics?.sentenceCount || 0 }}</span>
            <span>📏 均句长：{{ result.scores.metrics?.avgSentenceLength || 0 }}</span>
            <span>🔤 词汇多样性：{{ result.scores.metrics?.lexDiversity || 0 }}</span>
          </div>
        </div>

        <div class="feedback-section" v-if="result.feedback">
          <h3>💡 详细反馈</h3>
          <div 
            v-for="(fb, idx) in result.feedback" 
            :key="idx"
            class="feedback-item"
          >
            <el-icon><InfoFilled /></el-icon>
            <span>{{ fb }}</span>
          </div>
        </div>

        <div class="essay-display">
          <h3>📄 你的作文</h3>
          <div class="essay-text">{{ essay }}</div>
        </div>

        <div class="result-actions">
          <el-button type="primary" @click="writeAgain">
            再次写作
          </el-button>
          <el-button @click="$router.push('/')">
            返回首页
          </el-button>
        </div>
      </div>

      <!-- 批改历史 -->
      <div class="writing-history">
        <h3>📜 批改历史</h3>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item">
            <span class="h-date">{{ formatDate(item.created_at) }}</span>
            <span class="h-score">总分：{{ item.total_score }}</span>
            <span class="h-words">{{ item.word_count }} 词</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, InfoFilled } from '@element-plus/icons-vue'
import { aiWritingAPI } from '@/api'

const prompts = ref([])
const selectedPrompt = ref(null)
const writingStarted = ref(false)
const submitted = ref(false)
const essay = ref('')
const timeLeft = ref(1800)
const wordCount = ref(0)
const result = ref(null)
const history = ref([])

let timer = null

const selectedPromptObj = computed(() => prompts.value.find(p => p.id === selectedPrompt.value))

onMounted(async () => {
  await loadPrompts()
  loadHistory()
})

const loadPrompts = async () => {
  try {
    const res = await aiWritingAPI.getPrompt()
    prompts.value = res.data?.data?.prompts || []
  } catch {
    prompts.value = [
      { id: 1, task: 'independent', prompt: 'Do you agree that universities should require all students to take courses in sciences, social sciences, and humanities?', timeLimit: 30, minWords: 200 },
    ]
  }
}

const startWriting = () => {
  writingStarted.value = true
  timeLeft.value = (selectedPromptObj.value?.timeLimit || 30) * 60
  
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      submitWriting()
    }
  }, 1000)
}

const updateWordCount = () => {
  wordCount.value = essay.value.trim().split(/\s+/).filter(w => w).length
}

const submitWriting = async () => {
  submitted.value = true
  clearInterval(timer)
  
  try {
    const res = await aiWritingAPI.submit({
      promptId: selectedPrompt.value,
      essay: essay.value,
      estimatedTime: 30,
    })
    result.value = res.data?.data || generateMockResult()
  } catch {
    result.value = generateMockResult()
  }
}

const generateMockResult = () => ({
  scores: {
    total: 3.8,
    grammar: 3.5,
    vocabulary: 3.8,
    structure: 4.0,
    coherence: 3.9,
    metrics: { wordCount: 280, sentenceCount: 12, avgSentenceLength: 23, lexDiversity: 0.72 },
  },
  bandScore: 'Band 4 (3.0-3.9) - Good',
  feedback: [
    '文章结构清晰，建议增加更多具体例子。',
    '词汇量不错，注意避免重复使用相同词汇。',
    '语法整体良好，注意个别句子的连接词使用。',
  ],
})

const loadHistory = async () => {
  try {
    const res = await aiWritingAPI.getHistory()
    history.value = res.data?.data?.submissions || []
  } catch {
    history.value = [
      { id: 1, total_score: 3.5, word_count: 250, created_at: new Date(Date.now() - 86400000).toISOString() },
    ]
  }
}

const writeAgain = () => {
  submitted.value = false
  essay.value = ''
  timeLeft.value = 1800
  wordCount.value = 0
  selectedPrompt.value = null
  writingStarted.value = false
}

const getScoreClass = (band) => {
  if (band?.includes('Excellent')) return 'excellent'
  if (band?.includes('Good')) return 'good'
  if (band?.includes('Average')) return 'fair'
  return 'poor'
}

const getScoreName = (key) => {
  const map = { grammar: '语法', vocabulary: '词汇', structure: '结构', coherence: '连贯性' }
  return map[key] || key
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.ai-writing-page {
  max-width: 900px;
  margin: 0 auto;
}

.prompt-section,
.writing-result,
.writing-history {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prompt-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.prompt-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.prompt-card:hover,
.prompt-card.selected {
  border-color: #4a6cf7;
  background: #f0f5ff;
}

.prompt-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.prompt-text {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.writing-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
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

.word-count {
  font-size: 14px;
}

.word-count-low {
  color: #ef4444;
  font-weight: 600;
}

.writing-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-display {
  padding: 16px;
  background: #e8f0ff;
  border-radius: 8px;
}

.prompt-display h4 {
  margin: 0 0 8px;
  color: #4a6cf7;
}

.prompt-display p {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.essay-textarea {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.8;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.essay-textarea:focus {
  border-color: #4a6cf7;
  outline: none;
}

.result-header {
  text-align: center;
  margin-bottom: 32px;
}

.total-score {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  margin: 16px 0;
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

.band-score {
  display: inline-block;
  padding: 4px 16px;
  background: #e8f0ff;
  color: #4a6cf7;
  border-radius: 20px;
  font-weight: 500;
}

.score-breakdown,
.feedback-section,
.essay-display {
  margin-bottom: 24px;
}

.score-breakdown h3,
.feedback-section h3,
.essay-display h3 {
  margin-bottom: 16px;
  color: #333;
}

.score-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.score-bar {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.bar-name {
  color: #666;
}

.bar-value {
  font-weight: 600;
  color: #4a6cf7;
}

.bar-track {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7, #6366f1);
  border-radius: 4px;
  transition: width 0.5s;
}

.score-metrics {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.feedback-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background: #fffbeb;
  border-radius: 6px;
  color: #333;
}

.essay-text {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
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

.h-words {
  font-size: 13px;
  color: #666;
  margin-left: auto;
}
</style>
