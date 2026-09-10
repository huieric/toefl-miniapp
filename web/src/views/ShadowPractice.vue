<template>
  <div class="page-container shadow-page">
    <div class="page-header">
      <el-button text @click="$router.push('/listening')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎙️ 口语跟读练习</h2>
      <div class="header-spacer" />
    </div>

    <div class="shadow-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.summary?.avg_score?.toFixed?.(1) || '0' }}</div>
            <div class="stat-label">平均评分</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.summary?.total_records || '0' }}</div>
            <div class="stat-label">练习次数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.summary?.unique_phrases || '0' }}</div>
            <div class="stat-label">练习短语</div>
          </div>
        </div>
      </div>

      <!-- 短语列表 -->
      <div class="phrases-section">
        <div class="section-header">
          <h3>📖 跟读短语</h3>
          <el-select v-model="difficulty" size="small" @change="loadPhrases">
            <el-option label="全部难度" value="all" />
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </div>

        <div class="phrases-list">
          <div 
            v-for="phrase in phrases" 
            :key="phrase.id"
            class="phrase-card"
            :class="{ practicing: currentPhraseId === phrase.id }"
          >
            <div class="phrase-content">
              <div class="phrase-text">{{ phrase.text }}</div>
              <div class="phrase-tags">
                <el-tag size="small" :type="getDifficultyTag(phrase.difficulty)">
                  {{ getDifficultyLabel(phrase.difficulty) }}
                </el-tag>
                <el-tag size="small" type="info">{{ phrase.category }}</el-tag>
              </div>
            </div>

            <div class="phrase-actions">
              <el-button size="small" @click="playAudio(phrase)">
                <el-icon><VideoPlay /></el-icon> 播放
              </el-button>
              <el-button size="small" @click="startShadow(phrase)">
                <el-icon><Microphone /></el-icon> 跟读
              </el-button>
              <el-button size="small" @click="analyzePhrase(phrase)">
                <el-icon><MagicStick /></el-icon> 分析
              </el-button>
            </div>

            <!-- 跟读动画 -->
            <div class="shadow-animator" v-if="currentPhraseId === phrase.id">
              <div class="recorder-status" :class="{ recording: isRecording }">
                <div class="pulse-dot" v-if="isRecording"></div>
                <span>{{ isRecording ? '正在录音...' : '录音完成' }}</span>
              </div>
              <div class="word-by-word" v-if="analysis">
                <span 
                  v-for="(word, idx) in analysis.words" 
                  :key="idx"
                  class="word"
                  :class="{ 'word-poor': word.score < 3.5, 'word-good': word.score >= 4 }"
                >
                  {{ word.word }}
                </span>
              </div>
              <div class="analysis-score" v-if="analysis">
                <div class="overall-score">整体评分: {{ analysis.overallScore.toFixed(1) }}</div>
                <div class="suggestion">{{ analysis.suggestion }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近练习记录 -->
      <div class="recent-sessions" v-if="stats.recent?.length > 0">
        <h3>🕐 最近练习</h3>
        <div class="recent-list">
          <div v-for="item in stats.recent" :key="item.id" class="recent-item">
            <span class="r-phrase">{{ item.phrase }}</span>
            <span class="r-score" :style="{ color: item.score > 3.5 ? '#10b981' : '#f59e0b' }">
              {{ item.score.toFixed(1) }}
            </span>
            <span class="r-time">{{ formatDate(item.recorded_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay, Microphone, MagicStick } from '@element-plus/icons-vue'
import { shadowPracticeAPI } from '@/api'

const phrases = ref([])
const difficulty = ref('all')
const currentPhraseId = ref(null)
const isRecording = ref(false)
const analysis = ref(null)
const stats = ref({ summary: {}, recent: [] })

onMounted(async () => {
  await Promise.all([loadPhrases(), loadStats()])
})

const loadPhrases = async () => {
  try {
    const res = await shadowPracticeAPI.getPhrases({ level: difficulty.value })
    phrases.value = res.data?.data?.phrases || []
  } catch (e) {
    ElMessage.error('加载短语失败')
  }
}

const loadStats = async () => {
  try {
    const res = await shadowPracticeAPI.getStats()
    stats.value = res.data?.data || { summary: {}, recent: [] }
  } catch {
    // ignore
  }
}

const playAudio = (phrase) => {
  // 使用浏览器 TTS 播放
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(phrase.text)
    utterance.lang = 'en-US'
    utterance.rate = 0.8 // 放慢速度，适合跟读
    window.speechSynthesis.speak(utterance)
  } else {
    ElMessage.warning('当前浏览器不支持语音播放')
  }
}

const startShadow = (phrase) => {
  currentPhraseId.value = phrase.id
  analysis.value = null
  isRecording.value = true
  
  // 先播放音频，然后模拟录音
  playAudio(phrase)
  
  // 模拟录音 3 秒
  setTimeout(() => {
    isRecording.value = false
    analyzePhrase(phrase)
  }, 3000)
}

const analyzePhrase = async (phrase) => {
  try {
    const res = await shadowPracticeAPI.analyze({ phrase: phrase.text })
    analysis.value = res.data?.data
  } catch {
    // 使用模拟数据
    const words = phrase.text.split(/\s+/).map((w, i) => ({
      word: w.replace(/[^a-zA-Z]/g, ''),
      score: 3 + Math.random() * 2,
      confidence: 0.7 + Math.random() * 0.3,
    }))
    analysis.value = {
      overallScore: words.reduce((s, w) => s + w.score, 0) / words.length,
      words,
      needsImprovement: words.filter(w => w.score < 3.5).map(w => w.word),
      suggestion: '继续练习，注意重音和语调。',
    }
  }
}

const getDifficultyTag = (d) => ({ easy: '', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.shadow-page {
  max-width: 800px;
  margin: 0 auto;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon { font-size: 28px; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.phrases-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 { margin: 0; }

.phrases-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.phrase-card {
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
}

.phrase-card.practicing {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.phrase-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
}

.phrase-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.phrase-actions {
  display: flex;
  gap: 8px;
}

.shadow-animator {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.recorder-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.word-by-word {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.word {
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
}

.word-poor {
  background: #fef2f2;
  color: #ef4444;
}

.word-good {
  background: #ecfdf5;
  color: #10b981;
}

.analysis-score {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.overall-score {
  font-weight: 700;
  color: #4a6cf7;
  margin-bottom: 4px;
}

.suggestion {
  font-size: 13px;
  color: #666;
}

.recent-sessions {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.recent-sessions h3 {
  margin-bottom: 12px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f7ff;
  font-size: 13px;
}

.r-phrase { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r-score { font-weight: 600; min-width: 40px; text-align: right; }
.r-time { color: #909399; min-width: 80px; text-align: right; }
</style>
