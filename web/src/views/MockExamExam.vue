<template>
  <div class="page-container">
    <div class="page-header">
      <h2>模拟考试</h2>
    </div>

    <div class="card">
      <!-- Progress -->
      <div class="exam-progress">
        <span>第 {{ currentIdx + 1 }} / {{ questions.length }} 题</span>
        <span class="subject-tag">
          <el-tag>{{ subjectMap[currentSubject] }}</el-tag>
        </span>
        <CountdownTimer :seconds="timeLeft" :running="!finished" @timeout="onTimeout" />
      </div>

      <el-steps :active="currentSubjectIdx" finish-status="success" align-center style="margin-bottom: 20px;">
        <el-step title="阅读" />
        <el-step title="听力" />
        <el-step title="口语" />
        <el-step title="写作" />
      </el-steps>

      <el-progress :percentage="Math.round((currentIdx + 1) / questions.length * 100)" :stroke-width="6" />

      <!-- Question -->
      <div v-if="currentQuestion" class="question-area">
        <div class="question-stem">
          <span class="q-num">{{ currentIdx + 1 }}.</span>
          {{ currentQuestion.question || currentQuestion.stem }}
        </div>

        <div v-if="currentSubject === 'listening' && currentQuestion.audioUrl">
          <AudioPlayer :src="currentQuestion.audioUrl" />
        </div>

        <el-radio-group v-model="answers[currentIdx]" v-if="isChoiceSubject" class="options-group" size="large">
          <div v-for="(opt, idx) in getOptions(currentQuestion)" :key="idx" class="option-item" :class="{ selected: answers[currentIdx] === idx }">
            <el-radio :value="idx">
              <span class="opt-letter">{{ letters[idx] }}.</span> {{ opt }}
            </el-radio>
          </div>
        </el-radio-group>

        <div v-if="currentSubject === 'speaking'" class="record-area">
          <p class="hint-text">请录制你的回答（45秒）</p>
          <el-button type="primary" :icon="Microphone" circle @click="toggleRecord" />
        </div>

        <div v-if="currentSubject === 'writing'" class="write-area">
          <el-input v-model="essayContent" type="textarea" :rows="12" placeholder="输入你的作文..." />
        </div>
      </div>

      <div class="exam-actions">
        <el-button v-if="currentIdx > 0" @click="currentIdx--">上一题</el-button>
        <el-button v-if="currentIdx < questions.length - 1" type="primary" @click="currentIdx++">下一题</el-button>
        <el-button v-if="currentIdx === questions.length - 1" type="success" @click="submitExam" :loading="submitting">
          交卷
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Microphone } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examAPI, questionAPI } from '@/api'
import CountdownTimer from '@/components/CountdownTimer.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'

const route = useRoute()
const router = useRouter()

const questions = ref([])
const answers = ref([])
const essayContent = ref('')
const currentIdx = ref(0)
const timeLeft = ref(7200)
const finished = ref(false)
const submitting = ref(false)

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
const subjectOrder = ['reading', 'listening', 'speaking', 'writing']

const currentQuestion = computed(() => questions.value[currentIdx.value] || null)
const currentSubject = computed(() => currentQuestion.value?.subject || 'reading')
const currentSubjectIdx = computed(() => subjectOrder.indexOf(currentSubject.value))
const isChoiceSubject = computed(() => ['reading', 'listening'].includes(currentSubject.value))

const getOptions = (q) => {
  const opts = q?.options
  if (Array.isArray(opts)) return opts
  if (typeof opts === 'object') return [opts?.A, opts?.B, opts?.C, opts?.D, opts?.E, opts?.F].filter(Boolean)
  return []
}

const toggleRecord = () => { ElMessage.info('录音功能开发中') }

const onTimeout = () => {
  ElMessage.warning('考试时间到，自动交卷')
  submitExam()
}

const submitExam = async () => {
  try {
    await ElMessageBox.confirm('确认提交试卷？交卷后将无法修改', '交卷确认', { type: 'warning' })
  } catch { return }

  submitting.value = true
  finished.value = true
  try {
    const res = await examAPI.submit(route.params.id, {
      answers: answers.value.map((a, i) => ({
        questionId: questions.value[i]?._id || questions.value[i]?.id,
        answer: isNaN(a) ? a : letters[a],
      })),
      essay: essayContent.value,
    })
    const resultId = res.data?.result?._id || res.data?._id || route.params.id
    router.replace(`/mock-exam/${resultId}/result`)
  } catch (e) {
    finished.value = false
    ElMessage.error('交卷失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await examAPI.result(route.params.id)
    const exam = res.data?.exam || res.data || {}
    if (exam.questions?.length) {
      questions.value = exam.questions
      answers.value = new Array(exam.questions.length).fill(null)
      timeLeft.value = exam.timeLimit || 7200
    }
    if (exam.finished) {
      router.replace(`/mock-exam/${route.params.id}/result`)
    }
  } catch (e) {
    // fallback: load all subjects
    try {
      const subs = await Promise.all(
        subjectOrder.map(s => questionAPI.getBySubject(s, { limit: 3 }))
      )
      let all = []
      subs.forEach((r, i) => {
        const items = (r.data?.list || r.data?.questions || r.data || [])
          .map(q => ({ ...q, subject: subjectOrder[i] }))
        all = all.concat(items.slice(0, 3))
      })
      questions.value = all
      answers.value = new Array(all.length).fill(null)
    } catch (e2) { console.error(e2) }
  }
})
</script>

<style scoped>
.exam-progress {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.subject-tag { font-size: 13px; }
.question-area { margin: 24px 0; }
.question-stem { font-size: 15px; font-weight: 500; margin-bottom: 16px; line-height: 1.7; }
.q-num { font-weight: 700; color: var(--primary); }
.options-group { width: 100%; }
.option-item {
  padding: 10px 14px; margin-bottom: 8px;
  border: 1px solid var(--border); border-radius: 8px;
}
.option-item.selected { border-color: var(--primary); background: rgba(74,144,217,0.04); }
.opt-letter { font-weight: 700; }
.record-area, .write-area { padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center; }
.hint-text { margin-bottom: 12px; color: var(--text-secondary); font-size: 14px; }
.exam-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
</style>