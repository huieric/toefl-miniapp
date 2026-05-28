<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '阅读理解' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <!-- Passage -->
      <div class="passage" v-if="question?.passage">
        <h4>阅读文章</h4>
        <div class="passage-content" v-html="formatPassage(question.passage)"></div>
      </div>

      <!-- Question -->
      <div class="question-block" v-if="question">
        <h4>题目</h4>
        <p class="question-text">{{ question.question || question.stem }}</p>

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

const options = computed(() => {
  if (!question.value) return []
  const opts = question.value.options
  if (Array.isArray(opts)) return opts
  if (typeof opts === 'object') {
    return [opts.A, opts.B, opts.C, opts.D, opts.E, opts.F].filter(Boolean)
  }
  return []
})

const resultText = computed(() => isCorrect.value ? '回答正确！' : `回答错误，正确答案是 ${letters[question.value?.answer]}`)

const formatPassage = (text) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br/>')
}

const handleSubmit = async () => {
  if (submitted.value) return
  submitted.value = true
  const answer = letters[selected.value]
  const correctAnswer = typeof question.value.answer === 'number'
    ? letters[question.value.answer]
    : question.value.answer
  isCorrect.value = answer === correctAnswer

  try {
    await practiceAPI.submit({
      questionId: question.value._id || question.value.id,
      subject: 'reading',
      userAnswer: answer,
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
    question.value = res.data?.question || res.data || {}
    if (question.value.timeLimit) timeLimit.value = question.value.timeLimit
  } catch (e) { ElMessage.error('加载题目失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
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