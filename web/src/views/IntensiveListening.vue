<template>
  <div class="intensive-listening-page">
    <!-- 精听段落列表 -->
    <div class="pass-list-section">
      <h2>🎧 听力精听</h2>
      <p class="section-desc">逐句精听 + 听写模式，提升听力理解力</p>
      
      <div class="pass-cards">
        <div class="pass-card" v-for="pass in passes" :key="pass.id" @click="selectPass(pass)">
          <div class="pass-badge" :class="pass.difficulty">
            {{ pass.difficulty === 'easy' ? '🟢 基础' : pass.difficulty === 'medium' ? '🟡 中级' : '🔴 高级' }}
          </div>
          <h3>{{ pass.title }}</h3>
          <div class="pass-meta">
            <span>📝 {{ pass.sectionCount }} 句</span>
            <span>⏱️ {{ Math.round(pass.estimatedDuration / 60 * 10) / 10 }} 分钟</span>
            <span>📊 {{ pass.totalWordCount }} 词</span>
          </div>
          <button class="start-btn" @click.stop="startIntensive(pass)">开始精听</button>
        </div>
      </div>
    </div>

    <!-- 精听会话 -->
    <div class="listening-session" v-if="currentPass && !showResults">
      <div class="session-header">
        <button class="back-btn" @click="currentPass = null">← 返回</button>
        <h3>{{ currentPass.title }}</h3>
        <div class="session-controls">
          <select v-model="playbackRate" class="rate-select">
            <option v-for="rate in playbackRates" :key="rate.value" :value="rate.value">{{ rate.label }}</option>
          </select>
          <div class="mode-toggle">
            <button :class="{ active: mode === 'intensive' }" @click="mode = 'intensive'">精听</button>
            <button :class="{ active: mode === 'dictation' }" @click="mode = 'dictation'">听写</button>
          </div>
        </div>
      </div>

      <div class="section-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">句子 {{ currentSectionIndex + 1 }} / {{ currentPass.sections.length }}</span>
      </div>

      <div class="current-section" v-if="currentPass.sections[currentSectionIndex]">
        <div class="section-controls">
          <button class="play-btn" @click="playCurrent">▶ 播放</button>
          <button class="replay-btn" @click="replayCurrent">🔄 重播</button>
        </div>
        
        <!-- 精听模式 -->
        <div class="intensive-mode" v-if="mode === 'intensive'">
          <p class="section-text">{{ currentPass.sections[currentSectionIndex].text }}</p>
          <div class="keywords" v-if="currentPass.sections[currentSectionIndex].keywords.length > 0">
            <span class="kw-label">关键词：</span>
            <span class="kw-tag" v-for="kw in currentPass.sections[currentSectionIndex].keywords" :key="kw">{{ kw }}</span>
          </div>
          <div class="vocab-list" v-if="currentPass.sections[currentSectionIndex].vocabulary.length > 0">
            <span class="vocab-title">重点词汇：</span>
            <div class="vocab-item" v-for="v in currentPass.sections[currentSectionIndex].vocabulary" :key="v.word">
              <span class="vocab-word">{{ v.word }}</span>
              <span class="vocab-phonetic">{{ v.phonetic }}</span>
              <span class="vocab-meaning">{{ v.meaning }}</span>
            </div>
          </div>
        </div>
        
        <!-- 听写模式 -->
        <div class="dictation-mode" v-if="mode === 'dictation'">
          <p class="dictation-hint">🎧 听录音并填写你听到的内容</p>
          <textarea v-model="dictationAnswers[currentSectionIndex]" class="dictation-input" rows="3"
            placeholder="在此输入你听到的内容..."></textarea>
          <button class="check-btn" @click="checkDictation">检查答案</button>
          <div class="dictation-result" v-if="dictationResults[currentSectionIndex] !== undefined">
            <span class="accuracy-badge" :class="dictationResults[currentSectionIndex] >= 80 ? 'good' : 'poor'">
              准确率: {{ dictationResults[currentSectionIndex] }}%
            </span>
          </div>
        </div>
        
        <div class="section-nav">
          <button class="nav-btn prev" @click="prevSection" :disabled="currentSectionIndex <= 0">← 上一句</button>
          <button class="nav-btn next" @click="nextSection" :disabled="currentSectionIndex >= currentPass.sections.length - 1">下一句 →</button>
        </div>
      </div>
    </div>

    <!-- 精听结果 -->
    <div class="listening-results" v-if="showResults">
      <div class="result-header">
        <span class="result-emoji">🎉</span>
        <h2>精听完成！</h2>
      </div>
      
      <div class="result-stats">
        <div class="result-stat">
          <span class="stat-value">{{ overallAccuracy }}</span>
          <span class="stat-label">平均准确率</span>
        </div>
        <div class="result-stat">
          <span class="stat-value">{{ totalTime }}s</span>
          <span class="stat-label">总用时</span>
        </div>
        <div class="result-stat">
          <span class="stat-value">{{ dictationResults.length }}</span>
          <span class="stat-label">完成句子</span>
        </div>
      </div>

      <div class="result-grade" :class="resultGrade">
        <span class="grade-text">{{ resultGrade }}</span>
      </div>

      <div class="section-accuracies">
        <h4>各句准确率</h4>
        <div class="accuracy-bar" v-for="(acc, idx) in dictationResults" :key="idx">
          <span class="bar-label">句子 {{ idx + 1 }}</span>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: acc + '%', background: getAccuracyColor(acc) }"></div>
          </div>
          <span class="bar-value">{{ acc }}%</span>
        </div>
      </div>

      <button class="result-close-btn" @click="closeResults">返回</button>
    </div>

    <!-- 统计 -->
    <div class="stats-section">
      <h2>📊 精听统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <span class="stat-value">{{ stats.totalSessions }}</span>
          <span class="stat-label">训练次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">{{ stats.avgAccuracy }}%</span>
          <span class="stat-label">平均准确率</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏱️</span>
          <span class="stat-value">{{ stats.totalMinutes }}分钟</span>
          <span class="stat-label">总训练时间</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📈</span>
          <span v-for="t in stats.recentTrend" :key="t.day" :style="{height: (t.accuracy/100*60)+'px'}" class="stat-value trend-bar">
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { intensiveListeningAPI } from '@/api'

export default {
  name: 'IntensiveListening',
  setup() {
    const passes = ref([])
    const stats = ref({ totalSessions: 2, avgAccuracy: 89, totalMinutes: 12, recentTrend: [85, 88, 90, 87, 92] })
    const currentPass = ref(null)
    const currentSectionIndex = ref(0)
    const mode = ref('intensive')
    const playbackRate = ref(1.0)
    const dictationAnswers = ref([])
    const dictationResults = ref([])
    const showResults = ref(false)
    const overallAccuracy = ref(0)
    const totalTime = ref(0)

    const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5].map(r => ({ label: r + 'x', value: r }))

    const progressPercent = computed(() => {
      if (!currentPass.value) return 0
      return Math.round(((currentSectionIndex.value + 1) / currentPass.value.sections.length) * 100)
    })

    const currentSection = computed(() => {
      return currentPass.value?.sections[currentSectionIndex.value]
    })

    const resultGrade = computed(() => {
      const acc = overallAccuracy.value
      if (acc >= 95) return 'S'
      if (acc >= 85) return 'A'
      if (acc >= 70) return 'B'
      return 'C'
    })

    async function loadPasses() {
      try {
        const res = await intensiveListeningAPI.getAll()
        const data = res.data?.data
        if (data) {
          passes.value = data.passes
          stats.value = data.stats
        }
      } catch (e) {
        passes.value = [
          { id: 'listen-001', title: '校园公告 - 图书馆搬迁', difficulty: 'easy', sectionCount: 4, totalWordCount: 55, estimatedDuration: 45 },
          { id: 'listen-002', title: '学术讲座 - 气候变化', difficulty: 'hard', sectionCount: 3, totalWordCount: 41, estimatedDuration: 35 },
        ]
      }
    }

    function selectPass(pass) {
      currentPass.value = pass
      currentSectionIndex.value = 0
      dictationAnswers.value = new Array(pass.sections.length).fill('')
      dictationResults.value = new Array(pass.sections.length).fill(null)
    }

    function startIntensive(pass) {
      selectPass(pass)
      showResults.value = false
    }

    function playCurrent() {
      // 播放当前句子的音频
    }

    function replayCurrent() {
      // 重播当前句子
    }

    function checkDictation() {
      // 模拟听写检查
      dictationResults.value[currentSectionIndex.value] = Math.floor(Math.random() * 20) + 80
    }

    function nextSection() {
      if (currentSectionIndex.value < currentPass.value.sections.length - 1) {
        currentSectionIndex.value++
      } else {
        // 完成所有句子
        showResults.value = true
        overallAccuracy.value = Math.round(
          dictationResults.value.filter(r => r !== null).reduce((s, a) => s + a, 0) / dictationResults.value.filter(r => r !== null).length
        )
        totalTime.value = Math.floor(Math.random() * 100) + 120
      }
    }

    function prevSection() {
      if (currentSectionIndex.value > 0) {
        currentSectionIndex.value--
      }
    }

    function closeResults() {
      showResults.value = false
      currentPass.value = null
    }

    function getAccuracyColor(acc) {
      if (acc >= 90) return '#10b981'
      if (acc >= 70) return '#f59e0b'
      return '#ef4444'
    }

    onMounted(() => loadPasses())

    return {
      passes,
      stats,
      currentPass,
      currentSectionIndex,
      mode,
      playbackRates,
      playbackRate,
      dictationAnswers,
      dictationResults,
      showResults,
      overallAccuracy,
      totalTime,
      progressPercent,
      currentSection,
      resultGrade,
      selectPass,
      startIntensive,
      playCurrent,
      replayCurrent,
      checkDictation,
      nextSection,
      prevSection,
      closeResults,
      getAccuracyColor,
    }
  },
}
</script>

<style scoped>
.intensive-listening-page { padding: 24px; max-width: 1000px; margin: 0 auto; }
.section-desc { color: #666; margin-bottom: 20px; }

/* 段落卡片 */
.pass-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
.pass-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; }
.pass-card:hover { transform: translateY(-4px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.pass-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-bottom: 12px; }
.pass-badge.easy { background: #d1fae5; color: #065f46; }
.pass-badge.medium { background: #fef3c7; color: #92400e; }
.pass-badge.hard { background: #fee2e2; color: #991b1b; }
.pass-card h3 { margin: 0 0 8px 0; font-size: 16px; }
.pass-meta { display: flex; gap: 12px; font-size: 13px; color: #999; margin-bottom: 12px; }
.start-btn { width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

/* 会话 */
.listening-session { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); margin-bottom: 32px; }
.session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.back-btn { background: none; border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.session-controls { display: flex; align-items: center; gap: 12px; }
.rate-select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; }
.mode-toggle { display: flex; gap: 8px; }
.mode-toggle button { padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
.mode-toggle button.active { background: #667eea; color: white; border-color: #667eea; }

.section-progress { margin-bottom: 20px; }
.progress-bar { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }
.progress-text { font-size: 12px; color: #999; }

.current-section { padding: 20px; background: #f8f9fa; border-radius: 12px; }
.section-controls { display: flex; gap: 12px; margin-bottom: 16px; }
.play-btn, .replay-btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.play-btn { background: #667eea; color: white; }
.replay-btn { background: #f0f0f0; }

.intensive-mode .section-text { font-size: 16px; line-height: 1.8; margin-bottom: 16px; }
.keywords, .vocab-list { margin-bottom: 12px; }
.kw-label, .vocab-title { font-size: 13px; font-weight: 600; color: #666; }
.kw-tag { display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 12px; margin: 0 4px 4px 0; }
.vocab-item { display: flex; gap: 8px; padding: 4px 0; font-size: 13px; }
.vocab-word { font-weight: 600; color: #333; }
.vocab-phonetic { color: #667eea; }
.vocab-meaning { color: #666; }

.dictation-mode .dictation-hint { font-size: 14px; color: #666; margin-bottom: 12px; }
.dictation-input { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical; }
.dictation-input:focus { border-color: #667eea; outline: none; }
.check-btn { margin-top: 12px; padding: 8px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; }
.accuracy-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; margin-top: 12px; font-weight: 600; }
.accuracy-badge.good { background: #d1fae5; color: #065f46; }
.accuracy-badge.poor { background: #fee2e2; color: #991b1b; }

.section-nav { display: flex; gap: 12px; margin-top: 16px; }
.nav-btn { flex: 1; padding: 10px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; }

/* 结果 */
.listening-results { background: white; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.result-header .result-emoji { font-size: 64px; display: block; }
.result-stats { display: flex; justify-content: space-around; margin: 24px 0; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #667eea; }
.stat-label { font-size: 12px; color: #999; }
.result-grade { padding: 16px; border-radius: 12px; font-size: 48px; font-weight: 900; display: inline-block; margin: 16px 0; }
.result-grade.S { background: #fef3c7; color: #92400e; }
.result-grade.A { background: #d1fae5; color: #065f46; }
.result-grade.B { background: #e0e7ff; color: #3730a3; }

.section-accuracies { text-align: left; margin: 24px 0; }
.accuracy-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.bar-track { flex: 1; height: 12px; background: #f0f0f0; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
.bar-value { font-size: 13px; font-weight: 600; width: 40px; }

.result-close-btn { padding: 12px 32px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }

/* 统计 */
.stats-section { margin-bottom: 32px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.stat-icon { font-size: 24px; display: block; margin-bottom: 8px; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .result-stats { flex-direction: column; gap: 16px; }
}
</style>
