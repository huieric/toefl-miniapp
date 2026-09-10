<template>
  <div class="srs-review-page">
    <!-- 今日复习概览 -->
    <div class="review-overview">
      <div class="overview-card">
        <span class="overview-icon">📚</span>
        <h4>今日待复习</h4>
        <p class="overview-value">{{ reviewStats.dueCards }}</p>
      </div>
      <div class="overview-card">
        <span class="overview-icon">✅</span>
        <h4>已掌握</h4>
        <p class="overview-value">{{ reviewStats.masteredCards }}</p>
      </div>
      <div class="overview-card">
        <span class="overview-icon">📖</span>
        <h4>学习中</h4>
        <p class="overview-value">{{ reviewStats.learningCards }}</p>
      </div>
      <div class="overview-card">
        <span class="overview-icon">🎯</span>
        <h4>记忆保留率</h4>
        <p class="overview-value">{{ reviewStats.retentionRate }}%</p>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <h3>今日进度</h3>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: reviewStats.todayProgress.percent + '%' }"></div>
      </div>
      <p class="progress-text">
        已完成 {{ reviewStats.todayProgress.reviewed }}/{{ reviewStats.todayProgress.target }} 题
        ({{ reviewStats.todayProgress.percent }}%)
      </p>
    </div>

    <!-- 复习卡片 -->
    <div class="flashcard-section" v-if="dueCards.length > 0">
      <h3>开始复习 ({{ dueCards.length }} 张待复习)</h3>
      
      <div class="flashcard-container">
        <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
          <div class="flashcard-front" v-if="!isFlipped">
            <span class="card-category">{{ currentCard.category }}</span>
            <h2 class="card-word">{{ currentCard.word }}</h2>
            <p class="card-phonetic">{{ currentCard.phonetic }}</p>
            <p class="card-hint">点击查看释义</p>
          </div>
          <div class="flashcard-back" v-else>
            <span class="card-category">{{ currentCard.category }}</span>
            <h2 class="card-word">{{ currentCard.word }}</h2>
            <p class="card-meaning">{{ currentCard.meaning }}</p>
            <p class="card-example">{{ currentCard.example }}</p>
            <p class="card-hint">点击评分</p>
          </div>
        </div>
      </div>

      <!-- 评分按钮 -->
      <div class="rating-buttons" v-if="isFlipped">
        <button class="rating-btn again" @click="submitRating('again')">
          <span class="rating-icon">😣</span>
          <span class="rating-label">再次</span>
          <span class="rating-interval">&lt;1min</span>
        </button>
        <button class="rating-btn hard" @click="submitRating('hard')">
          <span class="rating-icon">😕</span>
          <span class="rating-label">困难</span>
          <span class="rating-interval">{{ Math.max(1, Math.round(currentInterval * 1.2)) }}天</span>
        </button>
        <button class="rating-btn good" @click="submitRating('good')">
          <span class="rating-icon">😊</span>
          <span class="rating-label">良好</span>
          <span class="rating-interval">{{ Math.max(1, Math.round(currentInterval * 2.5)) }}天</span>
        </button>
        <button class="rating-btn easy" @click="submitRating('easy')">
          <span class="rating-icon">😄</span>
          <span class="rating-label">简单</span>
          <span class="rating-interval">{{ Math.max(1, Math.round(currentInterval * 4)) }}天</span>
        </button>
      </div>

      <div class="card-counter">
        卡片 {{ currentCardIndex + 1 }} / {{ dueCards.length }}
      </div>

      <div class="card-nav">
        <button :disabled="currentCardIndex === 0" @click="prevCard">← 上一张</button>
        <button :disabled="currentCardIndex === dueCards.length - 1" @click="nextCard">下一张 →</button>
      </div>
    </div>

    <!-- 无待复习卡片 -->
    <div class="no-reviews" v-else>
      <span class="no-reviews-icon">🎉</span>
      <h3>今日复习完成!</h3>
      <p>明天再来吧，记得继续保持!</p>
    </div>

    <!-- 复习统计 -->
    <div class="stats-section">
      <h3>📊 7日趋势</h3>
      <div class="stats-chart">
        <div class="chart-bar" v-for="(day, index) in reviewHistory" :key="index">
          <div class="bar-fill" :style="{ height: (day.reviewed / 20 * 100) + '%' }"></div>
          <span class="bar-label">{{ day.date.slice(5) }}</span>
          <span class="bar-value">{{ day.reviewed }}</span>
        </div>
      </div>
    </div>

    <!-- 复习计划 -->
    <div class="schedule-section">
      <h3>📅 本周复习计划</h3>
      <div class="schedule-grid">
        <div class="schedule-day" :class="{ today: day.isToday }" v-for="day in reviewSchedule" :key="day.date">
          <span class="day-date">{{ day.date.slice(5) }}</span>
          <span class="day-due">{{ day.dueCards }} 待复习</span>
          <span class="day-new">{{ day.newCards }} 新卡</span>
          <span class="day-time">{{ day.estimatedTime }}min</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { srsReviewAPI } from '@/api'

export default {
  name: 'SRSReview',
  setup() {
    const dueCards = ref([])
    const currentCardIndex = ref(0)
    const isFlipped = ref(false)
    const currentInterval = ref(1)
    const reviewStats = ref({
      totalCards: 5,
      dueCards: 5,
      masteredCards: 1,
      learningCards: 2,
      retentionRate: 85,
      todayProgress: {
        reviewed: 5,
        target: 20,
        percent: 25,
      },
    })
    const reviewHistory = ref([
      { date: '2024-02-05', reviewed: 18, correct: 15, retention: 83 },
      { date: '2024-02-06', reviewed: 15, correct: 12, retention: 80 },
      { date: '2024-02-07', reviewed: 20, correct: 17, retention: 85 },
      { date: '2024-02-08', reviewed: 12, correct: 10, retention: 83 },
      { date: '2024-02-09', reviewed: 22, correct: 19, retention: 86 },
      { date: '2024-02-10', reviewed: 17, correct: 14, retention: 82 },
      { date: '2024-02-11', reviewed: 19, correct: 16, retention: 84 },
    ])
    const reviewSchedule = ref([])

    const currentCard = ref({
      word: 'ubiquitous',
      phonetic: '/juːˈbɪkwɪtəs/',
      meaning: 'adj. 无处不在的',
      example: 'Smartphones are ubiquitous in modern society.',
      category: 'TOEFL核心词汇',
      level: 'advanced',
    })

    function flipCard() {
      isFlipped.value = !isFlipped.value
    }

    async function submitRating(rating) {
      if (dueCards.value.length === 0) return
      
      try {
        await srsReviewAPI.review({
          cardId: dueCards.value[currentCardIndex.value].id,
          rating,
        })
      } catch (e) {
        console.error('提交评分失败:', e)
      }

      // 模拟更新
      reviewStats.value.todayProgress.reviewed += 1
      reviewStats.value.todayProgress.percent = Math.min(100, 
        Math.round((reviewStats.value.todayProgress.reviewed / reviewStats.value.todayProgress.target) * 100)
      )

      isFlipped.value = false
      
      if (currentCardIndex.value < dueCards.value.length - 1) {
        currentCardIndex.value += 1
        currentInterval.value = Math.max(1, Math.floor(Math.random() * 7) + 1)
        currentCard.value = dueCards.value[currentCardIndex.value]
      } else {
        dueCards.value = []
      }
    }

    function prevCard() {
      if (currentCardIndex.value > 0) {
        currentCardIndex.value--
        isFlipped.value = false
        currentCard.value = dueCards.value[currentCardIndex.value]
        currentInterval.value = dueCards.value[currentCardIndex.value].interval || 1
      }
    }

    function nextCard() {
      if (currentCardIndex.value < dueCards.value.length - 1) {
        currentCardIndex.value++
        isFlipped.value = false
        currentCard.value = dueCards.value[currentCardIndex.value]
        currentInterval.value = dueCards.value[currentCardIndex.value].interval || 1
      }
    }

    async function loadDueCards() {
      try {
        const res = await srsReviewAPI.getDueCards()
        dueCards.value = res.data?.data?.cards || []
        if (dueCards.value.length > 0) {
          currentCard.value = dueCards.value[0]
        }
      } catch (e) {
        console.error('加载复习卡片失败:', e)
        dueCards.value = [
          { id: 1, word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', meaning: 'adj. 无处不在的', example: 'Smartphones are ubiquitous in modern society.', category: 'TOEFL核心词汇', level: 'advanced', interval: 0 },
          { id: 2, word: 'ephemeral', phonetic: '/ɪˈfemərəl/', meaning: 'adj. 短暂的', example: 'Fame is ephemeral in the entertainment industry.', category: 'TOEFL核心词汇', level: 'advanced', interval: 0 },
        ]
        currentCard.value = dueCards.value[0]
      }
    }

    async function loadStats() {
      try {
        const res = await srsReviewAPI.getStats()
        reviewStats.value = res.data?.data || reviewStats.value
      } catch (e) {
        console.error('加载统计失败:', e)
      }
    }

    async function loadSchedule() {
      try {
        const res = await srsReviewAPI.getSchedule()
        reviewSchedule.value = res.data?.data?.schedule || []
      } catch (e) {
        console.error('加载计划失败:', e)
        reviewSchedule.value = [
          { date: '2024-02-11', isToday: true, dueCards: 5, newCards: 3, estimatedTime: 16 },
          { date: '2024-02-12', isToday: false, dueCards: 8, newCards: 2, estimatedTime: 20 },
          { date: '2024-02-13', isToday: false, dueCards: 6, newCards: 2, estimatedTime: 16 },
        ]
      }
    }

    onMounted(() => {
      loadDueCards()
      loadStats()
      loadSchedule()
    })

    return {
      dueCards,
      currentCardIndex,
      isFlipped,
      currentInterval,
      currentCard,
      reviewStats,
      reviewHistory,
      reviewSchedule,
      flipCard,
      submitRating,
      prevCard,
      nextCard,
    }
  },
}
</script>

<style scoped>
.srs-review-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 概览卡片 */
.review-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.overview-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.overview-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

/* 进度条 */
.progress-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.progress-bar {
  height: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 8px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 复习卡片 */
.flashcard-section {
  margin-bottom: 24px;
}

.flashcard-section h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.flashcard-container {
  perspective: 1000px;
  margin-bottom: 24px;
}

.flashcard {
  width: 100%;
  min-height: 300px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-front, .flashcard-back {
  position: absolute;
  width: 100%;
  min-height: 300px;
  backface-visibility: hidden;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.flashcard-back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-category {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.flashcard-back .card-category {
  color: rgba(255, 255, 255, 0.8);
}

.card-word {
  font-size: 32px;
  margin: 0 0 12px 0;
  color: #333;
}

.flashcard-back .card-word {
  color: white;
}

.card-phonetic {
  font-size: 18px;
  color: #666;
  margin: 0 0 12px 0;
}

.card-meaning {
  font-size: 24px;
  margin: 0 0 12px 0;
  color: white;
}

.card-example {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-style: italic;
}

.card-hint {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
}

.flashcard-back .card-hint {
  color: rgba(255, 255, 255, 0.7);
}

/* 评分按钮 */
.rating-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.rating-btn {
  padding: 16px 8px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.rating-icon {
  font-size: 24px;
}

.rating-label {
  font-size: 14px;
  font-weight: 600;
}

.rating-interval {
  font-size: 11px;
  opacity: 0.8;
}

.rating-btn.again {
  background: #fee2e2;
  color: #dc2626;
}

.rating-btn.hard {
  background: #fef3c7;
  color: #d97706;
}

.rating-btn.good {
  background: #d1fae5;
  color: #059669;
}

.rating-btn.easy {
  background: #dbeafe;
  color: #2563eb;
}

.card-counter {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.card-nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-nav button {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.card-nav button:hover:not(:disabled) {
  background: #f5f5f5;
}

.card-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 无待复习 */
.no-reviews {
  background: white;
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-reviews-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.no-reviews h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.no-reviews p {
  margin: 0;
  color: #666;
}

/* 统计图表 */
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.stats-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 120px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.bar-value {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

/* 复习计划 */
.schedule-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.schedule-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.schedule-grid {
  display: flex;
  gap: 12px;
}

.schedule-day {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s;
}

.schedule-day.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.day-date {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.day-due {
  display: block;
  font-size: 12px;
  color: #666;
}

.schedule-day.today .day-due {
  color: rgba(255, 255, 255, 0.9);
}

.day-new {
  display: block;
  font-size: 11px;
  color: #999;
}

.day-time {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* 响应式 */
@media (max-width: 600px) {
  .review-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .rating-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .schedule-grid {
    flex-wrap: wrap;
  }

  .schedule-day {
    min-width: calc(50% - 6px);
  }
}
</style>
