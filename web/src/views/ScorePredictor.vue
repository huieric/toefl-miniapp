<template>
  <div class="score-predictor-page">
    <!-- 分数预测概览 -->
    <div class="predictor-hero">
      <div class="hero-total">
        <span class="total-label">预测总分</span>
        <h1 class="total-score">{{ predictedScore.total }}</h1>
        <span class="total-level">{{ level.level }} {{ level.emoji }}</span>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">{{ practiceStats.totalProblems }}</span>
          <span class="stat-label">总题数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ practiceStats.accuracy }}%</span>
          <span class="stat-label">正确率</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ practiceStats.streak }}天</span>
          <span class="stat-label">连胜</span>
        </div>
      </div>
    </div>

    <!-- 四科分数 -->
    <div class="sections-grid">
      <div class="section-card" :class="{ weak: section.toeflScore < 24 }" v-for="(section, key) in sectionsData" :key="key">
        <div class="section-header">
          <span class="section-icon">{{ sectionIcons[key] }}</span>
          <h3>{{ sectionLabels[key] }}</h3>
        </div>
        <div class="section-score">
          <span class="score-value">{{ section.toeflScore }}</span>
          <span class="score-max">/30</span>
        </div>
        <div class="section-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: section.scorePercent + '%', background: sectionColors[key] }"></div>
          </div>
          <span class="progress-text">{{ section.scorePercent }}%</span>
        </div>
        <div class="section-details" v-if="section.topicDistribution">
          <div class="detail-item" v-for="(value, label) in section.topicDistribution" :key="label">
            <span class="detail-label">{{ labelLabels[key][label] || label }}</span>
            <div class="detail-bar">
              <div class="detail-fill" :style="{ width: value + '%' }"></div>
            </div>
            <span class="detail-value">{{ value }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图 -->
    <div class="trend-section">
      <h3>📈 进步趋势</h3>
      <div class="trend-chart">
        <div class="trend-line">
          <div class="chart-grid" v-for="i in 5" :key="i"></div>
          <svg class="trend-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
            <polyline
              :points="getPolylinePoints('total')"
              fill="none"
              stroke="#667eea"
              stroke-width="3"
            />
            <polyline
              :points="getPolylinePoints('reading')"
              fill="none"
              stroke="#ff6b6b"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <polyline
              :points="getPolylinePoints('listening')"
              fill="none"
              stroke="#4ecdc4"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <polyline
              :points="getPolylinePoints('speaking')"
              fill="none"
              stroke="#ffd93d"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <polyline
              :points="getPolylinePoints('writing')"
              fill="none"
              stroke="#6c5ce7"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <circle
              v-for="(point, index) in trendData"
              :key="index"
              :cx="getX(index)"
              :cy="getY(point.total)"
              r="5"
              fill="#667eea"
            />
          </svg>
        </div>
        <div class="trend-dates">
          <span v-for="date in trendDates" :key="date">{{ date }}</span>
        </div>
      </div>
      <div class="trend-legend">
        <span class="legend-item"><span class="legend-dot" style="background: #667eea"></span> 总分</span>
        <span class="legend-item"><span class="legend-dot" style="background: #ff6b6b"></span> 阅读</span>
        <span class="legend-item"><span class="legend-dot" style="background: #4ecdc4"></span> 听力</span>
        <span class="legend-item"><span class="legend-dot" style="background: #ffd93d"></span> 口语</span>
        <span class="legend-item"><span class="legend-dot" style="background: #6c5ce7"></span> 写作</span>
      </div>
    </div>

    <!-- 提分建议 -->
    <div class="recommendations-section">
      <h3>💡 提分建议</h3>
      <div class="recommendation-card" :class="'priority-' + rec.priority" v-for="rec in recommendations" :key="rec.section">
        <div class="rec-header">
          <span class="rec-icon">{{ sectionIcons[rec.section] }}</span>
          <div class="rec-info">
            <h4>{{ sectionLabels[rec.section] }}提分建议</h4>
            <span class="rec-priority" :class="rec.priority">
              {{ rec.priority === 'high' ? '⚠️ 高优先级' : rec.priority === 'medium' ? '📌 中优先级' : 'ℹ️ 低优先级' }}
            </span>
          </div>
          <span class="rec-weeks">{{ rec.improvementWeeks }}周可提升</span>
        </div>
        <p class="rec-suggestion">{{ rec.suggestion }}</p>
        <div class="rec-target">
          <strong>目标练习：</strong>{{ rec.targetPractice }}
        </div>
      </div>
    </div>

    <!-- 模拟考试预测 -->
    <div class="mock-exam-section">
      <h3>🎯 模拟考试分数预测</h3>
      <p class="mock-disclaimer">基于最近30天练习数据生成预测分数</p>
      
      <div class="mock-prediction">
        <div class="mock-score">
          <span class="mock-label">预测总分</span>
          <span class="mock-value">{{ mockPrediction.predictedScore.total }}</span>
        </div>
        <div class="mock-details">
          <div class="mock-item" v-for="(score, key) in mockPrediction.predictedScore" :key="key" v-if="key !== 'total'">
            <span class="mock-item-label">{{ sectionLabels[key] }}</span>
            <span class="mock-item-score">{{ score }}</span>
          </div>
        </div>
        <p class="mock-confidence">预测置信度: {{ mockPrediction.confidence }}%</p>
        <p class="mock-disclaimer-text">{{ mockPrediction.disclaimer }}</p>
      </div>
    </div>

    <!-- 目标分数追踪 -->
    <div class="goal-tracker">
      <h3>🎯 目标分数追踪</h3>
      <div class="goal-input">
        <label>目标总分</label>
        <input type="number" v-model.number="targetGoal" min="0" max="120" />
      </div>
      <div class="goal-progress">
        <div class="goal-bar">
          <div class="goal-fill" :style="{ width: goalPercent + '%' }"></div>
        </div>
        <div class="goal-stats">
          <span>当前: {{ predictedScore.total }}</span>
          <span>差距: {{ Math.max(0, targetGoal - predictedScore.total) }}</span>
          <span>进度: {{ goalPercent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { scorePredictorAPI } from '@/api'

export default {
  name: 'ScorePredictor',
  setup() {
    const sectionIcons = {
      reading: '📖',
      listening: '🎧',
      speaking: '🗣️',
      writing: '✍️',
    }

    const sectionLabels = {
      reading: '阅读',
      listening: '听力',
      speaking: '口语',
      writing: '写作',
    }

    const labelLabels = {
      reading: {
        facts: '事实题',
        inferences: '推理题',
        vocabulary: '词汇题',
        negative: '否定题',
        proseSummary: '摘要题',
        fillBlanks: '填空题',
      },
      listening: {
        conversations: '对话',
        lectures: '讲座',
        noteTaking: '笔记',
        inference: '推理',
      },
    }

    const sectionColors = {
      reading: '#ff6b6b',
      listening: '#4ecdc4',
      speaking: '#ffd93d',
      writing: '#6c5ce7',
    }

    const predictedScore = ref({
      total: 94,
      reading: 25,
      listening: 24,
      speaking: 23,
      writing: 22,
    })

    const level = ref({ level: '中高级', emoji: '🌳' })
    const practiceStats = ref({
      totalProblems: 458,
      accuracy: 74.7,
      streak: 12,
    })

    const sectionsData = ref({
      reading: {
        toeflScore: 25,
        scorePercent: 83,
        accuracy: 76.0,
        topicDistribution: {
          facts: 82,
          inferences: 68,
          vocabulary: 71,
          negative: 65,
          proseSummary: 58,
          fillBlanks: 52,
        },
      },
      listening: {
        toeflScore: 24,
        scorePercent: 80,
        accuracy: 74.6,
        topicDistribution: {
          conversations: 78,
          lectures: 71,
          noteTaking: 69,
          inference: 73,
        },
      },
      speaking: {
        toeflScore: 23,
        scorePercent: 77,
        avgScore: 22.5,
      },
      writing: {
        toeflScore: 22,
        scorePercent: 73,
        avgScore: 21.0,
      },
    })

    const trendData = ref([
      { date: '01/01', reading: 22, listening: 21, speaking: 20, writing: 19, total: 82 },
      { date: '01/08', reading: 23, listening: 22, speaking: 21, writing: 20, total: 86 },
      { date: '01/15', reading: 23, listening: 22, speaking: 21, writing: 20, total: 86 },
      { date: '01/22', reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 },
      { date: '01/29', reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 },
      { date: '02/05', reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
      { date: '02/12', reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
    ])

    const trendDates = computed(() => trendData.value.map(t => t.date))

    const recommendations = ref([
      {
        priority: 'high',
        section: 'writing',
        suggestion: '加强综合写作的笔记整理，独立写作多积累素材',
        targetPractice: '每周2篇写作，对照范文修改',
        improvementWeeks: 3,
      },
      {
        priority: 'high',
        section: 'speaking',
        suggestion: '增加口语练习频率，重点练习综合口语的笔记整合',
        targetPractice: '每天15分钟口语练习，录音自测',
        improvementWeeks: 3,
      },
      {
        priority: 'medium',
        section: 'listening',
        suggestion: '提升多任务处理能力，边听边记笔记',
        targetPractice: '练习边听边总结要点',
        improvementWeeks: 2,
      },
    ])

    const mockPrediction = ref({
      predictedScore: { reading: 26, listening: 25, speaking: 24, writing: 23, total: 98 },
      confidence: 85,
      disclaimer: '此分数为基于练习数据的估算值，实际考试分数可能有所差异',
    })

    const targetGoal = ref(100)
    const goalPercent = computed(() => Math.min(100, Math.round((predictedScore.value.total / targetGoal.value) * 100)))

    function getX(index) {
      return (index / (trendData.value.length - 1)) * 600
    }

    function getY(score) {
      return 200 - (score / 30) * 180
    }

    function getPolylinePoints(key) {
      return trendData.value.map((t, i) => `${getX(i)},${getY(t[key])}`).join(' ')
    }

    async function loadScoreData() {
      try {
        const res = await scorePredictorAPI.getOverview()
        const data = res.data?.data
        if (data) {
          predictedScore.value = data.predictedScore
          level.value = data.level
          practiceStats.value = data.practiceStats
          recommendations.value = data.recommendations
        }
      } catch (e) {
        console.error('加载分数数据失败:', e)
      }
    }

    async function loadSections() {
      try {
        const res = await scorePredictorAPI.getSections()
        if (res.data?.data) {
          sectionsData.value = res.data.data
        }
      } catch (e) {
        console.error('加载科目数据失败:', e)
      }
    }

    onMounted(() => {
      loadScoreData()
      loadSections()
    })

    return {
      sectionIcons,
      sectionLabels,
      labelLabels,
      sectionColors,
      predictedScore,
      level,
      practiceStats,
      sectionsData,
      trendData,
      trendDates,
      recommendations,
      mockPrediction,
      targetGoal,
      goalPercent,
      getPolylinePoints,
      getX,
      getY,
    }
  },
}
</script>

<style scoped>
.score-predictor-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

/* 英雄区域 */
.predictor-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  text-align: center;
  margin-bottom: 24px;
}

.hero-total {
  margin-bottom: 24px;
}

.total-label {
  font-size: 16px;
  opacity: 0.9;
}

.total-score {
  font-size: 64px;
  margin: 8px 0;
  font-weight: 900;
}

.total-level {
  font-size: 18px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

/* 四科卡片 */
.sections-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-top: 4px solid transparent;
  transition: all 0.3s;
}

.section-card.weak {
  border-top-color: #fee2e2;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
}

.section-score {
  margin-bottom: 16px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
}

.score-max {
  font-size: 18px;
  color: #999;
}

.section-progress {
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.section-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-size: 11px;
  color: #666;
  min-width: 60px;
}

.detail-bar {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.detail-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
}

.detail-value {
  font-size: 11px;
  color: #666;
  min-width: 35px;
  text-align: right;
}

/* 趋势图 */
.trend-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trend-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.trend-chart {
  position: relative;
  margin-bottom: 16px;
}

.trend-line {
  position: relative;
  height: 200px;
}

.chart-grid {
  position: absolute;
  width: 100%;
  height: 1px;
  background: #f0f0f0;
}

.trend-svg {
  width: 100%;
  height: 100%;
}

.trend-dates {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* 提分建议 */
.recommendations-section {
  margin-bottom: 24px;
}

.recommendations-section h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.recommendation-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ddd;
}

.recommendation-card.priority-high {
  border-left-color: #fee2e2;
}

.recommendation-card.priority-medium {
  border-left-color: #fef3c7;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-icon {
  font-size: 24px;
}

.rec-info {
  flex: 1;
}

.rec-info h4 {
  margin: 0;
  font-size: 16px;
}

.rec-priority {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-top: 4px;
}

.rec-priority.high {
  background: #fee2e2;
  color: #dc2626;
}

.rec-priority.medium {
  background: #fef3c7;
  color: #d97706;
}

.rec-weeks {
  font-size: 12px;
  color: #666;
}

.rec-suggestion {
  margin: 0 0 8px 0;
  color: #333;
  line-height: 1.6;
}

.rec-target {
  font-size: 13px;
  color: #666;
}

/* 模拟考试 */
.mock-exam-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mock-exam-section h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.mock-disclaimer {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.mock-prediction {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
}

.mock-score {
  text-align: center;
  margin-bottom: 20px;
}

.mock-label {
  display: block;
  font-size: 14px;
  color: #666;
}

.mock-value {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
}

.mock-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.mock-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.mock-item-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.mock-item-score {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.mock-confidence {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.mock-disclaimer-text {
  text-align: center;
  font-size: 12px;
  color: #999;
}

/* 目标追踪 */
.goal-tracker {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.goal-tracker h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.goal-input {
  margin-bottom: 20px;
}

.goal-input label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.goal-input input {
  width: 100%;
  max-width: 200px;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 18px;
  text-align: center;
  transition: border-color 0.3s;
}

.goal-input input:focus {
  outline: none;
  border-color: #667eea;
}

.goal-progress {
  margin-top: 16px;
}

.goal-bar {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 10px;
  transition: width 0.3s;
}

.goal-stats {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .sections-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mock-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-stats {
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .sections-grid {
    grid-template-columns: 1fr;
  }

  .mock-details {
    grid-template-columns: 1fr;
  }
}
</style>
