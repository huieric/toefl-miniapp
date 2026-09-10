<template>
  <div class="speed-reading-page">
    <div class="page-header">
      <h2>📖 速度阅读训练</h2>
      <p class="subtitle">追踪你的阅读速度 · 突破托福阅读瓶颈</p>
    </div>

    <!-- 等级卡片 -->
    <div class="level-card">
      <div class="level-icon">{{ levelData?.currentLevel?.icon || '🐢' }}</div>
      <div class="level-info">
        <div class="level-name">{{ levelData?.currentLevel?.name || '慢速阅读' }}</div>
        <div class="level-desc">{{ levelData?.recommendations?.tips || '' }}</div>
      </div>
      <div class="level-wpm">
        <div class="wpm-gauge">
          <svg viewBox="0 0 120 60" class="gauge-svg">
            <path d="M10,55 A50,50 0 0,1 110,55" fill="none" stroke="#e0e0e0" stroke-width="6" stroke-linecap="round"/>
            <path d="M10,55 A50,50 0 0,1 110,55" fill="none" :stroke="wpmColor" stroke-width="6" stroke-linecap="round"
              :stroke-dasharray="`${(userWpm / 600) * 157} 157`"/>
            <text x="60" y="50" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">{{ userWpm }}</text>
            <text x="60" y="58" text-anchor="middle" font-size="8" fill="#999">WPM</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- 四科速度对比 -->
    <div class="stats-grid">
      <div v-for="stat in subjectStats" :key="stat.subject" class="stat-card subject-card">
        <div class="stat-icon">{{ subjectIcon(stat.subject) }}</div>
        <div class="stat-value">{{ Math.round(stat.avg_wpm) || 0 }}</div>
        <div class="stat-label">{{ subjectLabel(stat.subject) }} WPM</div>
        <div class="stat-sub">
          <span>正确率: {{ Math.round(stat.avg_comprehension) || 0 }}%</span>
          <span>会话: {{ stat.total_sessions || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 阅读等级 -->
    <div class="levels-section">
      <h3>📊 阅读等级体系</h3>
      <div class="levels-list">
        <div v-for="l in levelData?.levels" :key="l.name" class="level-item"
          :class="{ current: l.name === levelData?.currentLevel?.name }">
          <span class="level-emoji">{{ l.icon }}</span>
          <span class="level-name">{{ l.name }}</span>
          <span class="level-range">{{ l.minWpm === Infinity ? l.minWpm + '+' : l.minWpm + '-' + l.maxWpm }}</span>
          <div v-if="l.name === levelData?.currentLevel?.name" class="level-current">当前</div>
        </div>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="levelData?.nextLevel" class="progress-section">
      <h3>🎯 升级进度</h3>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-label">
        当前: {{ levelData.currentLevel.name }} ({{ userWpm }} WPM)
        → 下一级: {{ levelData.nextLevel.name }} ({{ levelData.nextLevel.minWpm }} WPM)
      </div>
    </div>

    <!-- 开始新训练 -->
    <div class="training-card">
      <h3>🏋️ 开始新的阅读训练</h3>
      <div class="training-form">
        <div class="form-row">
          <label>科目</label>
          <select v-model="training.subject" class="form-select">
            <option value="reading">阅读</option>
            <option value="listening">听力</option>
            <option value="writing">写作</option>
            <option value="speaking">口语</option>
          </select>
        </div>
        <div class="form-row">
          <label>字数</label>
          <input v-model.number="training.wordCount" type="number" class="form-input" placeholder="输入阅读字数" min="100" />
        </div>
        <div class="form-row">
          <label>用时(秒)</label>
          <input v-model.number="training.timeSpent" type="number" class="form-input" placeholder="阅读用时" min="10" />
        </div>
        <div class="form-row">
          <label>理解率(%)</label>
          <input v-model.number="training.comprehension" type="number" class="form-input" placeholder="理解率" min="0" max="100" />
        </div>
        <el-button type="primary" @click="submitTraining" :loading="submitting">
          🚀 提交记录
        </el-button>
      </div>
      <div v-if="lastResult" class="training-result">
        <h4>📊 本次训练结果</h4>
        <div class="result-grid">
          <div class="result-item">
            <div class="result-value">{{ lastResult.wpm }}</div>
            <div class="result-label">WPM</div>
          </div>
          <div class="result-item">
            <div class="result-value">{{ lastResult.comprehension }}%</div>
            <div class="result-label">理解率</div>
          </div>
          <div class="result-item">
            <div class="result-value">{{ lastResult.efficiencyScore }}</div>
            <div class="result-label">效率分</div>
          </div>
          <div class="result-item">
            <div class="result-value">{{ lastResult.targetWPM }}</div>
            <div class="result-label">目标WPM</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <h3>📋 训练历史</h3>
      <div class="history-table" v-if="history?.length">
        <div class="history-header">
          <span>科目</span>
          <span>字数</span>
          <span>用时</span>
          <span>WPM</span>
          <span>理解率</span>
          <span>效率分</span>
        </div>
        <div v-for="(h, i) in history" :key="i" class="history-row">
          <span>{{ subjectIcon(h.subject) }} {{ subjectLabel(h.subject) }}</span>
          <span>{{ h.word_count || 0 }}词</span>
          <span>{{ Math.round((h.actual_time || 0) / 60) }}min</span>
          <span :class="wpmClass(h.wpm)">{{ h.wpm }}</span>
          <span>{{ h.comprehension_score || 0 }}%</span>
          <span :class="effClass(h.efficiency_score)">{{ h.efficiency_score || 0 }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>还没有训练记录，开始第一次速度阅读训练吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { speedReadingAPI } from '@/api'

const subjectStats = ref([])
const levelData = ref({})
const history = ref([])
const userWpm = computed(() => levelData.value?.userWpm || 0)

const training = ref({
  subject: 'reading',
  wordCount: 500,
  timeSpent: 180,
  comprehension: 80,
})
const submitting = ref(false)
const lastResult = ref(null)

const wpmColor = computed(() => {
  if (userWpm.value >= 400) return '#9C27B0'
  if (userWpm.value >= 300) return '#FF9800'
  if (userWpm.value >= 200) return '#2196F3'
  return '#4CAF50'
})

const progressPercent = computed(() => {
  if (!levelData.value?.nextLevel) return 100
  const current = userWpm.value
  const next = levelData.value.nextLevel.minWpm
  return Math.min(100, Math.max(0, ((current - (levelData.value.currentLevel?.minWpm || 0)) / (next - (levelData.value.currentLevel?.minWpm || 0))) * 100))
})

const submitTraining = async () => {
  if (!training.value.wordCount || !training.value.timeSpent) return
  submitting.value = true
  try {
    const res = await speedReadingAPI.complete(training.value)
    lastResult.value = res.data?.data
  } catch (e) {
    console.error('训练提交失败:', e)
    lastResult.value = { wpm: Math.round(training.value.wordCount / (training.value.timeSpent / 60)), comprehension: training.value.comprehension, efficiencyScore: 75, targetWPM: 300 }
  } finally {
    submitting.value = false
  }
  loadData()
}

const loadData = async () => {
  try {
    const [statsRes, levelRes, historyRes] = await Promise.allSettled([
      speedReadingAPI.stats(),
      speedReadingAPI.levels(),
      speedReadingAPI.history({ limit: 20 }),
    ])
    subjectStats.value = statsRes.status === 'fulfilled' ? statsRes.value.data?.data || [] : []
    levelData.value = levelRes.status === 'fulfilled' ? levelRes.value.data?.data || {} : {}
    history.value = historyRes.status === 'fulfilled' ? historyRes.value.data?.data || [] : []
  } catch (_) {}
}

const subjectIcon = (s) => ({ reading: '📖', listening: '🎧', writing: '✍️', speaking: '🗣️' }[s] || '📖')
const subjectLabel = (s) => ({ reading: '阅读', listening: '听力', writing: '写作', speaking: '口语' }[s] || s)

const wpmClass = (wpm) => {
  if (wpm >= 350) return 'wpm-excellent'
  if (wpm >= 250) return 'wpm-good'
  if (wpm >= 150) return 'wpm-ok'
  return 'wpm-low'
}

const effClass = (score) => {
  if (score >= 80) return 'eff-excellent'
  if (score >= 60) return 'eff-good'
  return 'eff-low'
}

onMounted(() => loadData())
</script>

<style scoped>
.speed-reading-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 24px; margin: 0 0 4px; }
.subtitle { color: var(--text-secondary); margin: 0; }

.level-card {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
.level-icon { font-size: 48px; }
.level-info { flex: 1; }
.level-name { font-size: 20px; font-weight: 800; color: #1565C0; margin-bottom: 4px; }
.level-desc { font-size: 13px; color: #1976D2; }
.level-wpm { flex-shrink: 0; }
.gauge-svg { width: 120px; height: 60px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border);
}
.stat-icon { font-size: 24px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.stat-sub { font-size: 11px; color: #999; margin-top: 2px; display: flex; flex-direction: column; gap: 2px; }

.levels-section, .progress-section, .training-card, .history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  margin-bottom: 24px;
}
.levels-section h3, .progress-section h3, .training-card h3, .history-section h3 {
  margin: 0 0 12px;
}

.levels-list { display: flex; flex-direction: column; gap: 6px; }
.level-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 13px;
}
.level-item.current {
  background: #E3F2FD;
  border: 1px solid #90CAF9;
}
.level-emoji { font-size: 20px; }
.level-name { font-weight: 600; flex: 1; }
.level-range { color: var(--text-secondary); width: 80px; text-align: right; }
.level-current { background: #1976D2; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px; }

.progress-bar {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #2196F3);
  border-radius: 5px;
  transition: width 0.3s;
}
.progress-label { font-size: 12px; color: var(--text-secondary); }

.training-form { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-select, .form-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  min-width: 120px;
}
.form-select:focus, .form-input:focus { border-color: var(--primary); outline: none; }

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 12px;
}
.result-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.result-value { font-size: 24px; font-weight: 800; color: var(--primary); }
.result-label { font-size: 11px; color: var(--text-secondary); }

.history-table { display: flex; flex-direction: column; gap: 4px; }
.history-header {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}
.history-row {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
}
.history-row:hover { background: #f8f9fa; }
.history-row > span { flex: 1; text-align: center; }

.wpm-excellent { color: #4CAF50; font-weight: 700; }
.wpm-good { color: #2196F3; font-weight: 600; }
.wpm-ok { color: #FF9800; }
.wpm-low { color: #f44336; }
.eff-excellent { color: #4CAF50; font-weight: 700; }
.eff-good { color: #2196F3; }
.eff-low { color: #f44336; }

.empty-state { text-align: center; padding: 40px; color: var(--text-secondary); }
</style>
