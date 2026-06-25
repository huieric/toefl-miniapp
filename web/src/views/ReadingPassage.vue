<template>
  <div class="exam-page">
    <!-- 顶部考试栏 -->
    <div class="exam-topbar">
      <div class="topbar-left">
        <el-button text class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </el-button>
        <div class="topbar-divider"></div>
        <span class="topbar-title">{{ cleanTitle(passageTitle) }}</span>
      </div>
      <div class="topbar-right">
        <div class="progress-pill">
          <span class="pill-num">{{ answeredCount }}</span>
          <span class="pill-sep">/</span>
          <span class="pill-total">{{ questions.length }}</span>
          <span class="pill-label">已答</span>
        </div>
      </div>
    </div>

    <div v-loading="loading" element-loading-text="加载篇章中..." class="exam-content">
      <div v-if="!loading && questions.length" class="exam-layout">
        <!-- 左侧：阅读文章（考试风格） -->
        <aside class="reading-panel" :class="{ collapsed: passageCollapsed }">
          <div class="reading-panel-header" @click="passageCollapsed = !passageCollapsed">
            <span class="reading-panel-label">DIRECTIONS</span>
            <span class="reading-panel-hint">阅读以下文章并回答右侧问题</span>
            <el-icon class="collapse-icon" :class="{ rotated: passageCollapsed }">
              <ArrowDown />
            </el-icon>
          </div>
          <div v-show="!passageCollapsed" class="reading-panel-body">
            <article class="reading-article">
              <h1 class="article-title">{{ cleanTitle(passageTitle) }}</h1>
              <div class="article-text">{{ passageText }}</div>
            </article>
          </div>
        </aside>

        <!-- 右侧：答题区域 -->
        <main class="question-panel">
          <!-- 题目导航条 -->
          <div class="question-nav">
            <div class="nav-dots">
              <button
                v-for="(q, i) in questions"
                :key="q.id"
                class="nav-dot"
                :class="{
                  current: i === currentIndex,
                  answered: answers[i] !== undefined,
                }"
                @click="goToQuestion(i)"
              >{{ i + 1 }}</button>
            </div>
          </div>

          <!-- 当前题目 -->
          <div class="question-container" :key="'q-' + currentIndex">
            <div class="question-meta">
              <span class="meta-type">{{ typeLabel(currentQuestion.type) }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-index">Question {{ currentIndex + 1 }} of {{ questions.length }}</span>
            </div>
            <div class="question-text">{{ currentQuestion.content }}</div>

            <!-- 选项 -->
            <div class="options-list">
              <div
                v-for="opt in parsedOptions"
                :key="opt.label"
                class="option-row"
                :class="{ selected: selectedAnswer === opt.label }"
                @click="selectAnswer(opt.label)"
              >
                <div class="option-marker">
                  <span class="marker-letter">{{ opt.label }}</span>
                </div>
                <div class="option-body">
                  <span class="option-content">{{ opt.text }}</span>
                </div>
                <el-icon v-if="selectedAnswer === opt.label" class="option-check"><Select /></el-icon>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-footer">
            <el-button
              :disabled="currentIndex === 0"
              @click="prevQuestion"
              class="nav-btn"
            >
              <el-icon><ArrowLeft /></el-icon>
              上一题
            </el-button>

            <div class="footer-center">
              <div v-if="!allAnswered && currentIndex === questions.length - 1" class="remain-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>还有 {{ questions.length - answeredCount }} 题未答</span>
              </div>
            </div>

            <el-button
              v-if="currentIndex < questions.length - 1"
              type="primary"
              @click="nextQuestion"
              class="nav-btn"
            >
              下一题
              <el-icon><ArrowRight /></el-icon>
            </el-button>

            <el-button
              v-if="allAnswered"
              type="success"
              size="large"
              @click="goResult"
              class="submit-btn"
            >
              <el-icon><Check /></el-icon>
              提交并查看结果
            </el-button>
          </div>

          <!-- 提示 -->
          <div v-if="!allAnswered" class="submit-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>选完所有题目后即可提交，答案将在提交后统一公布</span>
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
import { ArrowLeft, ArrowDown, ArrowRight, Select, Check, InfoFilled } from '@element-plus/icons-vue'
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
const answers = ref([])

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

const answeredCount = computed(() => answers.value.filter(a => a !== undefined).length)
const allAnswered = computed(() => answeredCount.value === questions.value.length && questions.value.length > 0)

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const cleanTitle = (t) => (t || '未命名篇章').replace(/\s*\(Q\d+\)\s*$/g, '')

const selectAnswer = (label) => {
  selectedAnswer.value = label
  const isCorrect = label === correctAnswer.value
  answers.value[currentIndex.value] = {
    selected: label,
    isCorrect,
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
}

const goResult = async () => {
  const summary = questions.value.map((q, i) => {
    const a = answers.value[i]
    return {
      id: q.id,
      type: q.type,
      content: q.content,
      options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
      answer: q.answer,
      analysis: q.analysis,
      selected: a ? a.selected : null,
      isCorrect: a ? a.isCorrect : false,
    }
  })

  try {
    for (let i = 0; i < questions.value.length; i++) {
      const a = answers.value[i]
      if (a) {
        practiceAPI.submit({
          questionId: questions.value[i].id,
          subject: 'reading',
          userAnswer: a.selected,
          isCorrect: a.isCorrect,
        }).catch(() => {})
      }
    }
  } catch (e) {
    console.error('提交答题记录失败:', e)
  }

  try {
    const resultData = {
      title: passageTitle.value,
      passageText: passageText.value,
      questions: summary,
    }
    localStorage.setItem(`passage_result_${passageId.value}`, JSON.stringify(resultData))
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
/* ===== 整体页面 ===== */
.exam-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
}

/* ===== 顶部考试栏 ===== */
.exam-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px 4px;
  flex-shrink: 0;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn {
  font-size: 14px;
}
.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--el-border-color);
}
.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-pill {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 24px;
  padding: 6px 16px;
}
.pill-num {
  font-size: 18px;
  font-weight: 800;
  color: var(--el-color-primary);
}
.pill-sep {
  font-size: 14px;
  color: var(--el-color-primary-light-5);
  margin: 0 1px;
}
.pill-total {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary-light-3);
}
.pill-label {
  font-size: 12px;
  color: var(--el-color-primary-light-3);
  margin-left: 6px;
}

/* ===== 考试布局 ===== */
.exam-content {
  flex: 1;
  overflow: hidden;
}
.exam-layout {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: 0;
  height: 100%;
  overflow: hidden;
}
@media (max-width: 900px) {
  .exam-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 40% 60%;
  }
}

/* ===== 左侧：阅读面板（考试风格） ===== */
.reading-panel {
  background: #faf9f6;
  border-right: 1px solid #e0ddd5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.reading-panel.collapsed .reading-panel-body {
  display: none;
}

.reading-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 28px;
  background: #f0ede6;
  border-bottom: 1px solid #e0ddd5;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.reading-panel-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #8a8580;
  text-transform: uppercase;
}
.reading-panel-hint {
  font-size: 13px;
  color: #a09a92;
  flex: 1;
}
.collapse-icon {
  transition: transform 0.2s;
  color: #8a8580;
  font-size: 14px;
}
.collapse-icon.rotated {
  transform: rotate(180deg);
}

.reading-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 自定义滚动条 */
.reading-panel-body::-webkit-scrollbar {
  width: 6px;
}
.reading-panel-body::-webkit-scrollbar-track {
  background: transparent;
}
.reading-panel-body::-webkit-scrollbar-thumb {
  background: #d0ccc4;
  border-radius: 3px;
}
.reading-panel-body::-webkit-scrollbar-thumb:hover {
  background: #b8b3a8;
}

/* 文章内容 */
.reading-article {
  padding: 36px 44px 48px;
  max-width: 720px;
  margin: 0 auto;
}
.article-title {
  font-family: Georgia, 'Times New Roman', 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 28px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0ddd5;
  line-height: 1.3;
}
.article-text {
  font-family: Georgia, 'Times New Roman', 'Noto Serif SC', serif;
  font-size: 17px;
  line-height: 2.1;
  letter-spacing: 0.015em;
  color: #2a2a2a;
  white-space: pre-wrap;
  text-align: justify;
  text-justify: inter-character;
}

/* ===== 右侧：题目面板 ===== */
.question-panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

/* 题目导航 */
.question-nav {
  padding: 12px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: #fafafa;
}
.nav-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.nav-dot {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 2px solid #e4e4e4;
  background: #fff;
  color: #999;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  font-family: inherit;
}
.nav-dot:hover {
  border-color: var(--el-color-primary-light-4);
  color: var(--el-color-primary);
}
.nav-dot.current {
  border-color: var(--el-color-primary);
  color: #fff;
  background: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
}
.nav-dot.answered {
  background: #f0f9eb;
  border-color: #b3e19d;
  color: #67c23a;
}
.nav-dot.answered.current {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}

/* 题目容器 */
.question-container {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}
.question-container::-webkit-scrollbar {
  width: 5px;
}
.question-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.meta-type {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 3px 10px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}
.meta-sep {
  color: var(--el-text-color-placeholder);
}
.meta-index {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.question-text {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
  margin-bottom: 24px;
  color: #1a1a1a;
  white-space: pre-wrap;
}

/* 选项 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #ececec;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;
  background: #fff;
}
.option-row:hover {
  border-color: var(--el-color-primary-light-4);
  background: #f8faff;
}
.option-row.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.option-marker {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
}
.option-row.selected .option-marker {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}
.marker-letter {
  font-size: 14px;
  font-weight: 700;
  color: #888;
}
.option-row.selected .marker-letter {
  color: #fff;
}
.option-body {
  flex: 1;
  padding-top: 3px;
}
.option-content {
  font-size: 15px;
  line-height: 1.65;
  color: #333;
}
.option-check {
  font-size: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
  margin-top: 4px;
}

/* 底部操作栏 */
.action-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fafafa;
  flex-shrink: 0;
  gap: 12px;
}
.footer-center {
  flex: 1;
  display: flex;
  justify-content: center;
}
.remain-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-color-warning);
  font-weight: 500;
}
.nav-btn {
  font-size: 14px;
}
.submit-btn {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.submit-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 24px 10px;
  background: #fafafa;
  flex-shrink: 0;
}
</style>
