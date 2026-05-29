<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '口语练习' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <div class="question-block" v-if="question">
        <h4>题目</h4>
        <p class="question-text">{{ question.content || question.question || question.stem }}</p>
        <p class="question-hint" v-if="question.hint">提示：{{ question.hint }}</p>
      </div>

      <!-- Recording -->
      <div class="recorder-section">
        <div class="record-status" v-if="isRecording">
          <el-icon :size="20" class="blink"><Microphone /></el-icon>
          <span>录音中... {{ formatTime(recordTime) }}</span>
        </div>

        <div class="record-buttons">
          <el-button
            v-if="!isRecording && !audioBlob"
            type="primary"
            :icon="Microphone"
            circle
            size="large"
            @click="startRecord"
          />
          <el-button
            v-if="isRecording"
            type="danger"
            :icon="VideoPause"
            circle
            size="large"
            @click="stopRecord"
          />
        </div>

        <div class="playback" v-if="audioUrl && !isRecording">
          <audio :src="audioUrl" controls ref="playbackRef" />
          <el-button size="small" @click="reRecord" style="margin-top: 8px;">重新录制</el-button>
        </div>
      </div>

      <div class="action-bar">
        <el-button type="primary" :disabled="!audioBlob" @click="handleSubmit">
          提交录音
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Microphone, VideoPause } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI } from '@/api'

const route = useRoute()
const question = ref(null)
const loading = ref(false)

const isRecording = ref(false)
const recordTime = ref(0)
const audioBlob = ref(null)
const audioUrl = ref(null)
const playbackRef = ref(null)

let mediaRecorder = null
let stream = null
let recordTimer = null

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const startRecord = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    const chunks = []
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(chunks, { type: 'audio/webm' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)
    }
    mediaRecorder.start()
    isRecording.value = true
    recordTime.value = 0
    recordTimer = setInterval(() => { recordTime.value++ }, 1000)
  } catch (e) {
    ElMessage.error('无法访问麦克风')
    console.error(e)
  }
}

const stopRecord = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  clearInterval(recordTimer)
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
  }
}

const reRecord = () => {
  audioBlob.value = null
  audioUrl.value = null
}

const handleSubmit = async () => {
  try {
    await practiceAPI.submit({
      questionId: question.value?._id || question.value?.id,
      subject: 'speaking',
    })
    ElMessage.success('已提交')
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getById(route.params.id)
    question.value = res.data?.data || res.data || {}
  } catch (e) { ElMessage.error('加载题目失败') }
  finally { loading.value = false }
})

onBeforeUnmount(() => {
  stopRecord()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<style scoped>
.question-block { margin-bottom: 24px; }
.question-text { font-size: 15px; font-weight: 500; margin-bottom: 8px; }
.question-hint { font-size: 13px; color: var(--text-secondary); }
.recorder-section {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px; margin-bottom: 24px;
  background: #f9fafb; border-radius: 12px;
}
.record-status {
  display: flex; align-items: center; gap: 8px;
  color: var(--danger); font-size: 15px; margin-bottom: 16px;
}
.record-buttons { margin-bottom: 12px; }
.playback { display: flex; flex-direction: column; align-items: center; }
.action-bar { display: flex; justify-content: center; }
.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
</style>