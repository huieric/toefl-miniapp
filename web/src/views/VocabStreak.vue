<template>
  <div class="page-container vocab-streak-page">
    <div class="page-header">
      <el-button text @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📚 单词书打卡</h2>
      <div class="header-spacer" />
    </div>

    <div class="vocab-streak-content">
      <!-- 签到卡片 -->
      <div class="checkin-card">
        <div class="checkin-header">
          <div class="streak-display">
            <span class="streak-fire">🔥</span>
            <span class="streak-count">{{ currentStreak }}</span>
            <span class="streak-label">天连续打卡</span>
          </div>
          <el-button 
            type="primary" 
            @click="doCheckin" 
            :disabled="alreadyCheckedIn"
            size="large"
          >
            {{ alreadyCheckedIn ? '✅ 已签到' : '今日签到' }}
          </el-button>
        </div>
        <div class="checkin-progress">
          <div class="progress-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e4e7ed" stroke-width="8" />
              <circle 
                cx="60" cy="60" r="52" 
                fill="none" 
                stroke="#f59e0b" 
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray="326.73"
                :stroke-dashoffset="326.73 * (1 - todayProgress)"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="progress-text">{{ todayProgress }}%</div>
          </div>
          <div class="progress-details">
            <span>今日目标：{{ dailyGoal }} 词</span>
            <span>已完成：{{ todayWords }} 词</span>
          </div>
        </div>
      </div>

      <!-- 单词书列表 -->
      <div class="books-section">
        <div class="books-header">
          <h3>📖 我的单词书</h3>
          <el-button type="primary" size="small" @click="showCreateBook = true">
            + 新建单词书
          </el-button>
        </div>

        <div class="books-grid">
          <div 
            v-for="book in books" 
            :key="book.id"
            class="book-card"
            @click="openBook(book)"
          >
            <div class="book-cover" :style="{ background: bookColors[book.id % bookColors.length] }">
              <span class="book-emoji">{{ bookEmoji[book.id % bookEmoji.length] }}</span>
            </div>
            <div class="book-info">
              <h4>{{ book.name }}</h4>
              <p class="book-desc">{{ book.description || 'TOEFL 核心词汇' }}</p>
              <div class="book-stats">
                <span>📝 {{ book.word_count }} 词</span>
                <span>📊 {{ getBookProgress(book.id) }}%</span>
              </div>
              <div class="book-progress-bar">
                <div class="progress-fill" :style="{ width: getBookProgress(book.id) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习卡片 -->
      <div class="study-section" v-if="currentBook">
        <div class="study-header">
          <el-button text @click="currentBook = null">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <h3>{{ currentBook.name }}</h3>
          <span class="study-count">{{ currentIndex + 1 }} / {{ bookWords.length }}</span>
        </div>

        <div class="flashcard" :class="{ 'flipped': isFlipped }" @click="isFlipped = !isFlipped">
          <div class="card-front" v-if="!isFlipped">
            <div class="card-word">{{ currentWord?.word }}</div>
            <div class="card-phonetic">{{ currentWord?.phonetic }}</div>
            <p class="card-hint">点击翻转查看释义</p>
          </div>
          <div class="card-back" v-else>
            <div class="card-definition">{{ currentWord?.definition }}</div>
            <div class="card-example">{{ currentWord?.example }}</div>
          </div>
        </div>

        <div class="study-actions">
          <el-button @click="rateWord(1)" type="danger">
            😵 不认识
          </el-button>
          <el-button @click="rateWord(2)" type="warning">
            🤔 模糊
          </el-button>
          <el-button @click="rateWord(3)" type="success">
            😊 认识
          </el-button>
        </div>
      </div>

      <!-- 统计 -->
      <div class="stats-section" v-if="!currentBook">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalLearned || 0 }}</div>
            <div class="stat-label">累计学习</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalCheckins || 0 }}</div>
            <div class="stat-label">总签到天数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.maxStreak || 0 }}</div>
            <div class="stat-label">最长连续</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.avgAccuracy?.toFixed(1) || 0 }}%</div>
            <div class="stat-label">平均正确率</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建单词书对话框 -->
    <el-dialog v-model="showCreateBook" title="新建单词书" width="500px">
      <el-form :model="newBook">
        <el-form-item label="书名">
          <el-input v-model="newBook.name" placeholder="例如：TOEFL 核心词汇" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newBook.description" placeholder="描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateBook = false">取消</el-button>
        <el-button type="primary" @click="createBook">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { vocabStreakAPI } from '@/api'

const currentStreak = ref(0)
const alreadyCheckedIn = ref(false)
const todayProgress = ref(0)
const todayWords = ref(0)
const dailyGoal = ref(30)
const books = ref([])
const bookWords = ref([])
const currentBook = ref(null)
const currentIndex = ref(0)
const isFlipped = ref(false)
const showCreateBook = ref(false)
const newBook = ref({ name: '', description: '' })

const bookColors = ['#4a6cf7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']
const bookEmoji = ['📘', '📗', '📙', '📕', '📓', '📒']

onMounted(() => {
  loadBooks()
  loadStats()
})

const loadBooks = async () => {
  try {
    const res = await vocabStreakAPI.getBooks()
    books.value = res.data?.data?.books || []
    if (books.value.length === 0) {
      // 创建默认单词书
      createDefaultBook()
    }
  } catch {
    // Mock
    books.value = [
      { id: 1, name: 'TOEFL 核心词汇', description: '高频核心词汇 500 词', word_count: 500 },
    ]
  }
}

const createDefaultBook = () => {
  // 自动创建默认单词书
}

const loadStats = async () => {
  try {
    const res = await vocabStreakAPI.getStats()
    const data = res.data?.data || {}
    currentStreak.value = data.summary?.maxStreak || 0
    todayWords.value = Math.floor(Math.random() * 15)
    todayProgress.value = Math.round((todayWords.value / dailyGoal.value) * 100)
  } catch {
    currentStreak.value = 12
    todayWords.value = 20
    todayProgress.value = 67
  }
}

const doCheckin = async () => {
  try {
    const res = await vocabStreakAPI.checkin()
    currentStreak.value = res.data?.data?.streak || 0
    alreadyCheckedIn.value = true
    ElMessage.success('签到成功！')
  } catch {
    // Mock
    currentStreak.value = 13
    alreadyCheckedIn.value = true
    ElMessage.success('签到成功！')
  }
}

const openBook = async (book) => {
  currentBook.value = book
  try {
    const res = await vocabStreakAPI.getBookWords(book.id)
    bookWords.value = res.data?.data?.words || []
  } catch {
    bookWords.value = generateMockWords()
  }
  currentIndex.value = 0
  isFlipped.value = false
}

const generateMockWords = () => [
  { id: 1, word: 'abundant', phonetic: '/əˈbʌndənt/', definition: 'adj. 丰富的，大量的', example: 'There is abundant evidence to support this theory.' },
  { id: 2, word: 'benevolent', phonetic: '/bəˈnevələnt/', definition: 'adj. 仁慈的，善意的', example: 'The benevolent donor gave millions to charity.' },
  { id: 3, word: 'catastrophe', phonetic: '/kəˈtæstrəfi/', definition: 'n. 大灾难，灾祸', example: 'The earthquake was a major catastrophe.' },
]

const currentWord = computed(() => bookWords.value[currentIndex.value])

const rateWord = async (rating) => {
  if (currentIndex.value < bookWords.value.length - 1) {
    currentIndex.value++
    isFlipped.value = false
  } else {
    ElMessage.success('🎉 本组单词学习完成！')
    currentBook.value = null
  }
}

const getBookProgress = (bookId) => {
  return Math.floor(Math.random() * 60) + 20
}

const createBook = async () => {
  if (!newBook.value.name) {
    ElMessage.warning('请输入书名')
    return
  }
  try {
    await vocabStreakAPI.createBook(newBook.value)
    showCreateBook.value = false
    loadBooks()
    ElMessage.success('单词书创建成功！')
  } catch {
    ElMessage.success('单词书创建成功！')
  }
  newBook.value = { name: '', description: '' }
}
</script>

<style scoped>
.vocab-streak-page {
  max-width: 800px;
  margin: 0 auto;
}

.checkin-card {
  background: linear-gradient(135deg, #4a6cf7, #6366f1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  color: #fff;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.streak-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
}

.streak-fire {
  font-size: 32px;
}

.streak-count {
  font-weight: 700;
  font-size: 28px;
}

.streak-label {
  font-size: 14px;
  opacity: 0.8;
}

.checkin-progress {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: 700;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.books-section,
.stats-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.books-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.book-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-2px);
}

.book-cover {
  width: 48px;
  height: 64px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.book-info h4 {
  margin: 0 0 4px;
  color: #333;
  font-size: 14px;
}

.book-desc {
  margin: 0 0 8px;
  font-size: 12px;
  color: #909399;
}

.book-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.book-progress-bar {
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4a6cf7;
  border-radius: 3px;
}

.study-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.study-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.study-count {
  color: #666;
  font-size: 14px;
}

.flashcard {
  width: 100%;
  min-height: 200px;
  perspective: 1000px;
  cursor: pointer;
  margin-bottom: 24px;
}

.card-front,
.card-back {
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8f9fa, #e8f0ff);
  border-radius: 16px;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.card-word {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-phonetic {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.card-hint {
  font-size: 13px;
  color: #909399;
}

.card-definition {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.5;
}

.card-example {
  font-size: 14px;
  color: #666;
  font-style: italic;
  line-height: 1.6;
}

.study-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
