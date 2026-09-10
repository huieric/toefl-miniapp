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
      <div v-if="isMobile && !loading && questions.length" class="mobile-view-toggle">
        <button :class="{ active: mobileView === 'passage' }" @click="mobileView = 'passage'; passageCollapsed = false">阅读文章</button>
        <button :class="{ active: mobileView === 'question' }" @click="mobileView = 'question'">答题</button>
      </div>
      <div v-if="!loading && questions.length" class="exam-layout">
        <!-- 左侧：阅读文章（考试风格） -->
        <aside class="reading-panel" :class="{ collapsed: passageCollapsed, 'mobile-hidden': isMobile && mobileView !== 'passage' }">
          <div class="reading-panel-header" @click="passageCollapsed = !passageCollapsed">
            <span class="reading-panel-label">DIRECTIONS</span>
            <span class="reading-panel-hint">阅读以下文章并回答右侧问题</span>
            <el-icon class="collapse-icon" :class="{ rotated: passageCollapsed }">
              <ArrowDown />
            </el-icon>
          </div>
          <div v-show="!passageCollapsed" class="reading-panel-body">
            <div class="reading-panel-tools">
              <el-button size="small" type="primary" @click="loadAIAnnotation" :loading="loadingAnnotation" :disabled="!passageText">
                <el-icon><MagicStick /></el-icon>
                {{ annotationLoaded ? '重新标注' : 'AI 生词/长难句标注' }}
              </el-button>
            </div>
            <!-- AI 标注面板 -->
            <div v-if="annotationLoaded && (aiVocab.length || aiSentences.length)" class="annotation-panel">
              <div v-if="aiVocab.length" class="annotation-section">
                <h4 class="section-title"><el-icon><Collection /></el-icon> 生词表 ({{ aiVocab.length }})</h4>
                <div class="vocab-list">
                  <div v-for="(v, i) in aiVocab" :key="i" class="vocab-item">
                    <span class="vocab-item-word">{{ v.word }}</span>
                    <span class="vocab-item-pos">{{ v.pos }}</span>
                    <span class="vocab-item-meaning">{{ v.meaning }}</span>
                  </div>
                </div>
              </div>
              <div v-if="aiSentences.length" class="annotation-section">
                <h4 class="section-title"><el-icon><Document /></el-icon> 长难句深度解析 ({{ aiSentences.length }})</h4>
                <div class="sentence-list">
                  <div v-for="(s, i) in aiSentences" :key="i" class="sentence-item">
                    <!-- 语法类型标签 -->
                    <div v-if="s.grammarType" class="grammar-type-badge">{{ s.grammarType }}</div>
                    
                    <!-- 原句 -->
                    <div class="sentence-text">{{ s.sentence }}</div>
                    
                    <!-- 主干提取 -->
                    <div v-if="s.mainClause" class="sentence-main-clause">
                      <span class="label">🔑 主干：</span>
                      <span>{{ s.mainClause }}</span>
                    </div>
                    
                    <!-- 从句拆分 -->
                    <div v-if="s.clauses && s.clauses.length" class="clause-breakdown">
                      <span class="label">🔀 从句拆解：</span>
                      <ul>
                        <li v-for="(c, ci) in s.clauses" :key="ci">
                          <strong>{{ c.type }}：</strong>{{ c.content }}
                        </li>
                      </ul>
                    </div>
                    
                    <!-- 语法结构分析 -->
                    <div class="sentence-parsing">📐 {{ s.parsing }}</div>
                    
                    <!-- 语法要点 -->
                    <div v-if="s.keyPoints" class="sentence-key-points">💡 {{ s.keyPoints }}</div>
                    
                    <!-- 翻译 -->
                    <div class="sentence-translation">📝 {{ s.translation }}</div>
                  </div>
                </div>
              </div>
            </div>
            <article class="reading-article">
              <h1 class="article-title">{{ cleanTitle(passageTitle) }}</h1>
              <div class="article-text">
                <p v-for="(para, pi) in passageParagraphs" :key="pi" class="article-para">
                  <span
                    v-for="(w, wi) in splitWords(para)"
                    :key="wi"
                    class="vocab-word"
                    v-text="w + ' '"
                    @click="onWordClick(w, para)"
                  ></span>
                </p>
              </div>
            </article>
          </div>
        </aside>

        <!-- 右侧：答题区域 -->
        <main class="question-panel" :class="{ 'mobile-hidden': isMobile && mobileView !== 'question' }">
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
            <div v-if="isMultiAnswerQuestion" class="multi-answer-hint">
              请选择 {{ correctAnswerLabels.length || 3 }} 个选项
            </div>

            <!-- 选项 -->
            <div class="options-list">
              <div
                v-for="opt in parsedOptions"
                :key="opt.label"
                class="option-row"
                :class="{ selected: isOptionSelected(opt.label) }"
                @click="selectAnswer(opt.label)"
              >
                <div class="option-marker">
                  <span class="marker-letter">{{ opt.label }}</span>
                </div>
                <div class="option-body">
                  <span class="option-content">{{ opt.text }}</span>
                </div>
                <el-icon v-if="isOptionSelected(opt.label)" class="option-check"><Select /></el-icon>
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

          <!-- 移动端：浮动提交按钮 -->
          <el-button
            v-if="allAnswered && isMobile"
            class="floating-submit"
            type="success"
            @click="goResult"
          >
            <el-icon><Check /></el-icon>
            提交并查看结果
          </el-button>
        </main>
      </div>

      <el-empty v-if="!loading && !questions.length" description="该篇章没有题目" />
    </div>

    <!-- 移动端 Tab Bar -->
    <div v-if="isMobile && !loading && questions.length" class="mobile-tab-bar">
      <button class="mobile-tab-btn" :class="{ active: mobileActiveTab === 'passage' }" @click="mobileActiveTab = 'passage'">
        <span class="tab-icon">📖</span>
        <span class="tab-label">文章</span>
      </button>
      <button class="mobile-tab-btn" :class="{ active: mobileActiveTab === 'question' }" @click="mobileActiveTab = 'question'">
        <span class="tab-icon">✏️</span>
        <span class="tab-label">答题</span>
      </button>
      <button class="mobile-tab-btn" :class="{ active: mobileActiveTab === 'result' }" @click="goResult" v-if="allAnswered">
        <span class="tab-icon">📊</span>
        <span class="tab-label">提交</span>
      </button>
    </div>

    <!-- 生词弹窗 -->
    <el-dialog v-model="vocabDialog" title="加入生词本" width="min(92vw, 360px)">
      <div class="vocab-pick">
        <div class="vocab-pick-word">
          {{ selectedWord }}
          <span v-if="selectedPhonetic" class="vocab-phonetic">{{ selectedPhonetic }}</span>
        </div>
        <div v-if="looking" class="vocab-looking">查词中…</div>
        <div v-else-if="selectedMeaning" class="vocab-meaning">{{ selectedMeaning }}</div>
        <div v-else class="vocab-meaning vocab-meaning-empty">未查到释义，可稍后在生词本手动补充</div>
        <div v-if="selectedContext" class="vocab-pick-context">{{ selectedContext }}</div>
      </div>
      <template #footer>
        <el-button @click="vocabDialog = false">取消</el-button>
        <el-button type="primary" @click="addToVocab">加入生词本</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowDown, ArrowRight, Select, Check, InfoFilled, MagicStick, Collection, Document } from '@element-plus/icons-vue'
import { questionAPI, practiceAPI, vocabAPI } from '@/api'
import { splitPassageParagraphs } from '@/utils/passageParagraphs'

const route = useRoute()
const router = useRouter()

const passageId = computed(() => route.params.passageId)
const passageTitle = ref('')
const passageText = ref('')
const passageSource = ref('')
const questions = ref([])
const loading = ref(true)
const passageCollapsed = ref(false)

// 移动端「文章 / 答题」切换
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const mobileView = ref('question') // 'passage' | 'question'
const mobileActiveTab = ref('question') // mobile tab: 'passage' | 'question' | 'result'

// 移动端 Tab 切换时同步视图
watch(mobileActiveTab, (tab) => {
  if (tab === 'passage') {
    mobileView.value = 'passage'
    passageCollapsed.value = false
  } else if (tab === 'question') {
    mobileView.value = 'question'
  }
})
const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const currentIndex = ref(0)
const selectedAnswer = ref([])
const answers = ref([])

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

const passageParagraphs = computed(() => splitPassageParagraphs(passageText.value))

// —— 生词本：点击单词加入 ——
const vocabDialog = ref(false)
const selectedWord = ref('')
const selectedContext = ref('')
const selectedPhonetic = ref('')
const selectedMeaning = ref('')
const looking = ref(false)
const splitWords = (para) => String(para || '').split(/\s+/).filter(Boolean)
const cleanWord = (w) => String(w || '').replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')
const sentenceOf = (para, word) => {
  const w = word.toLowerCase()
  const sentences = String(para || '').split(/(?<=[.!?])\s+/)
  return sentences.find((s) => s.toLowerCase().includes(w)) || para
}
const lookupWord = async (word) => {
  looking.value = true
  selectedPhonetic.value = ''
  selectedMeaning.value = ''
  try {
    const res = await vocabAPI.lookup(word)
    const d = res.data?.data
    if (d && d.meanings && d.meanings.length) {
      selectedPhonetic.value = d.phonetic || ''
      const first = d.meanings[0]
      selectedMeaning.value = `${first.partOfSpeech ? '[' + first.partOfSpeech + '] ' : ''}${first.definition}`
    }
  } catch (_) {
    selectedMeaning.value = ''
  } finally {
    looking.value = false
  }
}
const onWordClick = (raw, para) => {
  const word = cleanWord(raw)
  if (!/^[A-Za-z'-]{2,}$/.test(word)) return
  selectedWord.value = word
  selectedContext.value = sentenceOf(para, word)
  vocabDialog.value = true
  lookupWord(word)
}
const addToVocab = async () => {
  try {
    await vocabAPI.add({
      word: selectedWord.value,
      meaning: selectedMeaning.value,
      context: selectedContext.value,
      subject: 'reading',
      questionId: currentQuestion.value.id || null,
    })
    ElMessage.success(`「${selectedWord.value}」已加入生词本`)
    vocabDialog.value = false
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加入失败')
  }
}

// —— AI 标注：生词 + 长难句 ——
const annotationLoaded = ref(false)
const loadingAnnotation = ref(false)
const aiVocab = ref([])
const aiSentences = ref([])

const loadAIAnnotation = async () => {
  if (loadingAnnotation.value || annotationLoaded.value) return
  loadingAnnotation.value = true
  try {
    const res = await practiceAPI.aiAnnotate({ questionId: passageId.value })
    if (res.data?.data) {
      aiVocab.value = res.data.data.vocabulary || []
      aiSentences.value = res.data.data.longSentences || []
      annotationLoaded.value = true
      ElMessage.success(`标注完成：${aiVocab.value.length} 个生词，${aiSentences.value.length} 个长难句`)
    }
  } catch (e) {
    if (e?.response?.data?.code !== 200) {
      ElMessage.error(e?.response?.data?.message || '标注失败')
    } else {
      // 需要 API key
      ElMessage.info('标注功能需要配置 AI API Key，请前往「个人中心 → AI 设置」配置')
    }
  } finally {
    loadingAnnotation.value = false
  }
}

const parsedOptions = computed(() => {
  const opts = currentQuestion.value.options
  if (Array.isArray(opts)) return opts
  if (typeof opts === 'string') {
    try { return JSON.parse(opts) } catch (_) { return [] }
  }
  return []
})

const splitAnswer = (answer) => {
  if (Array.isArray(answer)) return answer.map(String).map(s => s.trim()).filter(Boolean)
  return String(answer || '').match(/[A-F]/g) || []
}

const normalizeAnswer = (answer) => splitAnswer(answer).sort().join(',')

const correctAnswer = computed(() => normalizeAnswer(currentQuestion.value.answer))
const correctAnswerLabels = computed(() => splitAnswer(currentQuestion.value.answer))
const isMultiAnswerQuestion = computed(() => correctAnswerLabels.value.length > 1 || currentQuestion.value.type === 'summary')

const answeredCount = computed(() => answers.value.filter(a => a !== undefined).length)
const allAnswered = computed(() => answeredCount.value === questions.value.length && questions.value.length > 0)

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const cleanTitle = (t) => (t || '未命名篇章').replace(/\s*\(Q\d+\)\s*$/g, '')

const selectAnswer = (label) => {
  let next
  if (isMultiAnswerQuestion.value) {
    const current = new Set(selectedAnswer.value)
    if (current.has(label)) current.delete(label)
    else current.add(label)
    next = [...current].sort()
  } else {
    next = [label]
  }

  selectedAnswer.value = next
  const selectedNormalized = normalizeAnswer(next)
  const isCorrect = selectedNormalized === correctAnswer.value
  answers.value[currentIndex.value] = {
    selected: selectedNormalized,
    isCorrect,
  }
}

const isOptionSelected = (label) => selectedAnswer.value.includes(label)

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
  selectedAnswer.value = saved ? splitAnswer(saved.selected) : []
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
    // 提交每道题的答案到后端判分（后端会对比 answer 字段自动判分）
    await Promise.all(questions.value.map((q, i) => {
      const a = answers.value[i]
      if (!a) return Promise.resolve()
      return practiceAPI.submit({
        questionId: q.id,
        subject: 'reading',
        answers: a.selected,
        timeSpent: 0,
      })
    }))
  } catch (e) {
    console.error('[Passage] 提交答题记录失败:', e)
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
  text-align: justify;
  text-justify: inter-character;
}
.article-para {
  margin: 0 0 1.4em 0;
  text-indent: 2em;
  text-align: justify;
}
.article-para:last-child {
  margin-bottom: 0;
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
  background: #F8F9FC;
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
  color: #23B26D;
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
.multi-answer-hint {
  display: inline-flex;
  align-items: center;
  margin: -8px 0 18px;
  padding: 5px 10px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  font-size: 13px;
  font-weight: 600;
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
  background: #F8F9FC;
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
  background: #F8F9FC;
  flex-shrink: 0;
}

.vocab-word {
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.12s ease;
}
.vocab-word:hover {
  background: #fff3bf;
}
.vocab-pick-word {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}
.vocab-pick-context {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.vocab-phonetic {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
}
.vocab-looking {
  font-size: 13px;
  color: var(--text-muted, #999);
  margin: 6px 0;
}
.vocab-meaning {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 6px 0;
}
.vocab-meaning-empty {
  color: var(--text-muted, #bbb);
}

/* AI 标注面板 */
.reading-panel-tools {
  padding: 8px 14px;
  border-bottom: 1px solid var(--border, #eee);
  display: flex;
  justify-content: flex-end;
}
.annotation-panel {
  border-bottom: 1px solid var(--border, #eee);
  background: #FAFBFC;
  max-height: 400px;
  overflow-y: auto;
}
.annotation-section {
  padding: 10px 14px;
  border-bottom: 1px dashed #eee;
}
.annotation-section:last-child {
  border-bottom: none;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.vocab-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vocab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 6px;
  background: white;
  border-radius: 4px;
}
.vocab-item-word {
  font-weight: 700;
  color: var(--el-color-primary);
  min-width: 70px;
}
.vocab-item-pos {
  font-size: 11px;
  color: var(--text-secondary);
  background: #F0F0F0;
  padding: 1px 4px;
  border-radius: 2px;
}
.vocab-item-meaning {
  flex: 1;
  color: var(--text);
}
.sentence-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sentence-item {
  padding: 8px 10px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
}
.grammar-type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: var(--el-color-primary);
  padding: 1px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
}
.sentence-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
  margin-bottom: 4px;
  font-weight: 500;
}
.sentence-main-clause {
  font-size: 12px;
  color: var(--text-primary);
  background: #E8F5E9;
  padding: 4px 8px;
  border-radius: 3px;
  margin-bottom: 3px;
}
.sentence-main-clause .label {
  font-weight: 700;
  margin-right: 2px;
}
.clause-breakdown {
  font-size: 11.5px;
  color: var(--text-secondary);
  margin-bottom: 3px;
  line-height: 1.5;
}
.clause-breakdown .label {
  font-weight: 700;
  display: block;
  margin-bottom: 1px;
}
.clause-breakdown ul {
  margin: 2px 0 0;
  padding-left: 16px;
}
.clause-breakdown li {
  margin-bottom: 1px;
}
.sentence-parsing {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}
.sentence-key-points {
  font-size: 12px;
  color: #E65100;
  background: #FFF3E0;
  padding: 4px 8px;
  border-radius: 3px;
  margin-bottom: 2px;
  line-height: 1.5;
}
.sentence-translation {
  font-size: 12px;
  color: var(--text-primary);
  background: #F5F5F5;
  padding: 4px 6px;
  border-radius: 3px;
}

/* 移动端：文章/答题 切换 — 底部 Tab Bar */
.mobile-view-toggle { display: none; }
.mobile-hidden { display: none !important; }
.mobile-tab-bar { display: none; }

@media (max-width: 767px) {
  /* 顶部栏紧凑化 */
  .exam-topbar { padding: 8px 10px 6px; }
  .topbar-title { font-size: 14px; max-width: 200px; }
  .back-btn span { display: none; }
  .back-btn .el-icon { font-size: 20px; }
  .progress-pill { padding: 4px 10px; }
  .pill-num { font-size: 16px; }
  .pill-label { display: none; }

  /* 移除顶部 toggle，改用底部 Tab Bar */
  .mobile-view-toggle { display: none !important; }

  /* 布局：全宽单列 */
  .exam-content { height: calc(100vh - 88px); }
  .exam-layout {
    grid-template-columns: 1fr !important;
    grid-template-rows: 1fr !important;
  }

  /* 阅读面板：全宽，可滚动 */
  .reading-panel {
    width: 100% !important;
    border-right: none !important;
    border-bottom: 1px solid #e0ddd5 !important;
    flex: none !important;
    display: flex !important;
    overflow: hidden;
  }
  .reading-panel .reading-panel-header {
    padding: 8px 14px;
    min-height: 36px;
  }
  .reading-panel-header { padding: 8px 14px; }
  .reading-panel-hint { font-size: 12px; }
  .reading-article { padding: 10px 14px 16px; }
  .article-title { font-size: 16px; margin-bottom: 8px; }
  .article-para { font-size: 15px; line-height: 1.75; margin-bottom: 14px; }

  /* 答题面板：全宽 */
  .question-panel {
    width: 100% !important;
    overflow-y: auto !important;
    padding: 0 !important;
  }
  .question-nav { padding: 8px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
  .nav-dot {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  .question-container { padding: 16px 14px 100px; }
  .question-text { font-size: 15px; line-height: 1.65; }

  /* 选项触摸优化 */
  .option-row {
    padding: 14px 12px;
    min-height: 48px;
    gap: 10px;
    transition: transform 0.1s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .option-row:active {
    transform: scale(0.98);
  }
  .option-content { font-size: 14px; }
  .option-marker {
    width: 28px;
    height: 28px;
  }

  /* 底部操作栏：移动端用 Tab Bar 替代 */
  .action-footer {
    padding: 10px 14px;
    gap: 8px;
  }
  .nav-btn { font-size: 13px; padding: 8px 12px; min-height: 38px; }
  .submit-btn { font-size: 14px; padding: 8px 20px; min-height: 40px; }
  .remain-hint { font-size: 12px; }
  .submit-hint { display: none; }

  /* 移动端浮动提交按钮（已答完时） */
  .floating-submit {
    display: none !important;
    position: fixed;
    bottom: 60px;
    left: 16px;
    right: 16px;
    max-width: 380px;
    margin: 0 auto;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 14px;
    z-index: 150;
    box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
  }

  /* 底部 Tab Bar */
  .mobile-tab-bar {
    display: flex !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #fff;
    border-top: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .mobile-tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: none;
    background: transparent;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-tab-btn.active {
    color: var(--el-color-primary);
  }
  .mobile-tab-btn .tab-icon {
    font-size: 20px;
  }
  .mobile-tab-btn .tab-label {
    font-weight: 600;
    font-size: 11px;
  }

  /* 答题区额外底部间距（避开 Tab Bar） */
  .question-container {
    padding-bottom: calc(100px + env(safe-area-inset-bottom, 0));
  }
}

/* ===== 平板端 ===== */
@media (min-width: 768px) and (max-width: 1024px) {
  .exam-layout {
    grid-template-columns: 45fr 55fr;
  }
  .article-text { font-size: 14px; }
}
</style>
