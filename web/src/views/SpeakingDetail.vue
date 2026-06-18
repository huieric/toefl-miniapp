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

      <!-- 倒计时区域 -->
      <div class="timer-section" v-if="!submitted">
        <div class="phase-indicator">
          <el-tag :type="phase === 'prep' ? 'warning' : 'success'" size="large">
            {{ phase === 'prep' ? '准备阶段' : phase === 'response' ? '回答阶段' : '准备开始' }}
          </el-tag>
          <span class="countdown" :class="{ urgent: phaseTime <= 5 }">
            {{ formatTime(phaseTime) }}
          </span>
        </div>
        <el-progress
          :percentage="timerProgress"
          :color="phase === 'prep' ? '#e6a23c' : '#67c23a'"
          :show-text="false"
          :stroke-width="6"
        />
      </div>

      <!-- 录音区域 -->
      <div class="recorder-section" v-if="!submitted">
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
            :disabled="phase !== 'response'"
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

        <p class="phase-hint" v-if="phase === 'idle'">点击下方按钮开始准备</p>
        <p class="phase-hint" v-if="phase === 'prep'">阅读题目，组织你的回答...</p>
        <p class="phase-hint" v-if="phase === 'response' && !isRecording && !audioBlob">开始录音回答</p>

        <div class="playback" v-if="audioUrl && !isRecording">
          <audio :src="audioUrl" controls ref="playbackRef" />
          <el-button size="small" @click="reRecord" style="margin-top: 8px;">重新录制</el-button>
        </div>

        <!-- 文字转写输入（录音备选方案，用于 AI 评分） -->
        <div class="transcript-section" v-if="audioBlob">
          <el-divider content-position="left">文字转写（用于 AI 评分）</el-divider>
          <el-input
            v-model="transcript"
            type="textarea"
            :rows="4"
            placeholder="请输入你的口语回答文字稿，AI 将基于此进行评分。如果无法录音，也可直接在此输入回答内容。"
          />
          <p class="transcript-hint">提示：AI 评分基于文字内容分析，请如实转写你的录音内容。</p>
        </div>

        <div class="start-controls" v-if="phase === 'idle'">
          <el-button type="primary" size="large" @click="startPrep">
            开始答题 (15s 准备 + 45s 回答)
          </el-button>
        </div>
      </div>

      <div class="action-bar" v-if="!submitted">
        <el-button
          type="primary"
          :disabled="!transcript.trim()"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交评分
        </el-button>
      </div>

      <!-- AI 评分结果 -->
      <div class="ai-result" v-if="aiResult">
        <el-divider />
        <h4>AI 评分结果</h4>

        <div class="score-overview">
          <div class="total-score">
            <span class="score-num">{{ aiResult.score || '--' }}</span>
            <span class="score-max">/ 30</span>
          </div>
          <el-tag :type="getScoreTag(aiResult.score)" size="large">{{ getScoreLabel(aiResult.score) }}</el-tag>
        </div>

        <div class="score-details" v-if="aiResult.detail">
          <div class="detail-item">
            <span class="detail-label">语言表达 Delivery</span>
            <el-progress :percentage="getPct(aiResult.detail.delivery)" :color="'#409eff'" />
            <span class="detail-score">{{ aiResult.detail.delivery || '--' }}/30</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">语言运用 Language Use</span>
            <el-progress :percentage="getPct(aiResult.detail.languageUse)" :color="'#67c23a'" />
            <span class="detail-score">{{ aiResult.detail.languageUse || '--' }}/30</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">话题展开 Topic Development</span>
            <el-progress :percentage="getPct(aiResult.detail.topicDevelopment)" :color="'#e6a23c'" />
            <span class="detail-score">{{ aiResult.detail.topicDevelopment || '--' }}/30</span>
          </div>
        </div>

        <div class="feedback-block" v-if="aiResult.feedback">
          <h5>反馈</h5>
          <p>{{ aiResult.feedback }}</p>
        </div>

        <div class="suggestions-block" v-if="aiResult.suggestions && aiResult.suggestions.length">
          <h5>改进建议</h5>
          <ul>
            <li v-for="(s, i) in aiResult.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>

        <div class="action-bar" style="margin-top: 20px;">
          <el-button @click="$router.back()">返回列表</el-button>
          <el-button type="primary" @click="reset">再练一次</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Microphone, VideoPause } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI } from '@/api'

const route = useRoute()
const question = ref(null)
const loading = ref(false)
const submitting = ref(false)
const submitted = ref(false)

// 录音相关
const isRecording = ref(false)
const recordTime = ref(0)
const audioBlob = ref(null)
const audioUrl = ref(null)
const transcript = ref('')
let mediaRecorder = null
let stream = null
let recordTimer = null

// 倒计时相关
const phase = ref('idle') // idle | prep | response | done
const phaseTime = ref(0)
const PREP_TIME = 15
const RESPONSE_TIME = 45
let phaseTimer = null

const timerProgress = computed(() => {
  if (phase.value === 'prep') return ((PREP_TIME - phaseTime.value) / PREP_TIME) * 100
  if (phase.value === 'response') return ((RESPONSE_TIME - phaseTime.value) / RESPONSE_TIME) * 100
  return 0
})

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const startPrep = () => {
  phase.value = 'prep'
  phaseTime.value = PREP_TIME
  phaseTimer = setInterval(() => {
    phaseTime.value--
    if (phaseTime.value <= 0) {
      clearInterval(phaseTimer)
      startResponse()
    }
  }, 1000)
}

const startResponse = () => {
  phase.value = 'response'
  phaseTime.value = RESPONSE_TIME
  // 自动开始录音
  startRecord()
  phaseTimer = setInterval(() => {
    phaseTime.value--
    if (phaseTime.value <= 0) {
      clearInterval(phaseTimer)
      if (isRecording.value) stopRecord()
      phase.value = 'done'
    }
  }, 1000)
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
    ElMessage.warning('无法访问麦克风，你可以直接在文字转写区输入回答内容')
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
  transcript.value = ''
}

const handleSubmit = async () => {
  if (submitted.value || submitting.value) return
  if (!transcript.value.trim()) {
    ElMessage.warning('请输入口语回答的文字稿用于 AI 评分')
    return
  }
  submitting.value = true
  try {
    const res = await practiceAPI.submit({
      questionId: question.value?._id || question.value?.id,
      subject: 'speaking',
      content: transcript.value,
      timeSpent: recordTime.value,
    })
    submitted.value = true
    aiResult.value = res.data?.data?.result || res.data?.result || res.data?.data || {
      score: 20,
      detail: { delivery: 20, languageUse: 20, topicDevelopment: 20 },
      feedback: '系统评分服务暂不可用，已给出默认分数。请稍后重试。',
      suggestions: ['请检查网络连接后重试 AI 评分'],
    }
    if (phaseTimer) clearInterval(phaseTimer)
  } catch (e) {
    ElMessage.error('提交失败: ' + (e.response?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const aiResult = ref(null)

const reset = () => {
  submitted.value = false
  aiResult.value = null
  transcript.value = ''
  audioBlob.value = null
  audioUrl.value = null
  phase.value = 'idle'
  phaseTime.value = 0
  recordTime.value = 0
}

const getPct = (score) => Math.round(((score || 0) / 30) * 100)

const getScoreTag = (score) => {
  if (score >= 25) return 'success'
  if (score >= 18) return 'warning'
  return 'danger'
}

const getScoreLabel = (score) => {
  if (score >= 25) return '优秀'
  if (score >= 20) return '良好'
  if (score >= 15) return '中等'
  return '需提升'
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
  if (phaseTimer) clearInterval(phaseTimer)
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<style scoped>
.question-block { margin-bottom: 24px; }
.question-text { font-size: 15px; font-weight: 500; margin-bottom: 8px; line-height: 1.7; }
.question-hint { font-size: 13px; color: var(--text-secondary); }

.timer-section { margin-bottom: 20px; }
.phase-indicator {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.countdown {
  font-size: 28px; font-weight: bold; color: var(--text);
  font-variant-numeric: tabular-nums;
}
.countdown.urgent { color: var(--danger); }

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
.phase-hint { font-size: 14px; color: var(--text-secondary); margin: 8px 0; }
.playback { display: flex; flex-direction: column; align-items: center; }
.start-controls { margin-top: 16px; }

.transcript-section { width: 100%; margin-top: 16px; }
.transcript-hint { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }

.action-bar { display: flex; justify-content: center; gap: 12px; }

.ai-result { margin-top: 8px; }
.ai-result h4 { font-size: 16px; margin-bottom: 16px; }
.score-overview {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-bottom: 24px;
}
.total-score { display: flex; align-items: baseline; gap: 4px; }
.score-num { font-size: 48px; font-weight: bold; color: var(--primary); }
.score-max { font-size: 18px; color: var(--text-secondary); }

.score-details { margin-bottom: 24px; }
.detail-item {
  display: grid; grid-template-columns: 180px 1fr 60px;
  align-items: center; gap: 12px; margin-bottom: 12px;
}
.detail-label { font-size: 14px; font-weight: 500; }
.detail-score { font-size: 14px; color: var(--text-secondary); text-align: right; }

.feedback-block, .suggestions-block { margin-bottom: 16px; }
.feedback-block h5, .suggestions-block h5 { font-size: 14px; margin-bottom: 8px; }
.feedback-block p { font-size: 14px; line-height: 1.6; }
.suggestions-block ul { padding-left: 20px; }
.suggestions-block li { font-size: 14px; line-height: 1.8; }

.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
</style>
