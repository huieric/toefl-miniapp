<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '阅读理解' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <!-- Source tag -->
      <div class="detail-meta" v-if="question">
        <el-tag :type="question.source === 'user' ? 'success' : 'primary'" size="small" effect="plain">
          {{ question.source === 'user' ? '真题' : '模拟题' }}
        </el-tag>
        <span class="meta-sep">|</span>
        <span class="meta-text">{{ typeLabel(question.type) }}</span>
        <span class="meta-sep">|</span>
        <el-tag :type="diffTag(question.difficulty)" size="small">{{ diffLabel(question.difficulty) }}</el-tag>
      </div>

      <!-- Passage -->
      <div class="passage" v-if="question?.passageText">
        <h4>阅读文章</h4>
        <div class="passage-content">
          <p v-for="(para, pi) in passageParagraphs" :key="pi" class="passage-para">{{ para }}</p>
        </div>
      </div>
      <el-alert
        v-else-if="question"
        title="暂无文章内容"
        type="info"
        :closable="false"
        show-icon
        class="passage-empty"
      />

      <!-- Question -->
      <div class="question-block" v-if="question">
        <h4>题目</h4>
        <p class="question-text">{{ question.content || question.question || question.stem }}</p>

        <div class="options-group">
          <div
            v-for="(opt, idx) in options"
            :key="idx"
            class="option-item"
            :class="{ selected: selected === idx }"
            @click="selected !== null && !submitted ? (selected = idx) : null"
          >
            <span class="option-letter">{{ letters[idx] }}.</span>
            <span class="option-text">{{ opt }}</span>
            <el-icon v-if="selected === idx" class="option-check"><Select /></el-icon>
          </div>
        </div>
      </div>

      <div class="action-bar">
        <CountdownTimer :seconds="timeLimit" :running="!submitted" @timeout="handleSubmit" />
        <el-button type="primary" :disabled="selected === null || submitted" @click="handleSubmit">
          提交答案
        </el-button>
      </div>

      <!-- Bookmark -->
      <div class="bookmark-section">
        <el-button :type="isBookmarked ? 'warning' : 'info'" @click="toggleBookmark" :icon="Star">
          {{ isBookmarked ? '⭐ 已收藏' : '☆ 收藏题目' }}
        </el-button>
        <span class="bookmark-count">{{ bookmarkCount }} 人已收藏</span>
      </div>

      <!-- Result -->
      <el-alert
        v-if="submitted"
        :title="resultText"
        :type="isCorrect ? 'success' : 'error'"
        :closable="false"
        show-icon
        class="result-alert"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Select, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI, bookmarkAPI } from '@/api'
import { splitPassageParagraphs } from '@/utils/passageParagraphs'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const router = useRouter()
const question = ref(null)
const selected = ref(null)
const submitted = ref(false)
const isCorrect = ref(false)
const loading = ref(false)
const timeLimit = ref(1200)

const letters = ['A', 'B', 'C', 'D', 'E', 'F']

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}
const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'

// Bookmark
const isBookmarked = ref(false)
const bookmarkCount = ref(0)
const currentQuestionId = ref(null)

const toggleBookmark = async () => {
  if (!currentQuestionId.value) return
  try {
    if (isBookmarked.value) {
      // 取消收藏 - 显示提示
      isBookmarked.value = false
      bookmarkCount.value = Math.max(0, bookmarkCount.value - 1)
      ElMessage.info('已取消收藏')
    } else {
      await bookmarkAPI.add({ questionId: currentQuestionId.value, type: 'question' })
      isBookmarked.value = true
      bookmarkCount.value++
      ElMessage.success('收藏成功')
    }
  } catch (_) {
    ElMessage.error('操作失败')
  }
}

const options = computed(() => {
  if (!question.value) return []
  const opts = question.value.options
  if (!opts) return []
  // Handle label-format: [{label:'A', text:'...'}, ...]
  if (Array.isArray(opts) && opts.length > 0 && typeof opts[0] === 'object') {
    return opts.map(o => o.text || o)
  }
  // Handle plain string array
  if (Array.isArray(opts)) return opts
  // Handle object format: {A:'...', B:'...'}
  if (typeof opts === 'object') {
    return [opts.A, opts.B, opts.C, opts.D, opts.E, opts.F].filter(Boolean)
  }
  return []
})

const resultText = computed(() => isCorrect.value ? '回答正确！' : `回答错误，正确答案是 ${question.value?.answer || '待定'}`)

const passageParagraphs = computed(() => splitPassageParagraphs(question.value?.passageText))

const handleSubmit = async () => {
  if (submitted.value) return
  submitted.value = true
  const userAnswer = letters[selected.value]
  const correctAnswer = question.value.answer

  if (!correctAnswer) {
    isCorrect.value = null
    return
  }

  const correct = typeof correctAnswer === 'number'
    ? letters[correctAnswer]
    : correctAnswer
  isCorrect.value = userAnswer === correct

  try {
    await practiceAPI.submit({
      questionId: question.value.id,
      subject: 'reading',
      userAnswer,
      isCorrect: isCorrect.value,
    })
  } catch (e) { console.error(e) }

  setTimeout(() => {
    router.push(`/reading/${route.params.id}/result`)
  }, 1500)
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getById(route.params.id)
    question.value = res.data?.data || res.data || {}
    currentQuestionId.value = question.value.id
    // 模拟 bookmark 数据
    bookmarkCount.value = Math.floor(Math.random() * 50) + 5
    isBookmarked.value = Math.random() > 0.6
    if (question.value.timeLimit) timeLimit.value = question.value.timeLimit
  } catch (e) { ElMessage.error('加载题目失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px 14px;
  background: #F8F9FC;
  border-radius: 8px;
}
.meta-sep { color: #ccc; font-size: 13px; }
.meta-text { color: var(--text-secondary); font-size: 13px; }
.passage { margin-bottom: 24px; }
.passage h4 { font-size: 15px; margin-bottom: 10px; }
.passage-content {
  background: #F8F9FC;
  border-radius: 8px;
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
  text-align: justify;
}
.passage-para {
  margin: 0 0 1em 0;
  text-indent: 2em;
}
.passage-para:last-child { margin-bottom: 0; }
.passage-empty { margin-bottom: 24px; }
.question-block { margin-bottom: 24px; }
.question-text { font-size: 15px; font-weight: 500; margin-bottom: 16px; }
.options-group { width: 100%; }
.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  margin-bottom: 8px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.15s;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}
.option-item:hover {
  border-color: var(--primary-light-4);
  background: var(--primary-soft);
}
.option-item:active {
  transform: scale(0.98);
}
.option-item.selected {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}
.option-letter {
  font-weight: 700;
  color: var(--primary);
  min-width: 20px;
}
.option-text { flex: 1; }
.option-check {
  color: var(--primary);
  font-size: 18px;
  flex-shrink: 0;
}
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  gap: 12px;
}
.result-alert { margin-top: 16px; }

.bookmark-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.bookmark-count {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 80px;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .card {
    padding: 16px;
  }
  .detail-meta {
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
    padding: 8px 12px;
  }
  .detail-meta .el-tag {
    font-size: 11px;
    padding: 2px 8px;
  }
  .passage {
    margin-bottom: 18px;
  }
  .passage h4 {
    font-size: 14px;
    margin-bottom: 8px;
  }
  .passage-content {
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.7;
    max-height: 280px;
    border-radius: 8px;
  }
  .passage-empty {
    margin-bottom: 18px;
  }
  .question-block {
    margin-bottom: 18px;
  }
  .question-text {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .option-item {
    padding: 12px 14px;
    min-height: 48px;
    font-size: 13px;
    gap: 8px;
  }
  .option-text { font-size: 13px; }
  .option-check { font-size: 16px; }
  .action-bar {
    flex-direction: column;
    gap: 10px;
    padding-top: 14px;
  }
  .action-bar .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }
  .action-bar .CountdownTimer {
    width: 100%;
  }
  .result-alert {
    margin-top: 14px;
  }
}
</style>