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
          :color="phase === 'prep' ? '#FF8A2A' : '#23B26D'"
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

        <!-- 录音回放 -->
        <div class="playback" v-if="audioUrl && !isRecording && !submitted">
          <audio :src="audioUrl" controls ref="playbackRef" />
          <el-button size="small" @click="reRecord" style="margin-top: 8px;">重新录制</el-button>
        </div>

        <!-- 文字转写输入（录音或备选方案） -->
        <div class="transcript-section" v-if="!submitted">
          <el-divider content-position="left">回答内容</el-divider>
          <el-input
            v-model="transcript"
            type="textarea"
            :rows="4"
            placeholder="请输入你的口语回答文字稿，AI 将基于此进行评分。如果无法录音，也可直接在此输入回答内容。"
          />
          <p class="transcript-hint">提示：AI 评分基于文字内容分析，可录音后转写或直接输入回答。</p>
        </div>

        <div class="start-controls" v-if="phase === 'idle'">
          <el-button type="primary" size="large" @click="startPrep">
            开始答题 (15s 准备 + 45s 回答)
          </el-button>
        </div>
      </div>

      <div class="action-bar" v-if="!submitted">
        <el-button
          type="warning"
          @click="startConversation"
        >
          💬 AI 模拟对话
        </el-button>
        <el-button
          type="primary"
          :disabled="!transcript.trim()"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交评分
        </el-button>
      </div>

      <!-- Bookmark -->
      <div class="bookmark-section">
        <el-button :type="isBookmarked ? 'warning' : 'info'" @click="toggleBookmark" :icon="Star">
          {{ isBookmarked ? '⭐ 已收藏' : '☆ 收藏题目' }}
        </el-button>
        <span class="bookmark-count">{{ bookmarkCount }} 人已收藏</span>
      </div>

      <!-- AI 模拟对话面板 -->
      <div class="conversation-panel" v-if="showConversation">
        <el-divider />
        <div class="conversation-header">
          <h4>💬 AI 模拟对话</h4>
          <div class="conversation-controls">
            <el-tag v-if="conversation.round" type="info" size="small">
              第 {{ conversation.round }}/{{ conversation.maxRounds }} 轮
            </el-tag>
            <el-button text size="small" @click="showConversation = false" v-if="!conversation.active">✕ 收起</el-button>
          </div>
        </div>

        <div v-if="!conversation.active" class="conversation-start">
          <p>AI 将模拟托福考官与你进行多轮对话练习。</p>
          <p>每轮：AI 提问 → 你回答 → AI 评价 + 追问</p>
          <el-button type="primary" @click="beginConversation">开始对话</el-button>
        </div>

        <div v-else class="conversation-messages">
          <div class="message" v-for="(msg, idx) in conversation.messages" :key="idx" :class="msg.role">
            <div class="message-avatar">{{ msg.role === 'ai' ? '🤖' : '👤' }}</div>
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div v-if="msg.score !== undefined" class="message-score">
                本轮评分：{{ msg.score }}/30
              </div>
              <div v-if="msg.feedback" class="message-feedback">
                💡 {{ msg.feedback }}
              </div>
            </div>
          </div>
          <div v-if="conversation.waitingForInput" class="message ai waiting">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <span class="typing">正在思考...</span>
            </div>
          </div>
        </div>

        <div class="conversation-input" v-if="conversation.active && conversation.nextQuestion">
          <el-input
            v-model="conversation.userResponse"
            type="textarea"
            :rows="3"
            :placeholder="conversation.nextQuestion"
            @keydown.enter.ctrl="sendResponse"
          />
          <el-button type="primary" :loading="conversation.sending" @click="sendResponse">
            发送回答
          </el-button>
        </div>

        <div v-if="conversation.ended" class="conversation-result">
          <el-divider />
          <h5>📊 对话总结</h5>
          <div class="final-score" v-if="conversation.finalScore">
            <span class="score-big">{{ conversation.finalScore }}</span>
            <span>/ 30</span>
          </div>
          <p class="final-feedback" v-if="conversation.finalFeedback">{{ conversation.finalFeedback }}</p>
          <div class="final-actions">
            <el-button @click="$router.back()">返回列表</el-button>
            <el-button type="primary" @click="reset">再练一次</el-button>
          </div>
        </div>
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

        <!-- 🎯 6 维度详细评分 -->
        <div class="detail-items-6d" v-if="aiResult.detail">
          <div class="dim-card" v-for="dim in detailDimensions" :key="dim.key">
            <div class="dim-header">
              <span class="dim-emoji">{{ dim.emoji }}</span>
              <span class="dim-name">{{ dim.name }}</span>
              <span class="dim-score">{{ (aiResult.detail[dim.key] || '--') + '/30' }}</span>
            </div>
            <el-progress
              :percentage="getPct(aiResult.detail[dim.key])"
              :color="dim.color"
              :stroke-width="8"
              :show-text="false"
            />
          </div>
        </div>

        <div class="feedback-block" v-if="aiResult.feedback">
          <h5>💡 综合反馈</h5>
          <p>{{ aiResult.feedback }}</p>
        </div>

        <!-- ✅ 优点 -->
        <div class="suggestions-block strengths" v-if="aiResult.strengths && aiResult.strengths.length">
          <h5>✅ 你的优点</h5>
          <ul>
            <li v-for="(s, i) in aiResult.strengths" :key="'s'+i">{{ s }}</li>
          </ul>
        </div>

        <!-- ⚠️ 弱点 -->
        <div class="suggestions-block weaknesses" v-if="aiResult.weaknesses && aiResult.weaknesses.length">
          <h5>⚠️ 需要改进</h5>
          <ul>
            <li v-for="(s, i) in aiResult.weaknesses" :key="'w'+i">{{ s }}</li>
          </ul>
        </div>

        <!-- 改进建议 -->
        <div class="suggestions-block" v-if="aiResult.suggestions && aiResult.suggestions.length">
          <h5>📝 改进建议</h5>
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
import { ArrowLeft, Microphone, VideoPause, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI, aiConversationAPI, bookmarkAPI } from '@/api'

const route = useRoute()
const question = ref(null)
const loading = ref(false)
const submitting = ref(false)
const submitted = ref(false)

// 收藏
const isBookmarked = ref(false)
const bookmarkCount = ref(12)
const toggleBookmark = async () => {
  isBookmarked.value = !isBookmarked.value
  bookmarkCount.value += isBookmarked.value ? 1 : -1
  ElMessage.success(isBookmarked.value ? '收藏成功' : '已取消收藏')
}

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

// ==================== AI 模拟对话 ====================
const showConversation = ref(false)
const conversation = ref({
  active: false,
  ended: false,
  round: 0,
  maxRounds: 3,
  messages: [],
  nextQuestion: '',
  userResponse: '',
  waitingForInput: false,
  sending: false,
  finalScore: null,
  finalFeedback: '',
})

function startConversation() {
  showConversation.value = true
  conversation.value = {
    active: false,
    ended: false,
    round: 0,
    maxRounds: 3,
    messages: [],
    nextQuestion: '',
    userResponse: '',
    waitingForInput: false,
    sending: false,
    finalScore: null,
    finalFeedback: '',
  }
}

async function beginConversation() {
  conversation.value.active = true
  conversation.value.sending = true

  try {
    const res = await aiConversationAPI.start({
      type: question.value?.type || 'independent',
      difficulty: question.value?.difficulty || 'medium',
    })
    if (res.data && res.data.code === 200) {
      const topic = res.data.data
      conversation.value.maxRounds = 3
      conversation.value.messages = [
        {
          role: 'ai',
          content: topic?.content || '请回答以下问题：',
        },
      ]
      conversation.value.nextQuestion = '请开始你的回答...'
      conversation.value.waitingForInput = false
    } else {
      ElMessage.error(res.data?.message || '开始对话失败')
    }
  } catch (err) {
    console.error('[SpeakingDetail] 开始对话失败:', err)
    ElMessage.error('开始对话失败')
  } finally {
    conversation.value.sending = false
  }
}

async function sendResponse() {
  if (!conversation.value.userResponse.trim()) return
  conversation.value.sending = true
  conversation.value.waitingForInput = true

  const userMsg = conversation.value.userResponse.trim()
  conversation.value.userResponse = ''

  // 添加用户消息
  conversation.value.messages.push({
    role: 'user',
    content: userMsg,
  })

  const round = conversation.value.round + 1

  try {
    const res = await aiConversationAPI.respond({
      conversationId: 'conv_' + Date.now(),
      userResponse: userMsg,
      round: round,
      topicContent: conversation.value.messages[0]?.content || '',
      type: question.value?.type || 'independent',
      maxRounds: conversation.value.maxRounds,
    })

    if (res.data && res.data.code === 200) {
      const data = res.data.data
      const aiMsg = {
        role: 'ai',
        content: data.nextQuestion || (data.isFinal ? '对话结束' : ''),
        score: data.score,
        feedback: data.feedback,
      }
      conversation.value.messages.push(aiMsg)
      conversation.value.round = round

      if (data.isFinal) {
        // 对话结束
        conversation.value.ended = true
        conversation.value.active = false
        conversation.value.finalScore = data.score
        conversation.value.finalFeedback = data.feedback || '对话结束'
        conversation.value.nextQuestion = ''
      } else {
        conversation.value.nextQuestion = data.nextQuestion || '请继续回答...'
      }
    } else {
      ElMessage.error(res.data?.message || 'AI 回复失败')
      conversation.value.nextQuestion = '请重试...'
    }
  } catch (err) {
    console.error('[SpeakingDetail] AI 对话失败:', err)
    ElMessage.error('AI 对话失败: ' + (err.message || '未知错误'))
    conversation.value.nextQuestion = '请重试...'
  } finally {
    conversation.value.sending = false
    conversation.value.waitingForInput = false
  }
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
    // 带上用户自配的 AI 设置（localStorage），用于 AI 评分
    const res = await practiceAPI.submit({
      questionId: question.value?._id || question.value?.id,
      subject: 'speaking',
      content: transcript.value,
      timeSpent: recordTime.value,
      aiProvider: localStorage.getItem('ai_provider') || undefined,
      aiApiKey: localStorage.getItem('ai_api_key') || undefined,
      aiBaseURL: localStorage.getItem('ai_base_url') || undefined,
      aiModel: localStorage.getItem('ai_model') || undefined,
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

// 6 维度配置
const detailDimensions = [
  { key: 'pronunciation', name: '发音准确度', emoji: '🗣️', color: '#FF6B6B' },
  { key: 'fluency', name: '流利度', emoji: '🌊', color: '#4ECDC4' },
  { key: 'intonation', name: '语调自然度', emoji: '🎵', color: '#45B7D1' },
  { key: 'grammar', name: '语法正确度', emoji: '📐', color: '#96CEB4' },
  { key: 'vocabulary', name: '词汇丰富度', emoji: '📚', color: '#FFEAA7' },
  { key: 'taskCompletion', name: '任务完成度', emoji: '✅', color: '#DDA0DD' },
]

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.countdown {
  font-size: 28px;
  font-weight: bold;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.countdown.urgent { color: var(--danger); }

.recorder-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px;
  margin-bottom: 24px;
  background: #F8F9FC;
  border-radius: 12px;
}
.record-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-size: 15px;
  margin-bottom: 16px;
}
.record-buttons {
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
}
.phase-hint {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 8px 0;
}
.playback {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.start-controls { margin-top: 16px; }

.transcript-section { width: 100%; margin-top: 16px; }
.transcript-hint { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }

.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}

.ai-result { margin-top: 8px; }
.ai-result h4 { font-size: 16px; margin-bottom: 16px; }
.score-overview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}
.total-score { display: flex; align-items: baseline; gap: 4px; }
.score-num { font-size: 48px; font-weight: bold; color: var(--primary); }
.score-max { font-size: 18px; color: var(--text-secondary); }

/* 6 维度评分卡片 */
.detail-items-6d {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.dim-card {
  background: #F8F9FC;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid #E8E8E8;
}
.dim-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.dim-emoji { font-size: 18px; }
.dim-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}
.dim-score {
  font-size: 16px;
  font-weight: 800;
}
.dim-card:nth-child(1) .dim-score { color: #FF6B6B; }
.dim-card:nth-child(2) .dim-score { color: #4ECDC4; }
.dim-card:nth-child(3) .dim-score { color: #45B7D1; }
.dim-card:nth-child(4) .dim-score { color: #23B26D; }
.dim-card:nth-child(5) .dim-score { color: #DAA520; }
.dim-card:nth-child(6) .dim-score { color: #DDA0DD; }

/* 优点/弱点/建议 */
.suggestions-block.strengths {
  background: #F1F8E9;
  border: 1px solid #C5E1A5;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}
.suggestions-block.weaknesses {
  background: #FFF3E0;
  border: 1px solid #FFCC80;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}
.suggestions-block h5 {
  font-size: 14px;
  margin-bottom: 8px;
}
.suggestions-block ul { padding-left: 18px; margin: 0; }
.suggestions-block li {
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 4px;
}

.feedback-block, .suggestions-block { margin-bottom: 16px; }
.feedback-block h5, .suggestions-block h5 { font-size: 14px; margin-bottom: 8px; }
.feedback-block p { font-size: 14px; line-height: 1.6; }
.suggestions-block ul { padding-left: 20px; }
.suggestions-block li { font-size: 14px; line-height: 1.8; }

.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }

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
    line-height: 1.4;
  }
  .card {
    padding: 16px;
  }
  .question-block {
    margin-bottom: 18px;
  }
  .question-text {
    font-size: 14px;
    line-height: 1.6;
  }
  .question-hint {
    font-size: 12px;
  }

  /* 倒计时 */
  .timer-section {
    margin-bottom: 16px;
  }
  .phase-indicator {
    gap: 8px;
  }
  .countdown {
    font-size: 22px;
  }
  .phase-indicator .el-tag {
    font-size: 12px;
    padding: 4px 10px;
  }

  /* 录音区域 */
  .recorder-section {
    padding: 20px 16px;
    margin-bottom: 18px;
    border-radius: 10px;
  }
  .record-status {
    font-size: 14px;
    margin-bottom: 14px;
  }
  .record-buttons {
    margin-bottom: 10px;
  }
  .record-buttons .el-button {
    --el-button-size: 56px;
  }
  .phase-hint {
    font-size: 13px;
    margin: 6px 0;
  }
  .playback audio {
    width: 100%;
  }
  .start-controls .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }

  /* 文字转写 */
  .transcript-section .el-textarea__inner {
    font-size: 14px;
    line-height: 1.6;
  }
  .transcript-hint {
    font-size: 11px;
  }

  /* 操作栏 */
  .action-bar {
    flex-direction: column;
    gap: 8px;
    padding: 14px 0;
  }
  .action-bar .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }

  /* AI 评分结果 */
  .ai-result {
    margin-top: 6px;
  }
  .ai-result h4 {
    font-size: 15px;
    margin-bottom: 14px;
  }
  .score-overview {
    gap: 12px;
    margin-bottom: 20px;
  }
  .score-num {
    font-size: 40px;
  }
  .score-max {
    font-size: 16px;
  }
  .ai-result .el-tag {
    font-size: 13px;
    padding: 6px 14px;
  }

  /* 6 维度评分卡片 */
  .detail-items-6d {
    grid-template-columns: 1fr;
  }
  .dim-card {
    padding: 10px 12px;
  }
  .dim-header {
    margin-bottom: 6px;
  }
  .dim-name {
    font-size: 13px;
  }

  /* 评分详情 */
  .score-details {
    margin-bottom: 20px;
  }
  .detail-item {
    grid-template-columns: 1fr;
    gap: 6px;
    text-align: center;
  }
  .detail-label {
    text-align: center;
    font-size: 13px;
  }
  .detail-score {
    text-align: center;
    font-size: 13px;
  }
  .detail-item .el-progress {
    margin: 0 0 4px;
  }
  .detail-item .el-progress-bar {
    flex: 1;
  }

  /* 反馈与建议 */
  .feedback-block h5, .suggestions-block h5 {
    font-size: 13px;
  }
  .feedback-block p {
    font-size: 13px;
    line-height: 1.5;
  }
  .suggestions-block li {
    font-size: 13px;
    line-height: 1.7;
  }
}

@media (max-width: 600px) {
  .recorder-section { padding: 16px; }
  .countdown { font-size: 22px; }
  .score-num { font-size: 36px; }
}

/* ==================== AI 模拟对话样式 ==================== */
.conversation-panel {
  margin-top: 16px;
}
.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.conversation-header h4 {
  margin: 0;
  font-size: 18px;
}
.conversation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conversation-start {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}
.conversation-start p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}
.conversation-messages {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}
.message {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.message.ai {
  flex-direction: row;
}
.message.user {
  flex-direction: row-reverse;
}
.message-avatar {
  font-size: 24px;
  flex-shrink: 0;
}
.message-content {
  max-width: 80%;
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.message.user .message-content {
  background: #1a73e8;
  color: white;
}
.message-content .message-text {
  margin-bottom: 4px;
}
.message-content .message-feedback {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(0,0,0,0.1);
  font-size: 13px;
  color: #666;
}
.message.user .message-feedback {
  color: rgba(255,255,255,0.8);
  border-top-color: rgba(255,255,255,0.2);
}
.message-content .message-score {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #FF8A2A;
}
.message.user .message-score {
  color: #ffd700;
}
.message.waiting .message-content {
  background: transparent;
  font-style: italic;
  color: #999;
}
.typing {
  display: inline-block;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.conversation-input {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conversation-input .el-textarea {
  flex: 1;
}
.conversation-input .el-button {
  align-self: flex-end;
}
.conversation-result {
  text-align: center;
  padding: 20px 0;
}
.final-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 12px 0;
}
.score-big {
  font-size: 48px;
  font-weight: 700;
  color: #1a73e8;
}
.final-feedback {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 8px 0;
}
.final-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.bookmark-section {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.bookmark-count {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
