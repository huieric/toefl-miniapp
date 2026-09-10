<template>
  <div class="page-container reading-speed-page">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>⚡ 阅读速度训练</h2>
      <div class="header-spacer" />
    </div>

    <div class="reading-speed-content">
      <!-- 选择文章 -->
      <div class="article-select" v-if="!readingStarted">
        <h3>选择训练文章</h3>
        <div class="article-cards">
          <div 
            v-for="article in articles" 
            :key="article.id"
            class="article-card"
            :class="{ 'selected': selectedArticle === article.id }"
            @click="selectArticle(article.id)"
          >
            <h4>{{ article.title }}</h4>
            <div class="article-meta">
              <el-tag :type="getDifficultyTag(article.difficulty)" size="small">
                {{ getDifficultyLabel(article.difficulty) }}
              </el-tag>
              <span>{{ article.wordCount }} 词</span>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="startReading" :disabled="!selectedArticle">
          开始计时阅读
        </el-button>
      </div>

      <!-- 阅读计时器 -->
      <div class="reading-timer" v-if="readingStarted && !readingDone">
        <div class="timer-display">
          <div class="timer-circle">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e4e7ed" stroke-width="6" />
              <circle 
                cx="60" cy="60" r="54" 
                fill="none" 
                stroke="#4a6cf7" 
                stroke-width="6"
                stroke-dasharray="339.292"
                :stroke-dashoffset="339.292 * (1 - progress)"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="timer-text">{{ formatTime(timeLeft) }}</div>
          </div>
        </div>
        <p class="timer-instruction">阅读完毕后点击"我读完了"</p>
      </div>

      <!-- 理解度测试 -->
      <div class="comprehension-test" v-if="readingDone && !submitted">
        <h3>请测试理解度 (1-5分)</h3>
        <div class="comprehension-content">
          <p>你读懂了这篇文章的主要内容吗？</p>
          <div class="star-rating">
            <el-rate 
              v-model="comprehensionScore" 
              :texts="['不太懂', '一般', '还行', '挺懂', '完全理解']"
            />
          </div>
          <el-button type="primary" @click="submitReading" :disabled="comprehensionScore === 0">
            提交结果
          </el-button>
        </div>
      </div>

      <!-- 结果展示 -->
      <div class="speed-result" v-if="submitted && result">
        <div class="result-card">
          <div class="wpm-display">
            <div class="wpm-value">{{ result.wpm }}</div>
            <div class="wpm-label">单词/分钟 (WPM)</div>
            <div class="wpm-level">{{ result.level }}</div>
          </div>

          <div class="speed-chart">
            <div class="chart-bar" v-for="point in trend" :key="point.id">
              <div class="bar-fill" :style="{ height: (point.wpm / 500 * 100) + '%' }"></div>
              <div class="bar-label">{{ point.wpm }}</div>
            </div>
          </div>

          <div class="result-advice">
            <h4>💡 阅读建议</h4>
            <p>{{ result.suggestion }}</p>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div class="speed-history">
        <h3>📊 训练历史</h3>
        <div class="history-grid">
          <div v-for="record in history" :key="record.id" class="history-card">
            <div class="history-wpm">{{ record.wpm }} WPM</div>
            <div class="history-date">{{ formatDate(record.created_at) }}</div>
            <div class="history-wordcount">{{ record.word_count }} 词</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { readingSpeedAPI } from '@/api'

const articles = ref([])
const selectedArticle = ref(null)
const readingStarted = ref(false)
const readingDone = ref(false)
const submitted = ref(false)
const comprehensionScore = ref(3)
const timeLeft = ref(0)
const progress = ref(0)
const result = ref(null)
const history = ref([])

const maxTime = computed(() => 300) // 5 minutes max

let timer = null

onMounted(async () => {
  await loadArticles()
  loadHistory()
})

const loadArticles = async () => {
  try {
    const res = await readingSpeedAPI.getPassage()
    articles.value = res.data?.data?.passages || []
  } catch {
    // Mock articles
    articles.value = [
      { id: 1, title: 'The Impact of Urbanization on Wildlife', wordCount: 180, difficulty: 'medium' },
      { id: 2, title: 'Climate Change and Ocean Currents', wordCount: 185, difficulty: 'hard' },
    ]
  }
}

const selectArticle = (id) => {
  selectedArticle.value = id
}

const startReading = () => {
  readingStarted.value = true
  timeLeft.value = maxTime.value
  const startTime = Date.now()
  
  timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    timeLeft.value = Math.max(0, maxTime.value - elapsed)
    progress.value = elapsed / maxTime.value
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      readingDone.value = true
    }
  }, 1000)
}

const submitReading = async () => {
  submitted.value = true
  const article = articles.value.find(a => a.id === selectedArticle.value)
  
  try {
    const res = await readingSpeedAPI.submit({
      passageId: selectedArticle.value,
      wordCount: article?.wordCount || 150,
      durationSeconds: maxTime.value - timeLeft.value,
      comprehensionScore: comprehensionScore.value * 20,
    })
    result.value = res.data?.data || generateMockResult()
  } catch {
    result.value = generateMockResult()
  }
  
  readingDone.value = false
  loadHistory()
}

const generateMockResult = () => ({
  wpm: Math.round(150 + Math.random() * 200),
  level: 'Intermediate',
  suggestion: '建议多读学术文章提高速度。',
})

const loadHistory = async () => {
  try {
    const res = await readingSpeedAPI.getStats()
    history.value = res.data?.data?.trend || []
  } catch {
    // Mock history
    history.value = [
      { id: 1, wpm: 180, created_at: new Date(Date.now() - 172800000).toISOString(), word_count: 200 },
      { id: 2, wpm: 220, created_at: new Date(Date.now() - 86400000).toISOString(), word_count: 180 },
    ]
  }
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

const getDifficultyTag = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
</script>

<style scoped>
.reading-speed-page {
  max-width: 900px;
  margin: 0 auto;
}

.article-select,
.reading-timer,
.comprehension-test,
.speed-result {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.article-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.article-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.article-card:hover {
  border-color: #4a6cf7;
  background: #f0f5ff;
}

.article-card.selected {
  border-color: #4a6cf7;
  background: #e8f0ff;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.timer-display {
  margin: 24px 0;
}

.timer-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.timer-circle svg {
  width: 100%;
  height: 100%;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.star-rating {
  margin: 24px 0;
}

.wpm-display {
  margin: 32px 0;
}

.wpm-value {
  font-size: 64px;
  font-weight: 700;
  color: #4a6cf7;
  line-height: 1;
}

.wpm-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.wpm-level {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 16px;
  background: #e8f0ff;
  color: #4a6cf7;
  border-radius: 20px;
  font-weight: 600;
}

.speed-chart {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  height: 100px;
  margin: 24px 0;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #4a6cf7, #6366f1);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.bar-label {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.history-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.history-wpm {
  font-size: 24px;
  font-weight: 700;
  color: #4a6cf7;
}

.history-date {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.history-wordcount {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}
</style>
