<template>
  <div class="review-page">
    <div class="review-top">
      <el-button text @click="$router.push('/wrong-book')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <span v-if="queue.length" class="progress">{{ index + 1 }} / {{ queue.length }}</span>
    </div>

    <div v-if="loading" v-loading="true" class="center"></div>

    <div v-else-if="!queue.length" class="done">
      <el-icon :size="52" color="#67c23a"><CircleCheck /></el-icon>
      <p class="done-text">今日错题复习完成 🎉</p>
      <el-button type="primary" @click="$router.push('/wrong-book')">返回错题本</el-button>
    </div>

    <div v-else class="card-wrap" :key="current.wrongId">
      <div class="q-card">
        <el-tag size="small" type="info">{{ subjectLabel(current.subject) }}</el-tag>
        <p v-if="current.passageText" class="passage">{{ current.passageText }}</p>
        <p class="q-text">{{ current.content }}</p>

        <div class="options">
          <div
            v-for="opt in parsedOptions"
            :key="opt.label"
            class="option"
            :class="{ selected: selected === opt.label, correct: revealed && isInAnswer(opt.label), wrong: revealed && selected === opt.label && !isInAnswer(opt.label) }"
            @click="selectOption(opt.label)"
          >
            <span class="opt-letter">{{ opt.label }}.</span> {{ opt.text }}
          </div>
        </div>

        <div v-if="revealed" class="feedback">
          <el-alert :title="feedbackText" :type="isCorrect ? 'success' : 'error'" :closable="false" show-icon />
        </div>
      </div>

      <div v-if="!revealed" class="action">
        <el-button type="primary" :disabled="!selected" @click="submitAnswer">提交答案</el-button>
      </div>
      <div v-else class="rating-btns">
        <button class="rate again" @click="rate(1)">忘记</button>
        <button class="rate hard" @click="rate(2)">模糊</button>
        <button class="rate good" @click="rate(3)">认识</button>
        <button class="rate easy" @click="rate(4)">轻松</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import { wrongAPI } from '@/api'

const subjectLabel = (s) => ({ reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }[s] || s || '阅读')

const loading = ref(true)
const queue = ref([])
const index = ref(0)
const selected = ref(null)
const revealed = ref(false)
const isCorrect = ref(false)

const current = computed(() => queue.value[index.value] || {})

const parseOptions = (opts) => {
  if (!opts) return []
  let arr = opts
  if (typeof opts === 'string') { try { arr = JSON.parse(opts) } catch (_) { return [] } }
  if (!Array.isArray(arr)) return []
  return arr.map((o, i) => {
    if (o && typeof o === 'object') return { label: o.label || String.fromCharCode(65 + i), text: o.text || '' }
    return { label: String.fromCharCode(65 + i), text: String(o) }
  }).filter(o => o.text !== '')
}

const parsedOptions = computed(() => parseOptions(current.value.options))

const answerLabels = computed(() => {
  const a = current.value.answer
  if (Array.isArray(a)) return a.map(String).map(s => s.trim()).filter(Boolean)
  return String(a || '').match(/[A-F]/g) || []
})
const isInAnswer = (label) => answerLabels.value.includes(label)
const feedbackText = computed(() => {
  if (isCorrect.value) return '回答正确！'
  const right = answerLabels.value.join(', ')
  return `回答错误，正确答案是 ${right}`
})

const selectOption = (label) => {
  if (revealed.value) return
  selected.value = label
}

const submitAnswer = () => {
  isCorrect.value = isInAnswer(selected.value)
  revealed.value = true
}

const rate = async (rating) => {
  try {
    await wrongAPI.submitReview(current.value.wrongId, rating)
    selected.value = null
    revealed.value = false
    if (index.value + 1 < queue.value.length) {
      index.value++
    } else {
      await fetchQueue()
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  }
}

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await wrongAPI.reviewPlan()
    queue.value = res.data?.data?.list || []
    index.value = 0
    selected.value = null
    revealed.value = false
  } catch (e) {
    queue.value = []
    ElMessage.error(e?._userMessage || '加载复习队列失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchQueue)
</script>

<style scoped>
.review-page { max-width: 680px; margin: 0 auto; padding: 16px; min-height: 100vh; display: flex; flex-direction: column; }
.review-top { display: flex; align-items: center; justify-content: space-between; }
.progress { color: var(--text-secondary); font-size: 14px; }
.center, .done { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 60vh; }
.done-text { color: var(--text-secondary); }
.card-wrap { flex: 1; display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
.q-card { border: 1px solid var(--border); border-radius: 14px; padding: 18px 16px; background: var(--card-bg); }
.passage { font-size: 13px; color: var(--text-secondary); line-height: 1.6; max-height: 180px; overflow-y: auto; background: var(--bg); padding: 10px; border-radius: 8px; margin: 10px 0; }
.q-text { font-size: 15px; font-weight: 500; margin: 12px 0; line-height: 1.7; }
.options { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.option { padding: 11px 14px; border: 1px solid var(--border); border-radius: 9px; cursor: pointer; font-size: 14px; line-height: 1.5; transition: all 0.12s; }
.option.selected { border-color: var(--primary); background: rgba(74,144,217,0.05); }
.option.correct { border-color: #67c23a; background: #f0f9eb; }
.option.wrong { border-color: #f56c6c; background: #fef0f0; }
.opt-letter { font-weight: 700; }
.feedback { margin-top: 14px; }
.action { display: flex; justify-content: flex-end; }
.rating-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.rate { height: 48px; border-radius: 12px; border: 1px solid var(--border); cursor: pointer; font-size: 15px; font-weight: 600; background: var(--card-bg); }
.rate.again { background: #fdecea; color: #d43030; }
.rate.hard { background: #fff4e6; color: #e8861a; }
.rate.good { background: #eaf7ea; color: #149033; }
.rate.easy { background: #e8f2ff; color: #2563eb; }
</style>
