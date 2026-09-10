<template>
  <div class="page-container speaking-fluency-page">
    <div class="page-header">
      <el-button text @click="$router.push('/speaking')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎯 口语流利度追踪</h2>
      <div class="header-spacer" />
    </div>

    <div class="speaking-fluency-content">
      <!-- 提示选择 -->
      <div class="prompt-select" v-if="!recordingStarted">
        <h3>选择口语提示</h3>
        <div class="prompt-cards">
          <div 
            v-for="prompt in prompts" 
            :key="prompt.id"
            class="prompt-card"
            :class="{ 'selected': selectedPrompt === prompt.id }"
            @click="selectPrompt(prompt.id)"
          >
            <span class="prompt-category">{{ getCategoryLabel(prompt.category) }}</span>
            <p class="prompt-question">{{ prompt.question }}</p>
            <div class="prompt-times">
              <span>准备: {{ prompt.prepTime }}s</span>
              <span>答题: {{ prompt.speakTime }}s</span>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="startRecording" :disabled="!selectedPrompt">
          开始练习
        </el-button>
      </div>

      <!-- 录制界面 -->
      <div class="recording-interface" v-if="recordingStarted && !recordingDone">
        <div class="recording-header">
          <div class="prep-timer" v-if="phase === 'prep'">
            准备时间: {{ prepTimeLeft }}s
          </div>
          <div class="recording-status" v-if="phase === 'speak'">
            <el-icon class="recording-icon" :class="{ 'recording-pulse': isRecording }">
              <VideoCamera />
            </el-icon>
            <span>正在录制...</span>
            <span class="speak-timer">{{ formatTime(speakTimeLeft) }}</span>
          </div>
        </div>

        <div class="recording-prompt">
          <p class="question-text">{{ currentPrompt?.question }}</p>
        </div>

        <div class="recording-controls">
          <el-button type="danger" @click="stopRecording" :disabled="phase === 'prep'">
            停止录音
          </el-button>
          <el-button @click="restartRecording" :disabled="phase !== 'speak'">
            重新录制
          </el-button>
        </div>
      </div>

      <!-- 分析结果 -->
      <div class="fluency-result" v-if="recordingDone && analysis">
        <div class="result-card">
          <div class="fluency-score">
            <div class="score-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e4e7ed" stroke-width="8" />
                <circle 
                  cx="50" cy="50" r="42" 
                  fill="none" 
                  stroke="#10b981" 
                  stroke-width="8"
                  stroke-dasharray="264"
                  :stroke-dashoffset="264 * (1 - analysis.fluencyScore / 5)"
                />
              </svg>
              <div class="score-value">{{ analysis.fluencyScore }}</div>
              <div class="score-max">/ 5.0</div>
            </div>
            <div class="fluency-level">{{ analysis.fluencyLevel }}</div>
          </div>

          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-value">{{ analysis.wpm }}</div>
              <div class="metric-label">WPM</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ analysis.pauseCount }}</div>
              <div class="metric-label">停顿次数</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ analysis.duration }}s</div>
              <div class="metric-label">总时长</div>
            </div>
          </div>

          <div class="suggestions" v-if="analysis.suggestions">
            <h4>💡 改进建议</h4>
            <ul>
              <li v-for="(sug, idx) in analysis.suggestions" :key="idx">{{ sug }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 趋势图表 -->
      <div class="fluency-trend">
        <h3>📈 流利度趋势</h3>
        <div class="trend-chart">
          <div class="chart-bar" v-for="point in trend" :key="point.id">
            <div class="bar-fill" :style="{ height: (point.fluencyScore / 5 * 100) + '%' }"></div>
            <div class="bar-label">{{ formatDate(point.created_at) }}</div>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div class="fluency-history">
        <h3>📋 练习历史</h3>
        <div class="history-list">
          <div v-for="record in history" :key="record.id" class="history-item">
            <div class="h-score">{{ record.fluencyScore }}/5.0</div>
            <div class="h-detail">
              <span>{{ record.wpm }} WPM</span>
              <span>{{ record.pauseCount }} 停顿</span>
            </div>
            <div class="h-date">{{ formatDate(record.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { speakingFluencyAPI } from '@/api'
import { VideoCamera } from '@element-plus/icons-vue'

const prompts = ref([])
const selectedPrompt = ref(null)
const recordingStarted = ref(false)
const recordingDone = ref(false)
const phase = ref('prep') // prep | speak
const prepTimeLeft = ref(15)
const speakTimeLeft = ref(45)
const isRecording = ref(false)
const currentRecording = ref(null)
const analysis = ref(null)
const trend = ref([])
const history = ref([])

let prepTimer = null
let speakTimer = null

onMounted(() => {
  loadPrompts()
  loadTrend()
})

const loadPrompts = async () => {
  try {
    const res = await speakingFluencyAPI.getPrompts()
    prompts.value = res.data?.data?.prompts || []
  } catch {
    // Mock prompts
    prompts.value = [
      { id: 1, category: 'independent', question: 'Do you agree or disagree that traveling is important for personal growth?', prepTime: 15, speakTime: 45 },
      { id: 2, category: 'integrated', question: 'Discuss two methods for protecting endangered species.', prepTime: 20, speakTime: 60 },
    ]
  }
}

const selectPrompt = (id) => {
  selectedPrompt.value = id
}

const startRecording = () => {
  recordingStarted.value = true
  recordingDone.value = false
  phase.value = 'prep'
  prepTimeLeft.value = prompts.value.find(p => p.id === selectedPrompt.value)?.prepTime || 15
  
  prepTimer = setInterval(() => {
    prepTimeLeft.value--
    if (prepTimeLeft.value <= 0) {
      clearInterval(prepTimer)
      phase.value = 'speak'
      isRecording.value = true
      startSpeakingPhase()
    }
  }, 1000)
}

const startSpeakingPhase = () => {
  speakTimeLeft.value = prompts.value.find(p => p.id === selectedPrompt.value)?.speakTime || 45
  
  speakTimer = setInterval(() => {
    speakTimeLeft.value--
    if (speakTimeLeft.value <= 0) {
      clearInterval(speakTimer)
      stopRecording()
    }
  }, 1000)
}

const stopRecording = () => {
  clearInterval(prepTimer)
  clearInterval(speakTimer)
  isRecording.value = false
  recordingDone.value = true
  
  // Mock analysis
  analysis.value = {
    fluencyScore: (3.5 + Math.random() * 1.5).toFixed(1),
    fluencyLevel: 'Advanced',
    wpm: Math.round(120 + Math.random() * 80),
    pauseCount: Math.floor(3 + Math.random() * 10),
    duration: 45,
    suggestions: ['减少停顿次数', '尝试更复杂的句式', '注意语速控制'],
  }
  
  loadTrend()
}

const restartRecording = () => {
  recordingDone.value = false
  phase.value = 'prep'
  startRecording()
}

const loadTrend = async () => {
  try {
    const res = await speakingFluencyAPI.getStats()
    trend.value = res.data?.data?.trend || []
  } catch {
    // Mock trend
    trend.value = [
      { id: 1, fluencyScore: 3.2, created_at: new Date(Date.now() - 259200000).toISOString() },
      { id: 2, fluencyScore: 3.8, created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: 3, fluencyScore: 4.1, created_at: new Date(Date.now() - 86400000).toISOString() },
    ]
  }
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const getCategoryLabel = (cat) => ({ independent: '独立', integrated: '综合' }[cat] || cat)
</script>

<style scoped>
.speaking-fluency-page {
  max-width: 900px;
  margin: 0 auto;
}

.prompt-select,
.recording-interface,
.fluency-result,
.fluency-trend {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prompt-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.prompt-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.prompt-card:hover {
  border-color: #4a6cf7;
}

.prompt-card.selected {
  border-color: #4a6cf7;
  background: #e8f0ff;
}

.prompt-question {
  margin: 8px 0;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
}

.prompt-times {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.recording-header {
  text-align: center;
  margin-bottom: 24px;
}

.prep-timer {
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
}

.recording-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 18px;
}

.recording-icon {
  font-size: 32px;
  color: #ef4444;
}

.recording-pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.recording-prompt {
  text-align: center;
  margin: 24px 0;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
}

.recording-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.result-card {
  text-align: center;
}

.fluency-score {
  margin: 24px 0;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.score-circle svg {
  width: 100%;
  height: 100%;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 700;
  color: #10b981;
}

.score-max {
  font-size: 12px;
  color: #909399;
}

.fluency-level {
  margin-top: 12px;
  padding: 4px 16px;
  background: #ecfdf5;
  color: #10b981;
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.metric {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #4a6cf7;
}

.metric-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.suggestions {
  text-align: left;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  margin: 24px 0;
}

.suggestions ul {
  padding-left: 20px;
  margin: 8px 0 0;
}

.suggestions li {
  margin-bottom: 4px;
  color: #333;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  height: 100px;
  margin: 16px 0;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #10b981, #34d399);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.bar-label {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.h-score {
  font-weight: 700;
  color: #10b981;
  font-size: 16px;
}

.h-detail {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.h-date {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}
</style>
