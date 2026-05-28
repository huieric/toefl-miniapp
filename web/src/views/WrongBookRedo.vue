<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/wrong-book')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>重做错题</h2>
    </div>

    <div class="card" v-if="questions.length">
      <div class="progress-bar">
        <span>第 {{ currentIdx + 1 }} / {{ questions.length }} 题</span>
        <el-progress :percentage="Math.round((currentIdx + 1) / questions.length * 100)" :stroke-width="6" style="width: 120px;" />
      </div>

      <div class="question-block" v-if="currentQ">
        <el-tag size="small">{{ subjectMap[currentQ.subject] }}</el-tag>
        <p class="q-text">{{ currentQ.question || currentQ.stem }}</p>

        <el-radio-group v-model="selected" class="options-group" size="large">
          <div v-for="(opt, idx) in getOptions(currentQ)" :key="idx" class="option-item" :class="{ selected: selected === idx }">
            <el-radio :value="idx">
              <span class="opt-letter">{{ letters[idx] }}.</span> {{ opt }}
            </el-radio>
          </div>
        </el-radio-group>

        <div class="result-feedback" v-if="showResult">
          <el-alert
            :title="isCorrect ? '回答正确！' : `回答错误，正确答案是 ${letters[currentQ.answer]}`"
            :type="isCorrect ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <div class="action-bar">
        <el-button :disabled="selected === null || showResult" type="primary" @click="checkAnswer">提交</el-button>
        <el-button v-if="showResult && currentIdx < questions.length - 1" @click="nextQuestion">下一题</el-button>
        <el-button v-if="showResult && currentIdx === questions.length - 1" type="success" @click="$router.push('/wrong-book')">完成</el-button>
      </div>
    </div>

    <div class="card" v-else>
      <el-empty description="没有待复习的错题">
        <el-button type="primary" @click="$router.push('/reading')">去练习</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { wrongAPI, practiceAPI } from '@/api'

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
const letters = ['A', 'B', 'C', 'D', 'E', 'F']

const questions = ref([])
const currentIdx = ref(0)
const selected = ref(null)
const showResult = ref(false)
const isCorrect = ref(false)
const results = ref([])

const currentQ = computed(() => questions.value[currentIdx.value] || null)

const getOptions = (q) => {
  const opts = q?.options
  if (Array.isArray(opts)) return opts
  if (typeof opts === 'object') return [opts?.A, opts?.B, opts?.C, opts?.D, opts?.E, opts?.F].filter(Boolean)
  return []
}

const checkAnswer = async () => {
  const q = currentQ.value
  const answer = letters[selected.value]
  const correct = typeof q.answer === 'number' ? letters[q.answer] : q.answer
  isCorrect.value = answer === correct
  showResult.value = true
  results.value.push({
    questionId: q._id || q.id,
    userAnswer: answer,
    isCorrect: isCorrect.value,
  })

  try {
    await practiceAPI.submit({
      questionId: q._id || q.id,
      subject: q.subject,
      userAnswer: answer,
      isCorrect: isCorrect.value,
    })
  } catch (e) { console.error(e) }
}

const nextQuestion = () => {
  currentIdx.value++
  selected.value = null
  showResult.value = false
}

onMounted(async () => {
  try {
    const res = await wrongAPI.redo()
    questions.value = res.data?.list || res.data?.questions || res.data || []
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.progress-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.question-block { margin-bottom: 20px; }
.q-text { font-size: 15px; font-weight: 500; margin: 12px 0; line-height: 1.7; }
.options-group { width: 100%; }
.option-item {
  padding: 10px 14px; margin-bottom: 8px;
  border: 1px solid var(--border); border-radius: 8px;
}
.option-item.selected { border-color: var(--primary); background: rgba(74,144,217,0.04); }
.opt-letter { font-weight: 700; }
.result-feedback { margin-top: 16px; }
.action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
</style>