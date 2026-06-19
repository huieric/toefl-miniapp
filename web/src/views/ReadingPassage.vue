<template>
  <div class="page-container">
    <!-- 顶部导航栏 -->
    <div class="passage-header">
      <div class="header-left">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>返回列表
        </el-button>
        <h2 class="header-title">{{ cleanTitle(passageTitle) }}</h2>
      </div>
      <div class="header-right">
        <span class="progress-text">Q {{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>
    </div>

    <div v-loading="loading" element-loading-text="加载篇章中...">
      <div v-if="!loading && questions.length" class="passage-layout">
        <!-- 左侧：阅读文章 -->
        <aside class="passage-text-panel" :class="{ collapsed: passageCollapsed }">
          <div class="panel-header" @click="passageCollapsed = !passageCollapsed">
            <span class="panel-label">📄 阅读文章</span>
            <el-icon class="collapse-icon" :class="{ rotated: passageCollapsed }">
              <ArrowDown />
            </el-icon>
          </div>
          <div v-show="!passageCollapsed" class="panel-body">
            <div class="passage-content">{{ passageText }}</div>
          </div>
        </aside>

        <!-- 右侧：答题区域 -->
        <main class="question-panel">
          <!-- 进度条 -->
          <div class="progress-bar-wrap">
            <div class="progress-dots">
              <span
                v-for="(q, i) in questions"
                :key="q.id"
                class="dot"
                :class="{
                  current: i === currentIndex,
                  answered: answers[i] !== undefined,
                  correct: answers[i] !== undefined && showResult && answers[i].isCorrect,
                  wrong: answers[i] !== undefined && showResult && !answers[i].isCorrect,
                }"
                @click="goToQuestion(i)"
              >{{ i + 1 }}</span>
            </div>
          </div>

          <!-- 当前题目 -->
          <div class="question-card" :key="'q-' + currentIndex">
            <div class="q-type-badge">
              <el-tag size="small" effect="plain">{{ typeLabel(currentQuestion.type) }}</el-tag>
            </div>
            <div class="q-content">{{ currentQuestion.content }}</div>

            <!-- 选项 -->
            <div class="q-options">
              <div
                v-for="opt in parsedOptions"
                :key="opt.label"
                class="option-item"
                :class="{
                  selected: selectedAnswer === opt.label,
                  'is-correct': showResult && opt.label === correctAnswer,
                  'is-wrong': showResult && selectedAnswer === opt.label && selectedAnswer !== correctAnswer,
                  disabled: showResult,
                }"
                @click="!showResult && selectAnswer(opt.label)"
              >
                <span class="option-label">{{ opt.label }}</span>
                <span class="option-text">{{ opt.text }}</span>
                <el-icon v-if="showResult && opt.label === correctAnswer" class="option-icon correct-icon"><CircleCheckFilled /></el-icon>
                <el-icon v-if="showResult && selectedAnswer === opt.label && selectedAnswer !== correctAnswer" class="option-icon wrong-icon"><CircleCloseFilled /></el-icon>
              </div>
            </div>

            <!-- 答题结果反馈 -->
            <transition name="fade">
              <div v-if="showResult" class="result-feedback" :class="{ correct: isCurrentCorrect, wrong: !isCurrentCorrect }">
                <p class="feedback-verdict">
                  {{ isCurrentCorrect ? '✅ 回答正确！' : '❌ 回答错误' }}
                </p>
                <p v-if="currentQuestion.analysis" class="feedback-analysis">
                  解析：{{ currentQuestion.analysis }}
                </p>
              </div>
            </transition>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-bar">
            <el-button
              :disabled="currentIndex === 0"
              @click="prevQuestion"
            >上一题</el-button>

            <el-button
              v-if="!showResult"
              type="primary"
              :disabled="!selectedAnswer"
              @click="submitAnswer"
            >提交答案</el-button>

            <el-button
              v-if="showResult && currentIndex < questions.length - 1"
              type="primary"
              @click="nextQuestion"
            >下一题 →</el-button>

            <el-button
              v-if="showResult && currentIndex === questions.length - 1"
              type="success"
              @click="goResult"
            >
              查看结果
              <el-icon><Check /></el-icon>
            </el-button>
          </div>
        </main>
      </div>

      <el-empty v-if="!loading && !questions.length" description="该篇章没有题目" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowDown, ArrowRight, CircleCheckFilled, CircleCloseFilled, Check } from '@element-plus/icons-vue'
import { questionAPI, practiceAPI } from '@/api'

const route = useRoute()
const router = useRouter()

const passageId = computed(() => route.params.passageId)
const passageTitle = ref('')
const passageText = ref('')
const passageSource = ref('')
const questions = ref([])
const loading = ref(true)
const passageCollapsed = ref(false)

const currentIndex = ref(0)
const selectedAnswer = ref(null)
const showResult = ref(false)
const answers = ref([])  // [{ isCorrect: bool }] per question

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

const parsedOptions = computed(() => {
  const opts = currentQuestion.value.options
  if (Array.isArray(opts)) return opts
  if (typeof opts === 'string') {
    try { return JSON.parse(opts) } catch (_) { return [] }
  }
  return []
})

const correctAnswer = computed(() => currentQuestion.value.answer || '')
const isCurrentCorrect = computed(() => {
  const a = answers.value[currentIndex.value]
  return a ? a.isCorrect : false
})

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const cleanTitle = (t) => (t || '未命名篇章').replace(/\s*\(Q\d+\)\s*$/g, '')

const selectAnswer = (label) => {
  if (showResult.value) return
  selectedAnswer.value = label
}

const submitAnswer = async () => {
  if (!selectedAnswer.value) return
  const q = currentQuestion.value
  const isCorrect = selectedAnswer.value === correctAnswer.value

  // 记录答案
  answers.value[currentIndex.value] = {
    selected: selectedAnswer.value,
    isCorrect,
  }
  showResult.value = true

  // 异步提交到后端
  try {
    await practiceAPI.submit({
      questionId: q.id,
      subject: 'reading',
      userAnswer: selectedAnswer.value,
      isCorrect,
    })
  } catch (e) {
    console.error('提交答题记录失败:', e)
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    loadQuestionState()
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    loadQuestionState()
  }
}

const goToQuestion = (index) => {
  currentIndex.value = index
  loadQuestionState()
}

const loadQuestionState = () => {
  const saved = answers.value[currentIndex.value]
  selectedAnswer.value = saved ? saved.selected : null
  showResult.value = saved !== undefined
}

const goResult = () => {
  // 将答题结果存入 localStorage，供结果页读取
  const summary = questions.value.map((q, i) => {
    const a = answers.value[i]
    return {
      id: q.id,
      type: q.type,
      content: q.content,
      answer: q.answer,
      analysis: q.analysis,
      selected: a ? a.selected : null,
      isCorrect: a ? a.isCorrect : false,
    }
  })
  try {
    localStorage.setItem(`passage_result_${passageId.value}`, JSON.stringify(summary))
  } catch (_) {}
  router.push(`/reading/passage/${passageId.value}/result`)
}

const goBack = () => {
  router.push('/reading')
}

const loadPassageData = async () => {
  loading.value = true
  try {
    const res = await questionAPI.getPassage(passageId.value)
    const data = res.data?.data
    if (!data || !data.questions?.length) {
      ElMessage.error('篇章数据为空')
      return
    }
    passageTitle.value = data.title
    passageText.value = data.passageText
    passageSource.value = data.source
    questions.value = data.questions
    // 初始化答案数组
    answers.value = new Array(data.questions.length).fill(undefined)
    loadQuestionState()
  } catch (e) {
    console.error('加载篇章失败:', e)
    ElMessage.error('加载篇章失败，请返回重试')
  } finally {
    loading.value = false
  }
}

onMounted(loadPassageData)
</script>

<style scoped>
.passage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.progress-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.passage-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .passage-layout {
    grid-template-columns: 1fr;
  }
}

/* 文章面板 */
.passage-text-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}
.passage-text-panel.collapsed .panel-body {
  display: none;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  user-select: none;
}
.panel-header:hover {
  background: var(--el-fill-color);
}
.panel-label {
  font-weight: 600;
  font-size: 14px;
}
.collapse-icon {
  transition: transform 0.2s;
}
.collapse-icon.rotated {
  transform: rotate(180deg);
}
.panel-body {
  padding: 14px;
}
.passage-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-regular);
  white-space: pre-wrap;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

/* 进度点 */
.progress-bar-wrap {
  margin-bottom: 16px;
}
.progress-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: var(--el-fill-color-light);
  color: var(--text-secondary);
  border: 2px solid transparent;
  transition: all 0.2s;
}
.dot:hover {
  border-color: var(--el-color-primary-light-5);
}
.dot.current {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dot.answered {
  background: var(--el-fill-color);
}
.dot.correct {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border-color: var(--el-color-success);
}
.dot.wrong {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

/* 题目卡片 */
.question-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
}
.q-type-badge {
  margin-bottom: 12px;
}
.q-content {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 20px;
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* 选项 */
.q-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.option-item:hover:not(.disabled) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.option-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.option-item.is-correct {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.option-item.is-wrong {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.option-item.disabled {
  cursor: default;
}
.option-label {
  font-weight: 700;
  font-size: 15px;
  min-width: 24px;
  color: var(--el-color-primary);
}
.option-item.is-correct .option-label {
  color: var(--el-color-success);
}
.option-item.is-wrong .option-label {
  color: var(--el-color-danger);
}
.option-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}
.option-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.correct-icon { color: var(--el-color-success); }
.wrong-icon { color: var(--el-color-danger); }

/* 反馈 */
.result-feedback {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
}
.result-feedback.correct {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
}
.result-feedback.wrong {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
}
.feedback-verdict {
  margin: 0 0 8px;
  font-weight: 600;
  font-size: 15px;
}
.feedback-analysis {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 0;
}
</style>
