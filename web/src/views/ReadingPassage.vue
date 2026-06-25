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
        <span class="answered-count">{{ answeredCount }}/{{ questions.length }} 已答</span>
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
                }"
                @click="goToQuestion(i)"
              >{{ i + 1 }}</span>
            </div>
          </div>

          <!-- 当前题目 -->
          <div class="question-card" :key="'q-' + currentIndex">
            <div class="q-type-badge">
              <el-tag size="small" effect="plain">{{ typeLabel(currentQuestion.type) }}</el-tag>
              <span class="q-index">第 {{ currentIndex + 1 }} 题 / 共 {{ questions.length }} 题</span>
            </div>
            <div class="q-content">{{ currentQuestion.content }}</div>

            <!-- 选项 -->
            <div class="q-options">
              <div
                v-for="opt in parsedOptions"
                :key="opt.label"
                class="option-item"
                :class="{ selected: selectedAnswer === opt.label }"
                @click="selectAnswer(opt.label)"
              >
                <span class="option-label">{{ opt.label }}</span>
                <span class="option-text">{{ opt.text }}</span>
                <el-icon v-if="selectedAnswer === opt.label" class="option-icon selected-icon"><Select /></el-icon>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-bar">
            <el-button
              :disabled="currentIndex === 0"
              @click="prevQuestion"
            >上一题</el-button>

            <el-button
              v-if="currentIndex < questions.length - 1"
              type="primary"
              @click="nextQuestion"
            >下一题 →</el-button>

            <!-- 最后一题但还有未答的题 -->
            <el-button
              v-if="currentIndex === questions.length - 1 && !allAnswered"
              type="success"
              disabled
            >
              <el-icon><InfoFilled /></el-icon>
              还有 {{ questions.length - answeredCount }} 题未答
            </el-button>

            <!-- 全部答完，可以提交 -->
            <el-button
              v-if="allAnswered"
              type="success"
              size="large"
              @click="goResult"
            >
              提交全部答案，查看结果
              <el-icon><Check /></el-icon>
            </el-button>
          </div>

          <!-- 提示 -->
          <div v-if="!allAnswered" class="hint-text">
            <el-icon><InfoFilled /></el-icon>
            选完所有题目后即可提交，答案将在提交后统一公布
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
const answers = ref([])  // [{ selected, isCorrect }] per question

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
  // 立即保存答案（不显示对错，整篇做完再统一公布）
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
  // 构建完整结果数据（含选项和文章，供结果页展示）
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

  // 批量提交答题记录到后端
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

  // 存入 localStorage 供结果页读取
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
.answered-count {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 4px 12px;
  border-radius: 20px;
}

.passage-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .passage-layout {
    grid-template-columns: 1fr;
  }
  .passage-text-panel {
    position: static !important;
    max-height: 400px !important;
  }
}

/* 文章面板 */
.passage-text-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.passage-content {
  font-size: 14px;
  line-height: 1.9;
  color: var(--text-regular);
  white-space: pre-wrap;
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
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border-color: var(--el-color-success-light-5);
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
  display: flex;
  align-items: center;
  gap: 10px;
}
.q-index {
  font-size: 13px;
  color: var(--text-secondary);
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
.option-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.option-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.option-label {
  font-weight: 700;
  font-size: 15px;
  min-width: 24px;
  color: var(--el-color-primary);
}
.option-item.selected .option-label {
  color: var(--el-color-primary);
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
.selected-icon { color: var(--el-color-primary); }

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 0;
  flex-wrap: wrap;
}

/* 提示 */
.hint-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}
</style>
