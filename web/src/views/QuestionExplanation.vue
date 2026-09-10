<template>
  <div class="page-container explanation-page">
    <div class="page-header">
      <el-button text @click="$router.push('/reading')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📖 AI 题目解析</h2>
      <div class="header-spacer" />
    </div>

    <div class="explanation-content">
      <!-- 题目信息 -->
      <div class="question-card" v-if="question">
        <div class="question-header">
          <el-tag :type="getDifficultyTag(question.difficulty)">{{ getDifficultyLabel(question.difficulty) }}</el-tag>
          <el-tag type="info">{{ subjectMap[question.subject] }}</el-tag>
        </div>
        <div class="question-text" v-html="question.text"></div>
        <div class="options" v-if="question.options">
          <div 
            v-for="(opt, idx) in question.options" 
            :key="idx"
            class="option"
            :class="{
              selected: selectedAnswer === String.fromCharCode(65 + idx),
              correct: question.correct === String.fromCharCode(65 + idx),
              wrong: selectedAnswer === String.fromCharCode(65 + idx) && question.correct !== String.fromCharCode(65 + idx),
            }"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
            <span class="option-text">{{ opt }}</span>
          </div>
        </div>
      </div>

      <!-- AI 解析按钮 -->
      <div class="ai-explain-section" v-if="!loading && !explanation">
        <el-button type="primary" size="large" @click="generateExplanation" :loading="generating">
          <el-icon><MagicStick /></el-icon> AI 生成详细解析
        </el-button>
        <p class="hint">AI 将分析正确答案、错误原因，并提供考点解析</p>
      </div>

      <!-- 解析内容 -->
      <div class="explanation-result" v-if="explanation && !loading">
        <div class="explanation-header">
          <el-icon color="#10b981" :size="24"><CircleCheck /></el-icon>
          <span>AI 解析完成</span>
        </div>
        <div class="explanation-body">
          <pre class="explanation-text">{{ explanation }}</pre>
        </div>
        <div class="explanation-actions">
          <el-button size="small" @click="copyExplanation">
            <el-icon><CopyDocument /></el-icon> 复制解析
          </el-button>
          <el-button size="small" type="success" @click="$router.push('/wrong-book')">
            <el-icon><EditPen /></el-icon> 查看错题本
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-section" v-if="loading">
        <el-skeleton :rows="8" animated />
        <p>AI 正在分析题目，请稍候...</p>
      </div>

      <!-- 历史记录 -->
      <div class="history-section" v-if="history.length > 0">
        <h3>📋 最近解析记录</h3>
        <div class="history-list">
          <div 
            v-for="item in history" 
            :key="item.id"
            class="history-item"
            @click="loadHistoryExplanation(item)"
          >
            <span class="history-subject">{{ item.subject }}</span>
            <span class="history-date">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, CircleCheck, CopyDocument, EditPen } from '@element-plus/icons-vue'
import { questionExplanationAPI, questionAPI } from '@/api'

const route = useRoute()

const question = ref(null)
const selectedAnswer = ref('')
const explanation = ref('')
const loading = ref(false)
const generating = ref(false)
const history = ref([])

const subjectMap = {
  reading: '阅读',
  listening: '听力',
  speaking: '口语',
  writing: '写作',
}

onMounted(async () => {
  // 获取题目详情
  const qId = route.params.id
  if (qId) {
    try {
      const res = await questionAPI.getById(qId)
      question.value = res.data?.data || res.data || null
    } catch (e) {
      console.error('加载题目失败:', e)
    }
  }
  
  // 获取历史记录
  try {
    const res = await questionExplanationAPI.getHistory()
    history.value = res.data?.data?.explanations || []
  } catch (e) {
    // ignore
  }
})

const getDifficultyTag = (difficulty) => {
  const map = { easy: '', medium: 'warning', hard: 'danger' }
  return map[difficulty] || ''
}

const getDifficultyLabel = (difficulty) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[difficulty] || difficulty
}

const generateExplanation = async () => {
  if (!question.value?.id) return
  
  generating.value = true
  loading.value = true
  try {
    const res = await questionExplanationAPI.generate({
      questionId: question.value.id,
      userAnswer: selectedAnswer.value || null,
      correctAnswer: question.value.correct || question.value.correct_answer,
      subject: question.value.subject,
    })
    explanation.value = res.data?.data?.explanation || '解析生成失败，请重试。'
    ElMessage.success('AI 解析生成成功')
    
    // 重新加载历史记录
    try {
      const hRes = await questionExplanationAPI.getHistory()
      history.value = hRes.data?.data?.explanations || []
    } catch {}
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '解析生成失败')
  } finally {
    loading.value = false
    generating.value = false
  }
}

const copyExplanation = () => {
  if (!explanation.value) return
  navigator.clipboard.writeText(explanation.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const loadHistoryExplanation = (item) => {
  selectedAnswer.value = item.user_answer
  ElMessage.info('历史解析已加载')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
.explanation-page {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
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
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.option.selected {
  border-color: #4a6cf7;
  background: #eef2ff;
}

.option.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.option.wrong {
  border-color: #ef4444;
  background: #fef2f2;
}

.option-letter {
  font-weight: 700;
  color: #4a6cf7;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef2ff;
}

.option.correct .option-letter {
  background: #10b981;
  color: #fff;
}

.option.wrong .option-letter {
  background: #ef4444;
  color: #fff;
}

.ai-explain-section {
  text-align: center;
  padding: 40px 20px;
}

.hint {
  color: #909399;
  margin-top: 12px;
  font-size: 14px;
}

.explanation-result {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 16px;
}

.explanation-text {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #333;
  font-size: 15px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.explanation-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.loading-section {
  text-align: center;
  padding: 40px;
}

.loading-section p {
  margin-top: 16px;
  color: #909399;
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.history-section h3 {
  margin-bottom: 12px;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f7ff;
}

.history-subject {
  font-weight: 500;
}

.history-date {
  color: #909399;
  font-size: 13px;
}
</style>
