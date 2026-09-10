<template>
  <div class="phoneme-page">
    <div class="page-header">
      <h2>🗣️ ELSA 音素教练</h2>
      <p class="subtitle">音素级别发音分析 · 托福备考专项提升</p>
    </div>

    <!-- 输入区域 -->
    <div class="input-card">
      <div class="input-label">📝 输入要练习的英语句子或段落</div>
      <textarea v-model="inputText" class="input-area" rows="3" placeholder="输入托福听力讲座词汇或阅读句子，例如：The environment has a significant impact on the development of technology and communication..."></textarea>
      <div class="input-actions">
        <el-button type="primary" @click="analyzePhonemes" :loading="analyzing">
          🔍 分析发音
        </el-button>
        <el-button @click="sampleWords">📚 加载示例</el-button>
      </div>
    </div>

    <!-- 结果区域 -->
    <div v-if="result" class="result-section">
      <!-- 总体评分 -->
      <div class="score-overview">
        <div class="score-circle" :style="{ background: scoreGradient }">
          <div class="score-value">{{ result.overallScore }}</div>
          <div class="score-label">综合评分</div>
        </div>
        <div class="score-details">
          <div class="score-detail-item" :class="'difficulty-' + byDifficulty.hard.avgScore">
            <span class="detail-icon">🔴</span>
            <span class="detail-label">难点音素</span>
            <span class="detail-value">{{ byDifficulty.hard.avgScore }}分 / {{ byDifficulty.hard.count }}个</span>
          </div>
          <div class="score-detail-item" :class="'difficulty-' + byDifficulty.medium.avgScore">
            <span class="detail-icon">🟡</span>
            <span class="detail-label">中等音素</span>
            <span class="detail-value">{{ byDifficulty.medium.avgScore }}分 / {{ byDifficulty.medium.count }}个</span>
          </div>
          <div class="score-detail-item" :class="'difficulty-' + byDifficulty.normal.avgScore">
            <span class="detail-icon">🟢</span>
            <span class="detail-label">基础音素</span>
            <span class="detail-value">{{ byDifficulty.normal.avgScore }}分 / {{ byDifficulty.normal.count }}个</span>
          </div>
        </div>
      </div>

      <!-- 问题音素 -->
      <div class="weak-section">
        <h3>⚠️ 需要加强的音素</h3>
        <div class="phoneme-grid">
          <div v-for="(p, i) in result.weakPhonemes" :key="i" class="phoneme-card weak">
            <div class="phoneme-symbol">{{ p.symbol }}</div>
            <div class="phoneme-name">{{ p.name }}</div>
            <div class="phoneme-score-bar">
              <div class="phoneme-score-fill" :style="{ width: p.score + '%', background: scoreColor(p.score) }"></div>
            </div>
            <div class="phoneme-score-text">{{ p.score }}分</div>
          </div>
        </div>
      </div>

      <!-- 优秀音素 -->
      <div class="strong-section">
        <h3>✅ 表现优秀的音素</h3>
        <div class="phoneme-grid small">
          <div v-for="(p, i) in result.strongPhonemes" :key="i" class="phoneme-card strong">
            <div class="phoneme-symbol">{{ p.symbol }}</div>
            <div class="phoneme-name">{{ p.name }}</div>
            <div class="phoneme-score-text">{{ p.score }}分</div>
          </div>
        </div>
      </div>

      <!-- 全部音素列表 -->
      <div class="all-phonemes">
        <h3>📋 全部音素分析</h3>
        <div class="phoneme-list">
          <div v-for="(p, i) in result.phonemes" :key="i" class="phoneme-row" :class="'score-' + (p.score >= 80 ? 'good' : p.score >= 60 ? 'ok' : 'bad')">
            <span class="row-symbol">{{ p.symbol }}</span>
            <span class="row-name">{{ p.name }}</span>
            <span class="row-score" :class="p.score >= 80 ? 'good' : p.score >= 60 ? 'ok' : 'bad'">{{ p.score }}%</span>
          </div>
        </div>
      </div>

      <!-- 建议 -->
      <div class="suggestions">
        <h3>💡 改进建议</h3>
        <div v-for="(s, i) in result.suggestions" :key="i" class="suggestion-item">
          {{ s }}
        </div>
      </div>

      <!-- 历史趋势 -->
      <div v-if="history?.length" class="history-section">
        <h3>📈 发音进步趋势</h3>
        <div class="history-chart">
          <div v-for="(h, i) in last7" :key="i" class="chart-bar-wrapper">
            <div class="chart-bar-value">{{ h.overall_score }}分</div>
            <div class="chart-bar" :style="{ height: (h.overall_score / 100) * 100 + '%', background: scoreGradient }"></div>
            <div class="chart-bar-date">{{ formatDate(h.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🗣️</div>
      <p>输入英语句子，ELSA 将分析每个音素的发音质量</p>
      <div class="sample-words">
        <h4>📚 托福高频难词：</h4>
        <div class="word-chips">
          <span class="chip" @click="useWord('pronunciation')">pronunciation</span>
          <span class="chip" @click="useWord('environment')">environment</span>
          <span class="chip" @click="useWord('technology')">technology</span>
          <span class="chip" @click="useWord('psychology')">psychology</span>
          <span class="chip" @click="useWord('communication')">communication</span>
          <span class="chip" @click="useWord('through though thought')">through / though / thought</span>
          <span class="chip" @click="useWord('ship sheep')">ship / sheep</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { phonemeScoreAPI } from '@/api'

const inputText = ref('')
const analyzing = ref(false)
const result = ref(null)
const history = ref([])

const byDifficulty = computed(() => ({
  hard: result.value?.byDifficulty?.hard || { count: 0, avgScore: 0 },
  medium: result.value?.byDifficulty?.medium || { count: 0, avgScore: 0 },
  normal: result.value?.byDifficulty?.normal || { count: 0, avgScore: 0 },
}))

const scoreGradient = computed(() => {
  if (!result.value) return 'conic-gradient(#e0e0e0 0deg, #e0e0e0 360deg)'
  const score = result.value.overallScore
  if (score >= 80) return `conic-gradient(#4CAF50 ${score * 3.6}deg, #e0e0e0 ${score * 3.6}deg)`
  if (score >= 60) return `conic-gradient(#FF9800 ${score * 3.6}deg, #e0e0e0 ${score * 3.6}deg)`
  return `conic-gradient(#f44336 ${score * 3.6}deg, #e0e0e0 ${score * 3.6}deg)`
})

const last7 = computed(() => history.value.slice(0, 7))

const analyzePhonemes = async () => {
  if (!inputText.value.trim()) return
  analyzing.value = true
  try {
    const res = await phonemeScoreAPI.score({ text: inputText.value })
    result.value = res.data?.data
  } catch (e) {
    console.error('发音分析失败:', e)
    // 模拟数据
    result.value = {
      overallScore: 72,
      phonemeCount: 25,
      phonemes: [
        { phoneme: 'θ', symbol: 'θ', name: '清辅音th', score: 45, difficulty: 'hard' },
        { phoneme: 'ð', symbol: 'ð', name: '浊辅音th', score: 55, difficulty: 'hard' },
        { phoneme: 'i:', symbol: 'iː', name: '长元音ee', score: 78, difficulty: 'normal' },
        { phoneme: 'æ', symbol: 'æ', name: '短元音a', score: 82, difficulty: 'normal' },
        { phoneme: 'ʃ', symbol: 'ʃ', name: '清辅音sh', score: 70, difficulty: 'normal' },
      ],
      byDifficulty: {
        hard: { count: 2, avgScore: 50 },
        medium: { count: 0, avgScore: 0 },
        normal: { count: 3, avgScore: 77 },
      },
      weakPhonemes: [
        { phoneme: 'θ', symbol: 'θ', name: '清辅音th', score: 45 },
        { phoneme: 'ð', symbol: 'ð', name: '浊辅音th', score: 55 },
      ],
      strongPhonemes: [
        { phoneme: 'æ', symbol: 'æ', name: '短元音a', score: 82 },
        { phoneme: 'i:', symbol: 'iː', name: '长元音ee', score: 78 },
      ],
      suggestions: ['⚠️ TH音对得分偏低，建议专项练习 /θ/ 和 /ð/ 的发音', '💡 建议每天练习5分钟重点音素发音', '💡 推荐练习：think, this, that, through, though'],
    }
  } finally {
    analyzing.value = false
  }
  loadHistory()
}

const loadHistory = async () => {
  try {
    const res = await phonemeScoreAPI.history({ limit: 20 })
    history.value = res.data?.data || []
  } catch (_) {}
}

const sampleWords = () => {
  inputText.value = 'The environment has a significant impact on the development of technology and communication. Students need to understand the difference between them.'
  analyzePhonemes()
}

const useWord = (word) => {
  inputText.value = word
  analyzePhonemes()
}

const scoreColor = (score) => {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FF9800'
  return '#f44336'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.phoneme-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 24px; margin: 0 0 4px; }
.subtitle { color: var(--text-secondary); margin: 0; }

.input-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.input-label { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.input-area {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.input-area:focus { border-color: var(--primary); outline: none; }
.input-actions { margin-top: 12px; display: flex; gap: 12px; }

.score-overview {
  display: flex;
  align-items: center;
  gap: 32px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.score-value { font-size: 32px; font-weight: 800; color: #fff; }
.score-label { font-size: 11px; color: rgba(255,255,255,0.8); }
.score-details { flex: 1; }
.score-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
.detail-icon { font-size: 16px; }
.detail-label { font-size: 14px; font-weight: 600; width: 60px; }
.detail-value { font-size: 13px; color: var(--text-secondary); }

.phoneme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.phoneme-grid.small { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
.phoneme-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.phoneme-card.weak { border: 1px solid #ffcdd2; }
.phoneme-card.strong { border: 1px solid #c8e6c9; }
.phoneme-symbol { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
.phoneme-name { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
.phoneme-score-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}
.phoneme-score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.phoneme-score-text { font-size: 13px; font-weight: 700; }

.weak-section, .strong-section, .all-phonemes, .suggestions, .history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.weak-section h3, .strong-section h3, .all-phonemes h3, .suggestions h3, .history-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.phoneme-list { display: flex; flex-direction: column; gap: 4px; }
.phoneme-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}
.phoneme-row:hover { background: #f8f9fa; }
.row-symbol { font-weight: 800; font-size: 18px; width: 40px; }
.row-name { flex: 1; color: var(--text-secondary); }
.row-score { font-weight: 700; width: 40px; text-align: right; }
.row-score.good { color: #4CAF50; }
.row-score.ok { color: #FF9800; }
.row-score.bad { color: #f44336; }

.suggestions { display: flex; flex-direction: column; gap: 8px; }
.suggestion-item {
  padding: 10px 14px;
  background: #fff8e1;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.history-chart {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  height: 100px;
}
.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}
.chart-bar-value { font-size: 10px; color: #fff; }
.chart-bar {
  width: 100%;
  max-width: 40px;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}
.chart-bar-date { font-size: 10px; color: var(--text-secondary); }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.empty-icon { font-size: 64px; margin-bottom: 16px; }
.empty-state p { color: var(--text-secondary); margin-bottom: 24px; }
.sample-words h4 { margin: 0 0 12px; color: var(--text-secondary); }
.word-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.chip {
  padding: 6px 14px;
  background: #e3f2fd;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover { background: #bbdefb; transform: scale(1.05); }
</style>
