<template>
  <div class="page-container weak-points-page">
    <div class="page-header">
      <el-button text @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎯 薄弱点分析与推荐</h2>
      <div class="header-spacer" />
    </div>

    <div class="analysis-content">
      <!-- 概览 -->
      <div class="overview-section">
        <div class="overview-card" v-for="stat in overviewStats" :key="stat.label">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 薄弱科目 -->
      <div class="section-card" v-if="weakPoints.length > 0">
        <h3>⚠️ 需要加强的科目</h3>
        <div class="weak-items">
          <div class="weak-item" v-for="item in weakPoints" :key="item.subject">
            <div class="weak-header">
              <span class="subject-name">{{ subjectMap[item.subject] }}</span>
              <span class="accuracy-badge" :class="item.accuracy < 50 ? 'critical' : 'warning'">
                {{ item.accuracy }}%
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: item.accuracy + '%', background: getAccuracyColor(item.accuracy) }"></div>
            </div>
            <div class="weak-detail">
              <span>正确: {{ item.correct }} / {{ item.total }}</span>
            </div>
            <el-button size="small" type="primary" @click="startPractice(item.subject)">
              开始练习
            </el-button>
          </div>
        </div>
      </div>

      <!-- 优势科目 -->
      <div class="section-card" v-if="strongPoints.length > 0">
        <h3>💪 优势科目</h3>
        <div class="strong-items">
          <div class="strong-item" v-for="item in strongPoints" :key="item.subject">
            <span class="subject-name">{{ subjectMap[item.subject] }}</span>
            <span class="accuracy-badge success">{{ item.accuracy }}%</span>
          </div>
        </div>
      </div>

      <!-- 今日推荐 -->
      <div class="section-card">
        <h3>📋 今日推荐</h3>
        <div class="daily-recommendations">
          <div class="recommend-item" v-for="rec in dailyRecs" :key="rec.type">
            <div class="rec-icon">{{ rec.icon }}</div>
            <div class="rec-info">
              <span class="rec-title">{{ rec.title }}</span>
              <span class="rec-count">{{ rec.count }} 题</span>
            </div>
            <el-button size="small" @click="startRecommendation(rec)">
              开始
            </el-button>
          </div>
        </div>
      </div>

      <!-- 词汇复习 -->
      <div class="section-card" v-if="reviewWords.length > 0">
        <h3>📚 需要复习的词汇</h3>
        <div class="vocab-review-list">
          <div class="vocab-item" v-for="word in reviewWords.slice(0, 10)" :key="word.id">
            <span class="vocab-word">{{ word.word }}</span>
            <span class="vocab-meaning">{{ word.meaning }}</span>
          </div>
        </div>
        <el-button type="primary" size="small" @click="$router.push('/vocab')">
          查看全部
        </el-button>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-if="loading">
        <el-skeleton :rows="8" animated />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { weakPointsAPI } from '@/api'

const weakPoints = ref([])
const strongPoints = ref([])
const reviewWords = ref([])
const dailyRecs = ref([])
const loading = ref(true)

const subjectMap = {
  reading: '📖 阅读',
  listening: '🎧 听力',
  speaking: '🎤 口语',
  writing: '✍️ 写作',
}

const overviewStats = computed(() => [
  { icon: '📊', label: '总练习数', value: totalPractices.value },
  { icon: '✅', label: '正确数', value: totalCorrect.value },
  { icon: '❌', label: '错误数', value: totalWrong.value },
  { icon: '🎯', label: '平均正确率', value: avgAccuracy.value + '%' },
])

const totalPractices = computed(() => weakPoints.value.reduce((s, w) => s + w.total, 0))
const totalCorrect = computed(() => weakPoints.value.reduce((s, w) => s + w.correct, 0))
const totalWrong = computed(() => totalPractices.value - totalCorrect.value)
const avgAccuracy = computed(() => {
  if (totalPractices.value === 0) return 0
  return Math.round(totalCorrect.value / totalPractices.value * 100)
})

onMounted(async () => {
  await loadAnalysis()
  loading.value = false
})

const loadAnalysis = async () => {
  try {
    const res = await weakPointsAPI.getAnalysis()
    weakPoints.value = res.data?.data?.weakPoints || []
    strongPoints.value = res.data?.data?.strongPoints || []
    reviewWords.value = res.data?.data?.reviewWords || []
    
    dailyRecs.value = [
      { type: 'weak', icon: '⚠️', title: '薄弱科目练习', count: weakPoints.value.reduce((s, w) => s + 5, 0) },
      { type: 'vocab', icon: '📚', title: '词汇复习', count: reviewWords.value.length || 15 },
      { type: 'review', icon: '🔄', title: '错题重做', count: 5 },
    ]
  } catch (e) {
    // Use mock data for demo
    weakPoints.value = [
      { subject: 'listening', total: 50, correct: 25, accuracy: 50 },
      { subject: 'speaking', total: 30, correct: 18, accuracy: 60 },
    ]
    strongPoints.value = [
      { subject: 'reading', total: 100, correct: 85, accuracy: 85 },
    ]
    dailyRecs.value = [
      { type: 'weak', icon: '⚠️', title: '听力专项练习', count: 10 },
      { type: 'vocab', icon: '📚', title: '词汇复习', count: 15 },
      { type: 'review', icon: '🔄', title: '错题重做', count: 5 },
    ]
  }
}

const startPractice = (subject) => {
  ElMessage.info(`开始${subjectMap[subject]}练习`)
  // Navigate to practice page
}

const startRecommendation = (rec) => {
  ElMessage.info(`开始${rec.title}`)
}

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return '#10b981'
  if (accuracy >= 60) return '#f59e0b'
  return '#ef4444'
}
</script>

<style scoped>
.weak-points-page {
  max-width: 900px;
  margin: 0 auto;
}

.overview-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-card h3 {
  margin-bottom: 16px;
  color: #333;
}

.weak-items,
.strong-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-item {
  padding: 16px;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  background: #fef2f2;
}

.weak-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subject-name {
  font-weight: 600;
  color: #333;
}

.accuracy-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.accuracy-badge.critical {
  background: #fee2e2;
  color: #ef4444;
}

.accuracy-badge.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.accuracy-badge.success {
  background: #d1fae5;
  color: #10b981;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.weak-detail {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.strong-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 8px;
}

.daily-recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.rec-icon {
  font-size: 24px;
}

.rec-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rec-title {
  font-weight: 600;
  color: #333;
}

.rec-count {
  font-size: 12px;
  color: #909399;
}

.vocab-review-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.vocab-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.vocab-word {
  display: block;
  font-weight: 600;
  color: #4a6cf7;
  margin-bottom: 4px;
}

.vocab-meaning {
  font-size: 13px;
  color: #666;
}

.loading-section {
  text-align: center;
  padding: 40px;
}
</style>
