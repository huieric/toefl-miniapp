<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '阅读理解' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <!-- Source tag -->
      <div class="detail-meta" v-if="question">
        <el-tag :type="question.source === 'real' ? 'success' : 'primary'" size="small" effect="plain">
          {{ question.source === 'real' ? '真题' : '模拟题' }}
        </el-tag>
        <span class="meta-sep">|</span>
        <span class="meta-text">{{ typeLabel(question.type) }}</span>
        <span class="meta-sep">|</span>
        <el-tag :type="diffTag(question.difficulty)" size="small">{{ diffLabel(question.difficulty) }}</el-tag>
      </div>

      <!-- Passage -->
      <div class="passage" v-if="question?.passageText">
        <h4>阅读文章</h4>
        <div class="passage-content" v-html="formatPassage(question.passageText)"></div>
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

        <el-radio-group v-model="selected" class="options-group" size="large">
          <div
            v-for="(opt, idx) in options"
            :key="idx"
            class="option-item"
            :class="{ selected: selected === idx }"
          >
            <el-radio :value="idx">
              <span class="option-letter">{{ letters[idx] }}.</span> {{ opt }}
            </el-radio>
          </div>
        </el-radio-group>
      </div>

      <div class="action-bar">
        <CountdownTimer :seconds="timeLimit" :running="!submitted" @timeout="handleSubmit" />
        <el-button type="primary" :disabled="selected === null || submitted" @click="handleSubmit">
          提交答案
        </el-button>
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
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI } from '@/api'
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

const formatPassage = (text) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br/>')
}

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
  background: #f9fafb;
  border-radius: 8px;
}
.meta-sep { color: #ccc; font-size: 13px; }
.meta-text { color: var(--text-secondary); font-size: 13px; }
.passage { margin-bottom: 24px; }
.passage h4 { font-size: 15px; margin-bottom: 10px; }
.passage-content {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
}
.passage-empty { margin-bottom: 24px; }
.question-block { margin-bottom: 24px; }
.question-text { font-size: 15px; font-weight: 500; margin-bottom: 16px; }
.options-group { width: 100%; }
.option-item {
  padding: 10px 14px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.2s;
}
.option-item.selected { border-color: var(--primary); background: rgba(74,144,217,0.04); }
.option-letter { font-weight: 700; }
.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 16px; border-top: 1px solid var(--border);
}
.result-alert { margin-top: 16px; }
</style>