<template>
  <div class="mock-exam-page">
    <!-- 模考列表 -->
    <div class="exam-list-section">
      <h2>📝 全真模拟考试</h2>
      <p class="section-desc">还原真实托福考试环境，计时无提示，自动评分</p>
      
      <div class="exam-cards">
        <div class="exam-card full-exam" @click="selectExam(exam)">
          <div class="exam-badge full">🏆 全真模考</div>
          <h3>{{ exam.name }}</h3>
          <p>{{ exam.description }}</p>
          <div class="exam-meta">
            <span>⏱️ {{ Math.round(exam.totalDuration / 60000) }}分钟</span>
            <span>📊 {{ Object.keys(exam.questionCounts).length }}科</span>
          </div>
          <button class="start-btn" @click.stop="startExam(exam)">开始考试</button>
        </div>
        
        <div class="exam-card section-exam" v-for="sectionExam in sectionExams" :key="sectionExam.id" @click="selectExam(sectionExam)">
          <div class="exam-badge section">{{ sectionExam.level === 'practice' ? '📌 专项练习' : '📊 模拟' }}</div>
          <h3>{{ sectionExam.name }}</h3>
          <p>{{ sectionExam.description }}</p>
          <div class="exam-meta">
            <span>⏱️ {{ Math.round(sectionExam.totalDuration / 60000) }}分钟</span>
            <span>📝 {{ sectionExam.questionCounts[sectionExam.sections[0]] }}题</span>
          </div>
          <button class="start-btn" @click.stop="startExam(sectionExam)">开始练习</button>
        </div>
      </div>
    </div>

    <!-- 考试统计 -->
    <div class="exam-stats-section">
      <h2>📊 考试统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <span class="stat-value">{{ examStats.totalExams }}</span>
          <span class="stat-label">考试次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <span class="stat-value">{{ examStats.avgScore }}</span>
          <span class="stat-label">平均总分</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🏆</span>
          <span class="stat-value">{{ examStats.highestScore }}</span>
          <span class="stat-label">最高分</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏱️</span>
          <span class="stat-value">{{ examStats.avgDuration }}</span>
          <span class="stat-label">平均用时</span>
        </div>
      </div>
    </div>

    <!-- 成绩历史 -->
    <div class="exam-history-section">
      <h2>📜 成绩历史</h2>
      <div class="history-table">
        <div class="table-header">
          <span class="col-date">日期</span>
          <span class="col-exam">考试名称</span>
          <span class="col-reading">阅读</span>
          <span class="col-listening">听力</span>
          <span class="col-speaking">口语</span>
          <span class="col-writing">写作</span>
          <span class="col-total">总分</span>
          <span class="col-level">等级</span>
        </div>
        <div class="table-row" v-for="record in examHistory" :key="record.id">
          <span class="col-date">{{ formatDate(record.date) }}</span>
          <span class="col-exam">{{ record.examName }}</span>
          <span class="col-reading">{{ record.scores.reading || '-' }}</span>
          <span class="col-listening">{{ record.scores.listening || '-' }}</span>
          <span class="col-speaking">{{ record.scores.speaking || '-' }}</span>
          <span class="col-writing">{{ record.scores.writing || '-' }}</span>
          <span class="col-total">{{ record.scores.total }}</span>
          <span class="col-level">{{ record.level.emoji }} {{ record.level.level }}</span>
        </div>
      </div>
    </div>

    <!-- 正在进行的考试 -->
    <div class="exam-in-progress" v-if="currentExam">
      <div class="exam-header">
        <h2>🎯 考试进行中</h2>
        <span class="exam-timer" :class="{ 'warning': remainingTime < 300 }">
          ⏱️ {{ formatTime(remainingTime) }}
        </span>
      </div>
      
      <div class="exam-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: examProgress + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>第 {{ currentQuestion }} / {{ totalQuestions }} 题</span>
          <span>已完成 {{ examProgress }}%</span>
        </div>
      </div>

      <div class="exam-section-tabs">
        <div class="section-tab" :class="{ active: currentSection === s, completed: sectionProgress[s] }" v-for="s in ['reading', 'listening', 'speaking', 'writing']" :key="s">
          <span class="section-icon">{{ SECTION_CONFIG[s].icon }}</span>
          <span class="section-name">{{ SECTION_CONFIG[s].name }}</span>
        </div>
      </div>

      <div class="exam-question-area">
        <div class="question-header">
          <span class="question-number">Question {{ currentQuestion }}</span>
          <span class="question-type">{{ currentQuestionType }}</span>
        </div>
        <div class="question-content">
          <p>{{ currentQuestionText }}</p>
          <div class="options" v-if="showOptions">
            <label class="option" v-for="(opt, idx) in currentOptions" :key="idx">
              <input type="radio" v-model="selectedAnswer" :value="opt" />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>
        <div class="question-actions">
          <button class="nav-btn prev" @click="prevQuestion" :disabled="currentQuestion <= 1">← 上一题</button>
          <button class="nav-btn next" @click="nextQuestion" :disabled="!selectedAnswer">下一题 →</button>
          <button class="nav-btn submit" @click="submitExam" v-if="currentQuestion >= totalQuestions">提交考试</button>
        </div>
      </div>
    </div>

    <!-- 考试结果 -->
    <div class="exam-result" v-if="examResult">
      <div class="result-header">
        <span class="result-emoji">{{ examResult.level.emoji }}</span>
        <h2>考试完成！</h2>
        <span class="result-level">{{ examResult.level.level }}</span>
      </div>
      
      <div class="result-scores">
        <div class="score-card" v-for="(score, section) in examResult.scores" :key="section" v-if="section !== 'total'">
          <span class="score-icon">{{ SECTION_CONFIG[section]?.icon || '📊' }}</span>
          <span class="score-label">{{ SECTION_CONFIG[section]?.name || section }}</span>
          <span class="score-value">{{ score }}</span>
        </div>
      </div>
      
      <div class="result-total">
        <h3>总分: {{ examResult.scores.total }}/120</h3>
      </div>

      <div class="result-improvement" v-if="examResult.comparison.previousScore">
        <p>较上次考试: 
          <span :class="examResult.comparison.improvement > 0 ? 'positive' : 'negative'">
            {{ examResult.comparison.improvement > 0 ? '▲ +' + examResult.comparison.improvement : '▼ ' + examResult.comparison.improvement }} 分
          </span>
        </p>
      </div>

      <div class="result-recommendations">
        <h4>📋 提分建议</h4>
        <div class="recommendation-item" v-for="rec in examResult.recommendations" :key="rec.priority">
          <span class="rec-priority" :class="rec.priority">
            {{ rec.priority === 'high' ? '⚠️ 高优先级' : '📌 中优先级' }}
          </span>
          <span class="rec-suggestion">{{ rec.suggestion }}</span>
          <span class="rec-target">目标: {{ rec.target }}</span>
        </div>
      </div>

      <button class="result-close-btn" @click="closeResult">返回考试列表</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { mockExamAPI } from '@/api'

const SECTION_CONFIG = {
  reading: { name: '阅读', icon: '📖', duration: 3600000 },
  listening: { name: '听力', icon: '🎧', duration: 3600000 },
  speaking: { name: '口语', icon: '🗣️', duration: 1200000 },
  writing: { name: '写作', icon: '✍️', duration: 3000000 },
}

export default {
  name: 'MockExam',
  setup() {
    const exams = ref([])
    const sectionExams = ref([])
    const examHistory = ref([])
    const examStats = ref({ totalExams: 3, avgScore: 92, highestScore: 94, avgDuration: '170分钟' })
    const currentExam = ref(null)
    const examResult = ref(null)
    const currentQuestion = ref(1)
    const totalQuestions = ref(11)
    const currentSection = ref('reading')
    const currentQuestionType = ref('主旨题')
    const currentQuestionText = ref('Which of the following best expresses the main idea of the passage?')
    const currentOptions = ref([
      'A. The passage discusses the impact of climate change on biodiversity.',
      'B. Climate change has no significant effect on ecosystems.',
      'C. Biodiversity is unrelated to climate patterns.',
      'D. The passage focuses only on plant species.',
    ])
    const selectedAnswer = ref(null)
    const sectionProgress = ref({ reading: false, listening: false, speaking: false, writing: false })
    const remainingTime = ref(6600)
    const examProgress = ref(30)

    async function loadExams() {
      try {
        const res = await mockExamAPI.getAll()
        const data = res.data?.data
        if (data) {
          exams.value = data.exams.filter(e => e.sections.length === 4)
          sectionExams.value = data.exams.filter(e => e.sections.length < 4)
        }
      } catch (e) {
        console.error('加载模考列表失败:', e)
      }
    }

    async function loadHistory() {
      try {
        const res = await mockExamAPI.getHistory()
        const data = res.data?.data
        if (data) {
          examHistory.value = data.records.map(r => ({
            ...r,
            level: { level: '中高级', emoji: '🌳' },
          }))
        }
      } catch (e) {
        console.error('加载历史失败:', e)
        examHistory.value = [
          { id: 1, examName: '托福全真模考 #2', date: '2024-02-17T10:00:00Z', scores: { reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 }, level: { level: '高级', emoji: '🌟' } },
          { id: 2, examName: '托福全真模考 #1', date: '2024-02-10T10:00:00Z', scores: { reading: 24, listening: 23, speaking: 22, writing: 21, total: 90 }, level: { level: '中高级', emoji: '🌳' } },
        ]
      }
    }

    function startExam(exam) {
      currentExam.value = exam
      currentQuestion.value = 1
      remainingTime.value = exam.totalDuration / 1000
      examResult.value = null
    }

    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    function nextQuestion() {
      if (currentQuestion.value < totalQuestions.value) {
        currentQuestion.value++
        selectedAnswer.value = null
        examProgress.value = Math.round((currentQuestion.value / totalQuestions.value) * 100)
      }
    }

    function prevQuestion() {
      if (currentQuestion.value > 1) {
        currentQuestion.value--
        selectedAnswer.value = null
        examProgress.value = Math.round((currentQuestion.value / totalQuestions.value) * 100)
      }
    }

    function submitExam() {
      examResult.value = {
        scores: { reading: 25, listening: 24, speaking: 23, writing: 22, total: 94 },
        level: { level: '高级', emoji: '🌟' },
        recommendations: [
          { priority: 'high', suggestion: '加强阅读长难句分析', target: 28 },
          { priority: 'medium', suggestion: '提升听力笔记技巧', target: 25 },
        ],
        comparison: { previousScore: 90, improvement: 4 },
      }
    }

    function closeResult() {
      examResult.value = null
      currentExam.value = null
    }

    function selectExam(exam) {
      // 显示考试详情
    }

    onMounted(() => {
      loadExams()
      loadHistory()
    })

    return {
      SECTION_CONFIG,
      exams,
      sectionExams,
      examHistory,
      examStats,
      currentExam,
      examResult,
      currentQuestion,
      totalQuestions,
      currentSection,
      currentQuestionType,
      currentQuestionText,
      currentOptions,
      selectedAnswer,
      sectionProgress,
      remainingTime,
      examProgress,
      startExam,
      formatDate,
      formatTime,
      nextQuestion,
      prevQuestion,
      submitExam,
      closeResult,
      selectExam,
    }
  },
}
</script>

<style scoped>
.mock-exam-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.section-desc {
  color: #666;
  margin-bottom: 20px;
}

/* 模考卡片 */
.exam-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.exam-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  position: relative;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.exam-card.full-exam {
  border-color: #FFD700;
}

.exam-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f0f0f0;
}

.exam-badge.full {
  background: #FFF9E6;
  color: #B8860B;
}

.exam-badge.section {
  background: #E8F5E9;
  color: #2E7D32;
}

.exam-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  padding-right: 80px;
}

.exam-card p {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.exam-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.start-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.start-btn:hover {
  opacity: 0.9;
}

/* 统计 */
.exam-stats-section {
  margin-bottom: 32px;
}

.exam-stats-section h2 {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 成绩历史 */
.exam-history-section {
  margin-bottom: 32px;
}

.exam-history-section h2 {
  margin-bottom: 16px;
}

.history-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 60px 60px 60px 60px 60px 80px;
  padding: 12px 16px;
  background: #f5f5f5;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 60px 60px 60px 60px 60px 80px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  font-size: 14px;
}

.table-row:hover {
  background: #fafafa;
}

.col-total {
  font-weight: 700;
  color: #667eea;
}

/* 考试进行中 */
.exam-in-progress {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.exam-timer {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.exam-timer.warning {
  color: #dc2626;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.exam-progress {
  margin-bottom: 20px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.exam-section-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.section-tab {
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0.5;
}

.section-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  opacity: 1;
}

.section-tab.completed {
  opacity: 0.7;
}

.section-icon {
  font-size: 16px;
}

.section-name {
  font-size: 12px;
  display: block;
  margin-top: 4px;
}

.exam-question-area {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 13px;
  color: #999;
}

.question-content p {
  font-size: 16px;
  line-height: 1.8;
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
  padding: 12px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.option:hover {
  background: #f0f7ff;
}

.option input {
  cursor: pointer;
}

.question-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.nav-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.nav-btn.submit {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

/* 考试结果 */
.exam-result {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.result-header {
  margin-bottom: 24px;
}

.result-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 8px;
}

.result-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.result-level {
  font-size: 18px;
  color: #667eea;
  font-weight: 600;
}

.result-scores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.score-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}

.score-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.score-label {
  font-size: 12px;
  color: #666;
  display: block;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  display: block;
}

.result-total {
  margin-bottom: 24px;
}

.result-total h3 {
  font-size: 36px;
  color: #333;
}

.result-improvement {
  margin-bottom: 24px;
}

.result-improvement p {
  font-size: 16px;
}

.positive {
  color: #059669;
  font-weight: 700;
}

.negative {
  color: #dc2626;
  font-weight: 700;
}

.result-recommendations {
  text-align: left;
  margin-bottom: 24px;
}

.result-recommendations h4 {
  margin-bottom: 12px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.rec-priority {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.rec-priority.high {
  background: #fee2e2;
  color: #dc2626;
}

.rec-priority.medium {
  background: #fef3c7;
  color: #d97706;
}

.rec-suggestion {
  flex: 1;
  font-size: 14px;
}

.rec-target {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.result-close-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid, .result-scores {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header, .table-row {
    grid-template-columns: 60px 1fr 50px 50px 50px 50px 50px 60px;
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .stats-grid, .result-scores {
    grid-template-columns: 1fr;
  }
}
</style>
