<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '听力理解' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <!-- Audio -->
      <AudioPlayer v-if="question?.audioUrl" :src="question.audioUrl" />

      <!-- 无录音材料时提供 TTS 朗读 -->
      <el-button
        v-if="!question?.audioUrl && question?.passageText"
        size="small"
        style="margin-bottom: 8px"
        @click="speakTranscript"
      >
        {{ speaking ? '⏹ 停止朗读' : '🔊 朗读原文（TTS）' }}
      </el-button>

      <!-- Transcript -->
      <div class="transcript" v-if="question?.passageText">
        <h4>听力原文（点击生词加入生词本）</h4>
        <p class="transcript-text">
          <span
            v-for="(w, wi) in splitWords(question.passageText)"
            :key="wi"
            class="vocab-word"
            v-text="w + ' '"
            @click="onWordClick(w, question.passageText)"
          ></span>
        </p>
      </div>

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

      <el-alert
        v-if="submitted"
        :title="resultText"
        :type="isCorrect ? 'success' : 'error'"
        :closable="false"
        show-icon
        class="result-alert"
      />
    </div>

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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI, vocabAPI } from '@/api'
import AudioPlayer from '@/components/AudioPlayer.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const router = useRouter()
const question = ref(null)
const selected = ref(null)
const submitted = ref(false)
const isCorrect = ref(false)
const loading = ref(false)
const timeLimit = ref(900)

// TTS 朗读原文（无录音材料时的兜底）
const speaking = ref(false)
const speakTranscript = () => {
  const text = question.value?.passageText
  if (!text) return ElMessage.warning('该题没有原文')
  if (!('speechSynthesis' in window)) return ElMessage.warning('当前浏览器不支持语音朗读')
  if (speaking.value) {
    window.speechSynthesis.cancel()
    speaking.value = false
    return
  }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.95
  u.onend = () => { speaking.value = false }
  u.onerror = () => { speaking.value = false }
  window.speechSynthesis.speak(u)
  speaking.value = true
}

// —— 生词本：点击原文生词加入 ——
const vocabDialog = ref(false)
const selectedWord = ref('')
const selectedContext = ref('')
const selectedPhonetic = ref('')
const selectedMeaning = ref('')
const looking = ref(false)
const splitWords = (t) => String(t || '').split(/\s+/).filter(Boolean)
const cleanWord = (w) => String(w || '').replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '')
const sentenceOf = (t, word) => {
  const w = word.toLowerCase()
  const sentences = String(t || '').split(/(?<=[.!?])\s+/)
  return sentences.find((s) => s.toLowerCase().includes(w)) || t
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
const onWordClick = (raw, text) => {
  const word = cleanWord(raw)
  if (!/^[A-Za-z'-]{2,}$/.test(word)) return
  selectedWord.value = word
  selectedContext.value = sentenceOf(text, word)
  vocabDialog.value = true
  lookupWord(word)
}
const addToVocab = async () => {
  try {
    await vocabAPI.add({
      word: selectedWord.value,
      meaning: selectedMeaning.value,
      context: selectedContext.value,
      subject: 'listening',
      questionId: question.value?.id || question.value?._id || null,
    })
    ElMessage.success(`「${selectedWord.value}」已加入生词本`)
    vocabDialog.value = false
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加入失败')
  }
}

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
      subject: 'listening',
      userAnswer: answer,
      isCorrect: isCorrect.value,
    })
  } catch (e) { console.error(e) }

  setTimeout(() => {
    router.push(`/listening/${route.params.id}/result`)
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
.transcript {
  margin: 16px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.7;
}
.transcript h4 { font-size: 14px; margin-bottom: 8px; }
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

.transcript-text { margin: 0; }
.vocab-word { cursor: pointer; border-radius: 3px; transition: background 0.12s ease; }
.vocab-word:hover { background: #fff3bf; }
.vocab-pick-word { font-size: 22px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: baseline; }
.vocab-phonetic { margin-left: 8px; font-size: 14px; font-weight: 400; color: var(--text-secondary); }
.vocab-looking { font-size: 13px; color: #999; margin: 6px 0; }
.vocab-meaning { font-size: 14px; color: var(--text-primary); line-height: 1.6; margin: 6px 0; }
.vocab-meaning-empty { color: #bbb; }
.vocab-pick-context { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
</style>