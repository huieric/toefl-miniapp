<template>
  <div class="page-container">
    <div class="result-header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回篇章
      </el-button>
      <h2>答题结果</h2>
    </div>

    <div v-if="resultData" class="result-body">
      <!-- 成绩卡片 -->
      <div class="score-card">
        <div class="score-ring">
          <el-progress
            type="circle"
            :percentage="accuracyPercent"
            :width="140"
            :stroke-width="12"
            :color="scoreColor"
          >
            <template #default>
              <span class="score-value">{{ accuracyPercent }}%</span>
            </template>
          </el-progress>
        </div>
        <div class="score-stats">
          <div class="stat-item correct">
            <span class="stat-num">{{ correctCount }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item wrong">
            <span class="stat-num">{{ wrongCount }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat-item total">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-label">总题数</span>
          </div>
        </div>
      </div>

      <!-- 文章回顾（可折叠） -->
      <div v-if="resultData.passageText" class="passage-review">
        <div class="passage-review-header" @click="passageVisible = !passageVisible">
          <span class="panel-label">📄 文章回顾</span>
          <el-icon class="collapse-icon" :class="{ rotated: !passageVisible }"><ArrowDown /></el-icon>
        </div>
        <div v-show="passageVisible" class="passage-review-body">
          <div class="passage-review-content">{{ resultData.passageText }}</div>
        </div>
      </div>

      <!-- 逐题回顾与解析 -->
      <div class="review-section">
        <h3 class="review-title">逐题回顾与解析</h3>
        <div
          v-for="(r, i) in resultData.questions"
          :key="r.id"
          class="review-item"
          :class="{ correct: r.isCorrect, wrong: !r.isCorrect }"
        >
          <div class="review-head">
            <span class="review-num">Q{{ i + 1 }}</span>
            <span class="review-verdict">
              {{ r.isCorrect ? '✅ 正确' : '❌ 错误' }}
            </span>
            <el-tag size="small" effect="plain">{{ typeLabel(r.type) }}</el-tag>
          </div>
          <p class="review-content">{{ r.content }}</p>

          <!-- 选项展示 -->
          <div v-if="parseOptions(r.options).length" class="review-options">
            <div
              v-for="opt in parseOptions(r.options)"
              :key="opt.label"
              class="review-option"
              :class="{
                'is-correct': opt.label === r.answer,
                'is-wrong-select': opt.label === r.selected && opt.label !== r.answer,
              }"
            >
              <span class="opt-label">{{ opt.label }}</span>
              <span class="opt-text">{{ opt.text }}</span>
              <el-icon v-if="opt.label === r.answer" class="opt-icon correct"><CircleCheckFilled /></el-icon>
              <el-icon v-if="opt.label === r.selected && opt.label !== r.answer" class="opt-icon wrong"><CircleCloseFilled /></el-icon>
              <span v-if="opt.label === r.selected && opt.label === r.answer" class="opt-tag your-tag">你的选择</span>
              <span v-else-if="opt.label === r.selected" class="opt-tag your-tag wrong-tag">你的选择</span>
            </div>
          </div>

          <!-- 答案详情 -->
          <div class="review-detail">
            <div class="detail-row">
              <span class="detail-label">你的答案：</span>
              <span :class="r.isCorrect ? 'text-correct' : 'text-wrong'">{{ r.selected || '未作答' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">正确答案：</span>
              <span class="text-correct">{{ r.answer }}</span>
            </div>
          </div>

          <!-- 答案解析 -->
          <div class="review-analysis" :class="{ 'analysis-wrong': !r.isCorrect, 'analysis-correct': r.isCorrect }">
            <div class="analysis-title">
              <el-icon><EditPen /></el-icon>
              <span>答案解析</span>
            </div>
            <p class="analysis-text">{{ getAnalysis(r) }}</p>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="result-actions">
        <el-button @click="goBack">返回篇章</el-button>
        <el-button type="primary" @click="redoPassage">
          <el-icon><Refresh /></el-icon>重新作答
        </el-button>
        <el-button @click="goList">返回列表</el-button>
      </div>
    </div>

    <el-empty v-else description="暂无结果数据" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowDown, Refresh, CircleCheckFilled, CircleCloseFilled, EditPen } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const passageId = computed(() => route.params.passageId)
const resultData = ref(null)
const passageVisible = ref(false)

const questions = computed(() => resultData.value?.questions || [])

const totalCount = computed(() => questions.value.length)
const correctCount = computed(() => questions.value.filter(r => r.isCorrect).length)
const wrongCount = computed(() => totalCount.value - correctCount.value)
const accuracyPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const scoreColor = computed(() => {
  if (accuracyPercent.value >= 80) return '#67c23a'
  if (accuracyPercent.value >= 60) return '#e6a23c'
  return '#f56c6c'
})

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'

const parseOptions = (optsRaw) => {
  if (!optsRaw) return []
  if (Array.isArray(optsRaw)) return optsRaw
  if (typeof optsRaw === 'string') {
    try { return JSON.parse(optsRaw) } catch (_) { return [] }
  }
  return []
}

// 自动生成答案解析（当后端未提供 analysis 时）
const getAnalysis = (r) => {
  // 有现成解析就直接用
  if (r.analysis && r.analysis.trim()) return r.analysis.trim()

  const opts = parseOptions(r.options)
  const correctOpt = opts.find(o => o.label === r.answer)
  const correctText = correctOpt ? correctOpt.text : r.answer
  const typeLabelStr = typeLabel(r.type)

  // 根据题目类型生成基础解析
  const templates = {
    detail: `本题考查文章中的细节信息。正确答案为 ${r.answer}（${correctText}）。根据文章相关段落的内容，可以找到与该选项直接对应的信息。`,
    inference: `本题考查推断能力。正确答案为 ${r.answer}（${correctText}）。虽然文章未直接陈述，但根据文中提供的信息可以合理推断出该结论。`,
    vocabulary: `本题考查词汇理解。正确答案为 ${r.answer}（${correctText}）。该词汇在上下文中的含义与所选选项最为接近。`,
    summary: `本题考查对文章主旨或段落总结的理解。正确答案为 ${r.answer}（${correctText}）。该选项最准确地概括了文章的核心内容。`,
    purpose: `本题考查作者意图或目的。正确答案为 ${r.answer}（${correctText}）。根据文章的行文逻辑和语境，作者在此处的目的是该选项所述。`,
    reference: `本题考查指代关系。正确答案为 ${r.answer}（${correctText}）。根据上下文的语法和语义关系，该指代词所指代的内容为所选选项。`,
  }

  return templates[r.type] || `正确答案为 ${r.answer}（${correctText}）。${typeLabelStr}需要结合文章上下文进行理解。`
}

const goBack = () => router.push(`/reading/passage/${passageId.value}`)
const goList = () => router.push('/reading')
const redoPassage = () => router.push(`/reading/passage/${passageId.value}`)

onMounted(() => {
  try {
    const key = `passage_result_${passageId.value}`
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 兼容新旧格式：新格式 { title, passageText, questions }，旧格式直接是数组
      if (Array.isArray(parsed)) {
        resultData.value = { title: '', passageText: '', questions: parsed }
      } else {
        resultData.value = parsed
      }
      // 读取后清理
      localStorage.removeItem(key)
    }
  } catch (e) {
    console.error('读取答题结果失败:', e)
  }
})
</script>

<style scoped>
.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.result-header h2 {
  margin: 0;
  font-size: 20px;
}

.result-body {
  max-width: 900px;
}

/* 成绩卡片 */
.score-card {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-bottom: 20px;
}
.score-ring {
  flex-shrink: 0;
}
.score-value {
  font-size: 28px;
  font-weight: 700;
}
.score-stats {
  display: flex;
  gap: 32px;
  flex: 1;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-num {
  font-size: 32px;
  font-weight: 700;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.stat-item.correct .stat-num { color: var(--el-color-success); }
.stat-item.wrong .stat-num { color: var(--el-color-danger); }
.stat-item.total .stat-num { color: var(--el-color-primary); }

/* 文章回顾 */
.passage-review {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.passage-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  user-select: none;
}
.passage-review-header:hover {
  background: var(--el-fill-color);
}
.passage-review-body {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}
.passage-review-content {
  font-family: Georgia, 'Times New Roman', 'Noto Serif SC', serif;
  font-size: 16px;
  line-height: 2.0;
  color: #2c2c2c;
  white-space: pre-wrap;
  text-align: justify;
}
.collapse-icon {
  transition: transform 0.2s;
}
.collapse-icon.rotated {
  transform: rotate(180deg);
}

/* 逐题回顾 */
.review-section {
  margin-bottom: 24px;
}
.review-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.review-item {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid var(--el-border-color);
}
.review-item.correct {
  border-left-color: var(--el-color-success);
}
.review-item.wrong {
  border-left-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.review-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.review-num {
  font-weight: 700;
  color: var(--text-secondary);
}
.review-verdict {
  font-weight: 600;
  font-size: 14px;
}
.review-content {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--text-regular);
  line-height: 1.7;
}

/* 选项展示 */
.review-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.review-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border: 1.5px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}
.review-option.is-correct {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.review-option.is-wrong-select {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.opt-label {
  font-weight: 700;
  font-size: 14px;
  min-width: 20px;
}
.review-option.is-correct .opt-label { color: var(--el-color-success); }
.review-option.is-wrong-select .opt-label { color: var(--el-color-danger); }
.opt-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
}
.opt-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.opt-icon.correct { color: var(--el-color-success); }
.opt-icon.wrong { color: var(--el-color-danger); }
.opt-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.your-tag {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}
.your-tag.wrong-tag {
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
}

/* 答案详情 */
.review-detail {
  display: flex;
  gap: 24px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border-radius: 6px;
  margin-bottom: 10px;
}
.detail-row {
  font-size: 13px;
}
.detail-label {
  color: var(--text-secondary);
}
.text-correct { color: var(--el-color-success); font-weight: 600; }
.text-wrong { color: var(--el-color-danger); font-weight: 600; }

/* 答案解析 */
.review-analysis {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid var(--el-color-info);
  background: var(--el-fill-color-light);
}
.review-analysis.analysis-wrong {
  border-left-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.review-analysis.analysis-correct {
  border-left-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.review-analysis.no-analysis {
  border-left-color: var(--el-border-color);
  background: var(--el-fill-color-lighter);
}
.analysis-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
}
.analysis-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.8;
}

/* 底部操作 */
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}
</style>
