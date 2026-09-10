<template>
  <div class="page-container grammar-page">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📝 语法纠错助手</h2>
      <div class="header-spacer" />
    </div>

    <div class="grammar-content">
      <!-- 文本输入 -->
      <div class="input-section">
        <div class="editor-header">
          <h3>输入或粘贴文本</h3>
          <div class="editor-stats">
            <span>{{ wordCount }} 词</span>
            <span>{{ charCount }} 字符</span>
          </div>
        </div>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="10"
          placeholder="在此输入或粘贴你的英语文本，AI 将实时检查语法错误..."
          :maxlength="2000"
          show-word-limit
        />
        <div class="editor-actions">
          <el-button type="primary" size="large" @click="checkGrammar" :loading="checking">
            <el-icon><MagicStick /></el-icon> 开始检查
          </el-button>
          <el-button @click="clearText">清空</el-button>
        </div>
      </div>

      <!-- 检查结果 -->
      <div class="result-section" v-if="result">
        <!-- 评分概览 -->
        <div class="score-overview">
          <div class="score-card" :class="getScoreClass(result.checks.score)">
            <div class="score-circle">
              <span class="score-value">{{ result.checks.score }}</span>
              <span class="score-max">/ 100</span>
            </div>
            <div class="score-label" :class="getScoreClass(result.checks.score)">
              {{ result.checks.scoreLabel }}
            </div>
          </div>

          <div class="error-summary">
            <div class="error-item" v-for="item in errorSummary" :key="item.type">
              <span class="error-count" :style="{ color: item.color }">{{ item.count }}</span>
              <span class="error-type">{{ item.name }}</span>
            </div>
          </div>
        </div>

        <!-- 错误列表 -->
        <div class="errors-list" v-if="result.checks.errors.length > 0">
          <h3>❌ 发现的错误</h3>
          <div class="error-card" v-for="(error, idx) in result.checks.errors" :key="idx">
            <div class="error-badge" :class="error.severity">
              {{ getErrorSeverityLabel(error.severity) }}
            </div>
            <div class="error-type-label">{{ error.type }}</div>
            <div class="error-message">{{ error.message }}</div>
          </div>
        </div>

        <!-- 建议列表 -->
        <div class="suggestions-list" v-if="result.checks.suggestions.length > 0">
          <h3>💡 改进建议</h3>
          <div class="suggestion-card" v-for="(suggestion, idx) in result.checks.suggestions" :key="idx">
            <el-icon color="#f59e0b"><WarningFilled /></el-icon>
            <span class="suggestion-text">{{ suggestion.message }}</span>
          </div>
        </div>

        <!-- 正确文本无错误 -->
        <div class="correct-message" v-if="result.checks.errors.length === 0 && result.checks.suggestions.length === 0">
          <el-icon color="#10b981" :size="48"><CircleCheck /></el-icon>
          <p>🎉 太棒了！文本没有发现语法错误。</p>
          <p class="correct-sub">继续保持！</p>
        </div>

        <!-- 高亮文本 -->
        <div class="highlighted-text" v-if="result.checks.errors.length > 0">
          <h3>📖 标注后的文本</h3>
          <div class="highlighted-content">
            <span
              v-for="(segment, idx) in highlightedText"
              :key="idx"
              :class="segment.class"
            >{{ segment.text }}</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-if="checking">
        <el-skeleton :rows="8" animated />
        <p>AI 正在分析语法...</p>
      </div>

      <!-- 使用历史 -->
      <div class="usage-history" v-if="history.length > 0">
        <h3>📜 检查历史</h3>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item">
            <span class="h-text">{{ item.text.substring(0, 50) }}...</span>
            <span class="h-errors">错误：{{ item.error_count }}</span>
            <span class="h-time">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, WarningFilled, CircleCheck } from '@element-plus/icons-vue'
import { grammarCoachAPI } from '@/api'

const inputText = ref('')
const checking = ref(false)
const result = ref(null)
const history = ref([])

const wordCount = computed(() => inputText.value.split(/\s+/).filter(w => w).length)
const charCount = computed(() => inputText.value.length)

const errorSummary = computed(() => {
  if (!result.value) return []
  const types = {}
  result.value.checks.errors.forEach(e => {
    types[e.type] = (types[e.type] || 0) + 1
  })
  return Object.entries(types).map(([type, count]) => ({
    type,
    name: getErrorTypeName(type),
    count,
    color: count > 2 ? '#ef4444' : count > 0 ? '#f59e0b' : '#10b981',
  }))
})

const highlightedText = computed(() => {
  if (!result.value || !result.value.checks.errors.length) return [{ text: inputText.value, class: '' }]
  
  const text = inputText.value
  const errors = result.value.checks.errors.sort((a, b) => (a.offset || 0) - (b.offset || 0))
  const segments = []
  let lastIdx = 0

  errors.forEach(err => {
    const offset = err.offset || 0
    if (offset > lastIdx) {
      segments.push({ text: text.substring(lastIdx, offset), class: '' })
    }
    segments.push({
      text: text.substring(offset, offset + (err.length || 10)),
      class: err.severity === 'error' ? 'text-error' : 'text-warning',
    })
    lastIdx = offset + (err.length || 10)
  })

  if (lastIdx < text.length) {
    segments.push({ text: text.substring(lastIdx), class: '' })
  }

  return segments
})

onMounted(() => {
  loadHistory()
})

const loadHistory = async () => {
  try {
    const res = await grammarCoachAPI.getHistory()
    history.value = res.data?.data || []
  } catch {
    // Use mock data
    history.value = [
      { id: 1, text: 'The quick brown fox jumps over the lazy dog.', error_count: 0, created_at: new Date().toISOString() },
      { id: 2, text: 'He go to the store yesterday.', error_count: 1, created_at: new Date(Date.now() - 3600000).toISOString() },
    ]
  }
}

const checkGrammar = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入文本')
    return
  }

  checking.value = true
  try {
    const res = await grammarCoachAPI.check({ text: inputText.value })
    result.value = res.data?.data || generateMockResult()
  } catch (e) {
    // Use mock result
    result.value = generateMockResult()
  } finally {
    checking.value = false
  }
}

const generateMockResult = () => {
  const text = inputText.value
  const errors = []
  const suggestions = []

  // 模拟错误检测
  if (/\b(a)\s+(apple|elephant|umbrella|idea)/gi.test(text)) {
    errors.push({
      type: 'article',
      message: '"a" 应改为 "an"，元音开头的单词前使用 "an"',
      offset: text.indexOf(text.match(/a\s+(apple|elephant|umbrella|idea)/gi)?.[0] || ''),
      severity: 'error',
    })
  }

  if (text.split(/\s+/).filter(w => w).length > 30 && !/[.!?]\s+/.test(text)) {
    suggestions.push({
      type: 'style',
      message: '句子较长，建议适当添加标点以分隔',
      severity: 'warning',
    })
  }

  let score = Math.max(0, 100 - errors.length * 15 - suggestions.length * 5)

  return {
    text,
    wordCount: text.split(/\s+/).filter(w => w).length,
    charCount: text.length,
    checks: {
      errors,
      suggestions,
      score,
      scoreLabel: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Improvement',
    },
  }
}

const clearText = () => {
  inputText.value = ''
  result.value = null
}

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  if (score >= 60) return 'score-fair'
  return 'score-poor'
}

const getErrorTypeName = (type) => {
  const map = {
    article: '冠词',
    subjectVerb: '主谓一致',
    punctuation: '标点',
    style: '文体',
    vocabulary: '词汇',
    formality: '正式程度',
  }
  return map[type] || type
}

const getErrorSeverityLabel = (severity) => {
  const map = { error: '错误', warning: '警告', suggestion: '建议' }
  return map[severity] || severity
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.grammar-page {
  max-width: 900px;
  margin: 0 auto;
}

.input-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-header h3 {
  margin: 0;
}

.editor-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.editor-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.result-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.score-overview {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;
}

.score-card {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: #f8f9fa;
  min-width: 160px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 6px solid #4a6cf7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.score-max {
  font-size: 12px;
  color: #909399;
}

.score-label {
  margin-top: 8px;
  font-weight: 600;
}

.error-summary {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.error-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.error-count {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.error-type {
  font-size: 12px;
  color: #666;
}

.errors-list,
.suggestions-list {
  margin: 24px 0;
}

.errors-list h3,
.suggestions-list h3 {
  margin-bottom: 16px;
  color: #333;
}

.error-card,
.suggestion-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.suggestion-card {
  background: #fffbeb;
  border-color: #fde68a;
}

.error-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.error-badge.error {
  background: #fee2e2;
  color: #ef4444;
}

.error-badge.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.error-type-label {
  font-size: 12px;
  color: #999;
}

.error-message {
  font-size: 14px;
  color: #333;
}

.correct-message {
  text-align: center;
  padding: 40px;
}

.correct-sub {
  color: #909399;
  margin-top: 8px;
}

.highlighted-text {
  margin-top: 24px;
}

.highlighted-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.8;
}

.text-error {
  background: #fecaca;
  padding: 2px 4px;
  border-radius: 3px;
}

.text-warning {
  background: #fef3c7;
  padding: 2px 4px;
  border-radius: 3px;
}

.loading-section {
  text-align: center;
  padding: 40px;
}

.loading-section p {
  margin-top: 16px;
  color: #909399;
}

.usage-history {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.usage-history h3 {
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.h-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h-errors {
  color: #ef4444;
  font-weight: 500;
}

.h-time {
  color: #909399;
  font-size: 12px;
}
</style>
