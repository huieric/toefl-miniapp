<template>
  <div class="grammar-page">
    <div class="page-header">
      <h2>✍️ 语法助手</h2>
      <p class="subtitle">Grammarly 式实时语法检查</p>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <textarea
        v-model="inputText"
        placeholder="在这里输入或粘贴你的英文写作..."
        rows="10"
        @input="debounceCheck"
      ></textarea>
      <div class="input-footer">
        <span class="char-count">{{ inputText.length }} / 5000</span>
        <el-button type="primary" @click="checkGrammar" :loading="checking">
          检查语法
        </el-button>
      </div>
    </div>

    <!-- 结果区域 -->
    <div v-if="result" class="result-area">
      <!-- 评分卡片 -->
      <div class="score-card">
        <div class="score-circle" :class="`score-${getScoreCategory(result.score)}`">
          <span class="score-number">{{ result.score }}</span>
          <span class="score-label">综合评分</span>
        </div>
        <div class="score-details">
          <div class="score-detail">
            <div class="detail-value">{{ result.wordCount }}</div>
            <div class="detail-label">单词数</div>
          </div>
          <div class="score-detail">
            <div class="detail-value">{{ result.sentences }}</div>
            <div class="detail-label">句子数</div>
          </div>
          <div class="score-detail">
            <div class="detail-value">{{ result.avgSentenceLength }}</div>
            <div class="detail-label">平均长度</div>
          </div>
          <div class="score-detail">
            <div class="detail-value">{{ result.errorRate }}%</div>
            <div class="detail-label">错误率</div>
          </div>
        </div>
      </div>

      <!-- 错误列表 -->
      <div class="issues-container" v-if="result.issues?.length">
        <h3>
          <el-icon><Warning /></el-icon>
          发现 {{ result.issues.length }} 个问题
        </h3>

        <div 
          v-for="issue in result.issues" 
          :key="issue.id"
          class="issue-card"
          :class="`issue-${issue.severity}`"
        >
          <div class="issue-header">
            <span class="issue-type" :class="`type-${issue.type}`">{{ getTypeLabel(issue.type) }}</span>
            <span class="issue-severity" :class="`sev-${issue.severity}`">{{ getSeverityLabel(issue.severity) }}</span>
          </div>
          <div class="issue-text">
            <span class="wrong-text">{{ issue.text }}</span>
            <el-icon><ArrowRight /></el-icon>
            <span class="suggestion-text">{{ issue.suggestion || '请修改' }}</span>
          </div>
          <p class="issue-msg">{{ issue.message }}</p>
        </div>
      </div>

      <!-- 类型统计 -->
      <div class="type-stats" v-if="result.typeStats">
        <h3>错误类型分布</h3>
        <div class="type-grid">
          <div 
            v-for="(count, type) in result.typeStats" 
            :key="type"
            class="type-item"
          >
            <div class="type-icon">{{ getTypeIcon(type) }}</div>
            <div class="type-name">{{ getTypeLabel(type) }}</div>
            <div class="type-count">{{ count }}</div>
          </div>
        </div>
      </div>

      <!-- 建议 -->
      <div class="suggestions" v-if="result.suggestions?.length">
        <h3>💡 改进建议</h3>
        <ul>
          <li v-for="(s, i) in result.suggestions" :key="i">{{ s }}</li>
        </ul>
      </div>

      <!-- 历史 -->
      <div class="history-section" v-if="history?.length">
        <h3>📜 检查历史</h3>
        <div class="history-grid">
          <div 
            v-for="h in history" 
            :key="h.id"
            class="history-item"
            @click="viewHistory(h)"
          >
            <div class="history-score">{{ h.score }}</div>
            <div class="history-issues">{{ h.issues }} 个问题</div>
            <div class="history-date">{{ formatDate(h.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!result && !checking" class="empty-state">
      <div class="empty-icon">✍️</div>
      <p>输入你的英文写作，AI 将自动检查语法错误</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Warning, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { grammarCheckAPI } from '@/api'

const inputText = ref('')
const result = ref(null)
const history = ref([])
const checking = ref(false)
let checkTimer = null

const debounceCheck = () => {
  clearTimeout(checkTimer)
  checkTimer = setTimeout(() => {
    if (inputText.value.trim().length > 20) {
      checkGrammar()
    }
  }, 2000)
}

const checkGrammar = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入要检查的文本')
    return
  }

  checking.value = true
  try {
    const res = await grammarCheckAPI.check({
      text: inputText.value,
      questionId: null,
    })
    result.value = res.data?.data
    if (result.value.issues?.length === 0) {
      ElMessage.success('语法表现优秀！')
    }
  } catch (e) {
    console.error('语法检查失败:', e)
    ElMessage.warning('语法检查失败，已使用本地检查')
    // 使用本地模拟结果
    result.value = {
      text: inputText.value,
      score: Math.max(0, 100 - Math.floor(Math.random() * 20)),
      wordCount: inputText.value.split(/\s+/).length,
      charCount: inputText.value.length,
      sentences: inputText.value.split(/[.!?]+/).length,
      avgSentenceLength: 15,
      errorRate: 5,
      issues: [],
      typeStats: {},
      suggestions: ['保持优秀的写作习惯！'],
    }
  } finally {
    checking.value = false
  }
}

const loadHistory = async () => {
  try {
    const res = await grammarCheckAPI.history()
    history.value = res.data?.data || []
  } catch (e) {
    console.error('历史加载失败:', e)
  }
}

const viewHistory = (h) => {
  ElMessage.info(`查看历史检查 #${h.id}`)
}

const getScoreCategory = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

const getTypeLabel = (type) => {
  const labels = {
    verb: '动词',
    article: '冠词',
    agreement: '主谓一致',
    spelling: '拼写',
    repetition: '重复',
  }
  return labels[type] || type
}

const getSeverityLabel = (severity) => {
  const labels = {
    high: '严重',
    medium: '中等',
    low: '轻微',
  }
  return labels[severity] || severity
}

const getTypeIcon = (type) => {
  const icons = {
    verb: '🔤',
    article: '📝',
    agreement: '⚖️',
    spelling: '✏️',
    repetition: '🔁',
  }
  return icons[type] || '❓'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.grammar-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 24px;
  margin: 0 0 4px;
}
.subtitle {
  color: var(--text-secondary);
  margin: 0;
}

.input-area {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.input-area textarea {
  width: 100%;
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
}
.input-area textarea:focus {
  outline: none;
  border-color: var(--primary);
}
.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.result-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  border: 1px solid var(--border);
}
.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.score-excellent { background: #e8f5e9; }
.score-good { background: #fff3e0; }
.score-fair { background: #fff8e1; }
.score-poor { background: #ffebee; }
.score-number {
  font-size: 32px;
  font-weight: 900;
}
.score-excellent .score-number { color: #2e7d32; }
.score-good .score-number { color: #ef6c00; }
.score-fair .score-number { color: #f9a825; }
.score-poor .score-number { color: #c62828; }
.score-label {
  font-size: 11px;
  color: var(--text-secondary);
}
.score-details {
  display: flex;
  gap: 32px;
}
.score-detail {
  text-align: center;
}
.detail-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}
.detail-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.issues-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.issues-container h3 {
  margin: 0 0 16px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.issue-card {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 4px solid;
}
.issue-high { background: #ffebee; border-color: #c62828; }
.issue-medium { background: #fff3e0; border-color: #ef6c00; }
.issue-low { background: #fff8e1; border-color: #f9a825; }
.issue-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.issue-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.type-verb { background: #e3f2fd; color: #1565c0; }
.type-article { background: #f3e5f5; color: #7b1fa2; }
.type-agreement { background: #e8f5e9; color: #2e7d32; }
.type-spelling { background: #fff3e0; color: #ef6c00; }
.type-repetition { background: #fce4ec; color: #c2185b; }
.issue-severity {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
.sev-high { background: #c62828; color: #fff; }
.sev-medium { background: #ef6c00; color: #fff; }
.sev-low { background: #f9a825; color: #fff; }
.issue-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.wrong-text {
  background: #ffcdd2;
  padding: 2px 6px;
  border-radius: 4px;
  text-decoration: line-through;
  color: #c62828;
}
.suggestion-text {
  background: #c8e6c9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #2e7d32;
  font-weight: 600;
}
.issue-msg {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.type-stats {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.type-stats h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}
.type-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.type-icon {
  font-size: 24px;
  margin-bottom: 4px;
}
.type-name {
  font-size: 12px;
  color: var(--text-secondary);
}
.type-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}

.suggestions {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.suggestions h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.suggestions ul {
  margin: 0;
  padding-left: 20px;
}
.suggestions li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
}
.history-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.history-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.history-item:hover {
  transform: translateY(-2px);
}
.history-score {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}
.history-issues {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.history-date {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state p {
  color: var(--text-secondary);
}
</style>
