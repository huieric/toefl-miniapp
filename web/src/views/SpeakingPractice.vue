<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/speaking')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>🎤 AI 口语陪练</h2>
      <div class="progress-stats" v-if="questions.length">
        <span>第 {{ current + 1 }} / {{ questions.length }} 题</span>
        <el-progress :percentage="progressPct" :stroke-width="3" style="width:160px;vertical-align:middle" />
      </div>
    </div>

    <div class="card" v-loading="loading">
      <!-- 题目展示 -->
      <div class="question-block" v-if="questions[current] && !submitted">
        <div class="question-badge" v-if="questions[current].hint">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ questions[current].hint }}</span>
        </div>
        <h4>题目</h4>
        <div class="question-content">{{ questions[current].content }}</div>
      </div>

      <!-- 答题区域 -->
      <div class="practice-area" v-if="questions[current] && !submitted">
        <div class="prep-section">
          <el-button type="primary" size="large" @click="startAnswering" :icon="Microphone">
            开始答题 (准备 15s + 回答 45s)
          </el-button>
        </div>

        <!-- 倒计时 -->
        <div class="timer-section" v-if="phase !== 'idle' && !submitted">
          <div class="phase-indicator">
            <el-tag :type="phase === 'prep' ? 'warning' : 'success'" size="large">
              {{ phase === 'prep' ? '📋 准备阶段' : '🎤 回答阶段' }}
            </el-tag>
            <span class="countdown" :class="{ urgent: phaseTime <= 5 }">
              {{ formatTime(phaseTime) }}
            </span>
          </div>
          <el-progress
            :percentage="timerProgress"
            :color="phase === 'prep' ? '#FF8A2A' : '#23B26D'"
            :show-text="false"
            :stroke-width="4"
          />
        </div>

        <!-- 录音区域（波形 + 音量） -->
        <div class="recorder-section" v-if="!submitted && phase !== 'idle'">
          <!-- 波形可视化 -->
          <div class="waveform-container" v-if="isRecording && canvasRef">
            <canvas ref="canvasRef" class="waveform-canvas" width="600" height="120"></canvas>
            <div class="waveform-label">🎙️ 实时波形</div>
          </div>

          <!-- 音量指示器 -->
          <div class="volume-meter" v-if="isRecording || audioUrl">
            <span class="volume-label">🔊 音量</span>
            <div class="volume-bar-bg">
              <div class="volume-bar-fill" :style="{ width: volumeLevel + '%', background: volumeColor }"></div>
            </div>
            <span class="volume-pct">{{ Math.round(volumeLevel) }}%</span>
          </div>

          <!-- 录音状态 -->
          <div class="record-status" v-if="isRecording">
            <el-icon :size="24" class="blink"><Microphone /></el-icon>
            <span>录音中... {{ formatTime(recordTime) }}</span>
          </div>

          <!-- 录音控制按钮 -->
          <div class="record-buttons">
            <el-button
              v-if="!isRecording && !audioBlob && phase === 'response'"
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

          <!-- 录音回放 -->
          <div class="playback" v-if="audioUrl && !isRecording">
            <audio :src="audioUrl" controls />
            <el-button size="small" @click="reRecord" style="margin-top: 8px;">🔄 重新录制</el-button>
          </div>

          <!-- 文字输入 -->
          <div class="text-input-section">
            <el-input
              v-model="transcript"
              type="textarea"
              :rows="4"
              placeholder="请输入你的口语回答（可录音后转写或直接输入）"
            />
          </div>

          <div class="submit-btn" v-if="!isRecording && (transcript.trim() || audioUrl)">
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              提交评分 ✨
            </el-button>
          </div>
        </div>
      </div>

      <!-- AI 评分结果 -->
      <div class="score-result" v-if="aiResult && !nextPending">
        <el-divider content-position="left">📊 AI 评分结果</el-divider>

        <div class="score-overview">
          <div class="total-score">
            <span class="score-num">{{ aiResult.score || '--' }}</span>
            <span class="score-max">/ 30</span>
          </div>
          <el-tag :type="getScoreTag(aiResult.score)" size="large">{{ getScoreLabel(aiResult.score) }}</el-tag>
        </div>

        <!-- 三维度评分 -->
        <div class="score-details">
          <div class="detail-item">
            <span class="detail-label">🗣️ Delivery 表达流利</span>
            <el-progress :percentage="getPct(aiResult.delivery)" :color="'#409eff'" />
            <span class="detail-score">{{ aiResult.delivery || '--' }}/5</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">📚 Language Use 语言运用</span>
            <el-progress :percentage="getPct(aiResult.languageUse)" :color="'#23B26D'" />
            <span class="detail-score">{{ aiResult.languageUse || '--' }}/5</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">💡 Topic Development 话题展开</span>
            <el-progress :percentage="getPct(aiResult.topicDevelopment)" :color="'#FF8A2A'" />
            <span class="detail-score">{{ aiResult.topicDevelopment || '--' }}/5</span>
          </div>
        </div>

        <!-- 反馈和建议 -->
        <div class="feedback-section">
          <h4>📝 反馈</h4>
          <p class="feedback-text">{{ aiResult.feedback }}</p>
        </div>

        <div class="feedback-section" v-if="aiResult.highlights?.length">
          <h4>✨ 亮点</h4>
          <ul class="highlight-list">
            <li v-for="(h, i) in aiResult.highlights" :key="i">{{ h }}</li>
          </ul>
        </div>

        <div class="feedback-section" v-if="aiResult.suggestions?.length">
          <h4>💡 改进建议</h4>
          <ul class="suggestion-list">
            <li v-for="(s, i) in aiResult.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>

        <div class="feedback-section" v-if="aiResult.sampleAnswer">
          <h4>📖 参考高分回答</h4>
          <div class="sample-answer">{{ aiResult.sampleAnswer }}</div>
        </div>

        <!-- 下一题按钮 -->
        <div class="next-actions" v-if="current < questions.length - 1">
          <el-button type="primary" size="large" @click="nextQuestion">
            下一题 → (第 {{ current + 2 }} 题)
          </el-button>
          <el-button @click="finishPractice" style="margin-left: 10px;">
            完成练习 🎉
          </el-button>
        </div>
        <div class="next-actions" v-else>
          <el-button type="success" size="large" @click="finishPractice">
            练习完成！🎉 查看总结果
          </el-button>
        </div>
      </div>
    </div>

    <!-- 练习完成弹窗 -->
    <el-dialog v-model="showComplete" title="🎉 练习完成" width="500px">
      <div class="complete-summary">
        <div class="big-score">{{ avgScore }}</div>
        <p>平均得分：{{ avgScore }} / 30</p>
        <p>完成题目：{{ completedCount }} / {{ questions.length }}</p>
        <p v-if="avgScore >= 24" class="excellent">🏆 优秀！保持水准！</p>
        <p v-else-if="avgScore >= 20" class="good">👍 良好！继续加油！</p>
        <p v-else class="improve">📚 还需努力，多练多进步！</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="$router.push('/speaking')">返回列表</el-button>
        <el-button @click="startNewPractice">再来一组</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ArrowLeft, Microphone, VideoPause, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiSpeakAPI } from '@/api'

// 题目列表
const questions = ref([])
const current = ref(0)
const loading = ref(false)

// 答题状态
const phase = ref('idle') // idle | prep | response | done
const phaseTime = ref(0)
const PREP_TIME = 15
const RESPONSE_TIME = 45
let phaseTimer = null

// 录音相关
const isRecording = ref(false)
const recordTime = ref(0)
const audioBlob = ref(null)
const audioUrl = ref(null)
const transcript = ref('')
let mediaRecorder = null
let stream = null
let recordTimer = null

// 波形可视化
const canvasRef = ref(null)
let audioContext = null
let analyser = null
let sourceNode = null
let animFrameId = null
const dataArray = ref(new Uint8Array(256))

// 音量
const volumeLevel = ref(0)
let volumeCheckInterval = null

// 提交和评分
const submitted = ref(false)
const submitting = ref(false)
const aiResult = ref(null)
const nextPending = ref(false)

// 完成状态
const completedCount = ref(0)
const allScores = ref([])
const showComplete = ref(false)
const avgScore = ref(0)

// 倒计时相关
const timerProgress = computed(() => {
  if (phase.value === 'prep') return ((PREP_TIME - phaseTime.value) / PREP_TIME) * 100
  if (phase.value === 'response') return ((RESPONSE_TIME - phaseTime.value) / RESPONSE_TIME) * 100
  return 0
})

const progressPct = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((current.value + (submitted.value ? 1 : 0)) / questions.value.length) * 100)
})

const volumeColor = computed(() => {
  const v = volumeLevel.value
  if (v < 20) return '#DCDFE6'
  if (v < 50) return '#409eff'
  if (v < 80) return '#23B26D'
  return '#67C23A'
})

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const difficultyLabel = (d) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[d] || d
}

const getPct = (val) => Math.round(((val || 0) / 5) * 100)

const getScoreTag = (score) => {
  if (score >= 24) return 'success'
  if (score >= 20) return ''
  return 'danger'
}

const getScoreLabel = (score) => {
  if (score >= 26) return '优秀 Excellent'
  if (score >= 24) return '良好 Good'
  if (score >= 20) return '及格 Fair'
  return '需改进'
}

// ========== 波形可视化 ==========
const drawWaveform = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!analyser) return

  analyser.getByteTimeDomainData(dataArray.value)
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, w, h)

  // 网格线
  ctx.strokeStyle = 'rgba(64, 158, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const y = (h / 4) * i
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()

  // 零线
  ctx.strokeStyle = 'rgba(64, 158, 255, 0.3)'
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()

  // 波形
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#409eff'
  ctx.shadowColor = '#409eff'
  ctx.shadowBlur = 6
  ctx.beginPath()

  const sliceWidth = w / dataArray.value.length
  let x = 0
  for (let i = 0; i < dataArray.value.length; i++) {
    const v = dataArray.value[i] / 128.0
    const y = (v * h) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  animFrameId = requestAnimationFrame(drawWaveform)
}

const startWaveform = (audioStream) => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8

    sourceNode = audioContext.createMediaStreamSource(audioStream)
    sourceNode.connect(analyser)

    // 更新音量
    volumeCheckInterval = setInterval(() => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        sum += Math.abs(data[i] - 128)
      }
      const avg = sum / data.length
      volumeLevel.value = Math.min(100, (avg / 60) * 100)
    }, 100)

    drawWaveform()
  } catch (e) {
    console.error('波形初始化失败:', e)
  }
}

const stopWaveform = () => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (volumeCheckInterval) {
    clearInterval(volumeCheckInterval)
    volumeCheckInterval = null
  }
  if (sourceNode) {
    sourceNode.disconnect()
    sourceNode = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  analyser = null
  volumeLevel.value = 0
}

// ========== 加载题目 ==========
const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await aiSpeakAPI.start({ difficulty: 'all', type: 'all' })
    questions.value = res.data?.questions || []
    if (!questions.value.length) {
      ElMessage.warning('暂无可用题目')
    }
  } catch (e) {
    ElMessage.error('加载题目失败: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

// ========== 开始答题 ==========
const startAnswering = () => {
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

// ========== 录音 ==========
const startRecord = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 启动波形可视化
    if (canvasRef.value) {
      startWaveform(stream)
    }

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
    ElMessage.warning('无法访问麦克风，可直接输入回答内容')
  }
}

const stopRecord = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  clearInterval(recordTimer)
  stopWaveform()
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

const reRecord = () => {
  audioBlob.value = null
  audioUrl.value = null
  transcript.value = ''
  recordTime.value = 0
}

// ========== 提交评分 ==========
const handleSubmit = async () => {
  if (submitting.value) return
  if (!transcript.value.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }
  submitting.value = true
  try {
    const q = questions.value[current.value]
    const res = await aiSpeakAPI.grade({
      answer: transcript.value,
      questionId: q.id,
      questionTitle: q.title,
      difficulty: q.difficulty,
      type: q.type,
    })
    const data = res.data?.data || res.data
    aiResult.value = data || {
      score: 20, delivery: 3, languageUse: 3, topicDevelopment: 3,
      feedback: '评分服务暂不可用',
      suggestions: ['请检查 AI 配置'],
      highlights: [],
    }
    submitted.value = true
    completedCount.value++
    allScores.value.push(aiResult.value.score || 20)
    if (aiResult.value.score) {
      avgScore.value = Math.round(allScores.value.reduce((a, b) => a + b, 0) / allScores.value.length)
    }
    ElMessage.success(`评分完成！得分: ${aiResult.value.score || '--'}`)
  } catch (e) {
    ElMessage.error('评分失败: ' + (e.response?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

// ========== 下一题 ==========
const nextQuestion = () => {
  current.value++
  resetAnswerState()
}

const resetAnswerState = () => {
  submitted.value = false
  phase.value = 'idle'
  phaseTime.value = 0
  transcript.value = ''
  audioBlob.value = null
  audioUrl.value = null
  aiResult.value = null
  recordTime.value = 0
  volumeLevel.value = 0
  stopWaveform()
  if (phaseTimer) clearInterval(phaseTimer)
}

// ========== 完成练习 ==========
const finishPractice = () => {
  showComplete.value = true
}

const startNewPractice = () => {
  showComplete.value = false
  current.value = 0
  completedCount.value = 0
  allScores.value = []
  avgScore.value = 0
  resetAnswerState()
  loadQuestions()
}

onBeforeUnmount(() => {
  if (phaseTimer) clearInterval(phaseTimer)
  if (recordTimer) clearInterval(recordTimer)
  stopWaveform()
  if (stream) stream.getTracks().forEach(t => t.stop())
})

loadQuestions()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.page-header h2 { margin: 0; }
.progress-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  margin-left: auto;
}

/* 题目 */
.question-block { margin-bottom: 20px; }
.question-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: #f0f9ff;
  border-radius: 6px; color: #409eff;
  font-size: 13px; margin-bottom: 12px;
}
.question-content {
  line-height: 1.7; font-size: 15px; white-space: pre-wrap;
}

/* 答题区域 */
.practice-area { margin-top: 20px; }

/* 倒计时 */
.timer-section { margin: 16px 0; }
.phase-indicator {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.countdown {
  font-size: 20px; font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.countdown.urgent {
  color: #F0544F; animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 录音 */
.recorder-section { text-align: center; margin: 20px 0; }

/* 波形可视化 */
.waveform-container {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 12px;
  margin: 16px 0;
  position: relative;
}
.waveform-canvas {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  display: block;
}
.waveform-label {
  text-align: center;
  color: #409eff;
  font-size: 13px;
  margin-top: 8px;
}

/* 音量指示器 */
.volume-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 8px;
}
.volume-label { font-size: 13px; white-space: nowrap; }
.volume-bar-bg {
  flex: 1;
  height: 10px;
  background: #e4e7ed;
  border-radius: 5px;
  overflow: hidden;
}
.volume-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.1s ease, background 0.3s ease;
}
.volume-pct { font-size: 13px; font-weight: 600; min-width: 36px; text-align: right; }

.record-status {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-bottom: 12px; font-size: 14px;
}
.blink { animation: blink 1s infinite; }
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.record-buttons { margin: 16px 0; }
.playback { margin: 16px 0; }
.playback audio { width: 100%; max-width: 400px; }
.text-input-section { margin: 16px 0; }
.submit-btn { margin: 16px 0; }

/* 评分结果 */
.score-result { margin-top: 20px; }
.score-overview {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; margin: 20px 0;
}
.total-score { display: flex; align-items: baseline; }
.score-num { font-size: 48px; font-weight: bold; color: #409eff; }
.score-max { font-size: 16px; color: #999; margin-left: 4px; }
.score-details { margin: 20px 0; }
.detail-item { margin-bottom: 12px; }
.detail-label {
  display: inline-block; width: 200px; font-size: 14px; font-weight: 500;
}
.detail-score { float: right; font-size: 13px; color: #666; }
.feedback-section { margin: 16px 0; }
.feedback-section h4 { margin: 0 0 8px; font-size: 15px; }
.feedback-text { line-height: 1.6; }
.highlight-list, .suggestion-list { padding-left: 20px; }
.highlight-list li { color: #23B26D; margin-bottom: 4px; }
.suggestion-list li { color: #FF8A2A; margin-bottom: 4px; }
.sample-answer {
  background: #f5f7fa; padding: 14px; border-radius: 8px;
  line-height: 1.7; font-size: 14px;
  border-left: 3px solid #409eff;
}
.next-actions { margin-top: 20px; text-align: center; }

/* 完成弹窗 */
.complete-summary { text-align: center; padding: 20px; }
.big-score { font-size: 64px; font-weight: bold; color: #409eff; }
.excellent { color: #23B26D; font-weight: bold; }
.good { color: #FF8A2A; font-weight: bold; }
.improve { color: #F0544F; font-weight: bold; }

/* 移动端 */
@media (max-width: 768px) {
  .score-num { font-size: 36px; }
  .detail-label { display: block; width: 100%; margin-bottom: 4px; }
  .detail-score { float: none; display: block; text-align: right; margin-top: 4px; }
  .complete-summary .big-score { font-size: 48px; }
  .progress-stats { width: 100%; justify-content: center; }
  .waveform-canvas { height: 80px; }
}
</style>
