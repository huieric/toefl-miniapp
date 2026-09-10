<template>
  <div class="daily-micro-page">
    <!-- 今日概览 -->
    <div class="daily-overview">
      <div class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">{{ streak.currentStreak }}</span>
        <span class="streak-label">天连续</span>
      </div>
      <div class="daily-xp">
        <span class="xp-value">{{ todayXP }}</span>
        <span class="xp-label">今日 XP</span>
      </div>
      <div class="daily-goal">
        <div class="goal-progress">
          <span>今日目标: 3/5 完成</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: dailyProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日一句 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>💬 每日一句</h3>
        <span class="section-date">{{ todayStr }}</span>
      </div>
      <div class="quote-card" :class="{ completed: quoteCompleted }">
        <p class="quote-text">{{ dailyQuote.quote }}</p>
        <p class="quote-translation">{{ dailyQuote.translation }}</p>
        <p class="quote-source">{{ dailyQuote.source }}</p>
        <div class="quote-vocab" v-if="dailyQuote.vocabulary?.length > 0">
          <span class="vocab-title">重点词汇：</span>
          <span class="vocab-item" v-for="v in dailyQuote.vocabulary" :key="v.word">
            {{ v.word }} <small>{{ v.meaning }}</small>
          </span>
        </div>
        <button class="mark-complete" @click="quoteCompleted = true" v-if="!quoteCompleted">
          ✓ 已学习
        </button>
      </div>
    </div>

    <!-- 每日词汇 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>📚 每日词汇</h3>
      </div>
      <div class="word-card">
        <div class="word-front" @click="wordFlipped = !wordFlipped">
          <span class="word-main">{{ dailyWord.word }}</span>
          <span class="word-phonetic">{{ dailyWord.phonetic }}</span>
          <span class="word-hint">点击翻转查看释义</span>
        </div>
        <div class="word-back" v-if="wordFlipped">
          <span class="word-meaning">{{ dailyWord.meaning }}</span>
          <p class="word-example">"{{ dailyWord.example }}"</p>
          <div class="word-context">
            <span class="context-label">语境：</span>
            <span>{{ dailyWord.context }}</span>
          </div>
          <div class="word-synonyms" v-if="dailyWord.synonyms?.length > 0">
            <span class="syn-label">同义词：</span>
            <span class="syn-tag" v-for="s in dailyWord.synonyms" :key="s">{{ s }}</span>
          </div>
          <div class="word-collocations" v-if="dailyWord.collocations?.length > 0">
            <span class="colloc-label">常见搭配：</span>
            <span class="colloc-tag" v-for="c in dailyWord.collocations" :key="c">{{ c }}</span>
          </div>
          <button class="mark-complete" @click="wordCompleted = true" v-if="!wordCompleted">
            ✓ 已掌握
          </button>
        </div>
      </div>
    </div>

    <!-- 今日挑战 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>🎯 今日挑战</h3>
        <span class="challenge-reward">+{{ dailyChallenge.xpReward }} XP</span>
      </div>
      <div class="challenge-card" :class="{ completed: challengeCompleted }">
        <div class="challenge-info">
          <span class="challenge-icon">{{ challengeTypeIcon(dailyChallenge.type) }}</span>
          <div class="challenge-details">
            <span class="challenge-name">{{ dailyChallenge.name }}</span>
            <span class="challenge-desc">{{ dailyChallenge.description }}</span>
          </div>
        </div>
        <div class="challenge-meta">
          <span>⏱️ {{ Math.round(dailyChallenge.duration / 60) }} 分钟</span>
          <span>📝 {{ dailyChallenge.questions }} 题</span>
        </div>
        <button class="start-challenge-btn" @click="startChallenge" v-if="!challengeCompleted">
          开始挑战
        </button>
        <button class="view-results-btn" v-else>
          查看结果
        </button>
      </div>
    </div>

    <!-- 连续打卡 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>📅 打卡记录</h3>
        <span class="longest-streak">最长连续: {{ streak.longestStreak }} 天</span>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day" v-for="(day, idx) in calendarDays" :key="idx"
          :class="{ 'today': idx === calendarDays.length - 1, 'completed': day.completed }">
          <span class="day-label">{{ day.label }}</span>
          <span class="day-dot" v-if="day.completed">✓</span>
          <span class="day-dot empty" v-else></span>
        </div>
      </div>
    </div>

    <!-- 学习周报 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>📊 学习周报</h3>
      </div>
      <div class="week-report">
        <div class="report-stats">
          <div class="report-stat">
            <span class="report-value">{{ weeklyReport.totalXP }}</span>
            <span class="report-label">总 XP</span>
          </div>
          <div class="report-stat">
            <span class="report-value">{{ weeklyReport.totalWords }}</span>
            <span class="report-label">学习词汇</span>
          </div>
          <div class="report-stat">
            <span class="report-value">{{ weeklyReport.averageAccuracy }}%</span>
            <span class="report-label">正确率</span>
          </div>
        </div>
        <div class="report-trend">
          <div class="trend-label">本周趋势</div>
          <div class="trend-bars">
            <div class="trend-bar" v-for="day in weeklyReport.weeklyTrend" :key="day.day">
              <div class="bar-fill" :style="{ height: (day.xp / 35 * 100) + '%' }"></div>
              <span class="bar-label">{{ day.day }}</span>
              <span class="bar-value">{{ day.xp }}</span>
            </div>
          </div>
        </div>
        <div class="report-highlights">
          <div class="highlight-item" v-for="h in weeklyReport.highlights" :key="h">
            ✨ {{ h }}
          </div>
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <div class="daily-section">
      <div class="section-header">
        <h3>🏆 成就墙</h3>
      </div>
      <div class="achievements-grid">
        <div class="achievement-card" v-for="ach in achievements" :key="ach.id"
          :class="{ 'unlocked': ach.unlocked }">
          <span class="ach-icon">{{ ach.icon }}</span>
          <span class="ach-name">{{ ach.name }}</span>
          <span class="ach-desc">{{ ach.description }}</span>
          <span class="ach-status" v-if="ach.unlocked">✅ 已解锁</span>
          <span class="ach-status locked" v-else>🔒 未解锁</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { dailyMicroAPI } from '@/api'

export default {
  name: 'DailyMicro',
  setup() {
    const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    const streak = ref({ currentStreak: 7, longestStreak: 14 })
    const todayXP = ref(83)
    const dailyProgress = ref(60)
    const quoteCompleted = ref(true)
    const wordFlipped = ref(false)
    const wordCompleted = ref(false)
    const challengeCompleted = ref(false)

    const dailyQuote = ref({
      id: 1,
      quote: 'The ability to think and think is the most basic tool of our survival.',
      translation: '思考的能力是我们生存的最基本工具。',
      source: '《TOEFL 阅读真题》',
      vocabulary: [
        { word: 'ability', meaning: 'n. 能力' },
        { word: 'survival', meaning: 'n. 生存' },
      ],
    })

    const dailyWord = ref({
      id: 1,
      word: 'pragmatic',
      phonetic: '/præɡˈmætɪk/',
      meaning: 'adj. 务实的，实用的',
      example: 'We need a pragmatic approach to solve this problem.',
      context: 'In business meetings, pragmatic solutions are often preferred over idealistic ones.',
      synonyms: ['practical', 'realistic', 'sensible'],
      collocations: ['pragmatic approach', 'pragmatic solution'],
    })

    const dailyChallenge = ref({
      id: 'challenge-001',
      name: '快速词汇挑战',
      type: 'vocabulary',
      duration: 180,
      questions: 5,
      description: '在 3 分钟内完成 5 个词汇挑战',
      xpReward: 10,
    })

    const calendarDays = ref([
      { label: '周一', completed: true },
      { label: '周二', completed: true },
      { label: '周三', completed: true },
      { label: '周四', completed: false },
      { label: '周五', completed: true },
      { label: '周六', completed: true },
      { label: '今天', completed: true },
    ])

    const weeklyReport = ref({
      totalXP: 185,
      totalWords: 21,
      averageAccuracy: 85,
      weeklyTrend: [
        { day: '周一', xp: 25 },
        { day: '周二', xp: 30 },
        { day: '周三', xp: 20 },
        { day: '周四', xp: 0 },
        { day: '周五', xp: 28 },
        { day: '周六', xp: 35 },
        { day: '周日', xp: 22 },
      ],
      highlights: [
        '最长连续打卡：7 天',
        '总词汇学习：87 个',
        '总练习次数：45 次',
      ],
    })

    const achievements = ref([
      { id: 1, name: '初出茅庐', description: '完成第一次碎片学习', icon: '🎯', unlocked: true },
      { id: 2, name: '三天打卡', description: '连续打卡 3 天', icon: '🔥', unlocked: true },
      { id: 3, name: '一周达人', description: '连续打卡 7 天', icon: '⭐', unlocked: true },
      { id: 4, name: '词汇达人', description: '累计学习 100 个词汇', icon: '📚', unlocked: false, progress: 67, target: 100 },
      { id: 5, name: '百日冲刺', description: '连续打卡 100 天', icon: '🏆', unlocked: false, progress: 12, target: 100 },
    ])

    function challengeTypeIcon(type) {
      const icons = { vocabulary: '📝', grammar: '📖', listening: '🎧', speaking: '🗣️' }
      return icons[type] || '📝'
    }

    function startChallenge() {
      // 导航到挑战页面
    }

    async function loadStreak() {
      try {
        const res = await dailyMicroAPI.getCheckin()
        const data = res.data?.data
        if (data) {
          streak.value = {
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
          }
        }
      } catch (e) {
        console.error('加载打卡状态失败:', e)
      }
    }

    async function loadWeeklyReport() {
      try {
        const res = await dailyMicroAPI.getWeekReport()
        const data = res.data?.data
        if (data) {
          weeklyReport.value = data
        }
      } catch (e) {
        console.error('加载周报失败:', e)
      }
    }

    onMounted(() => {
      loadStreak()
      loadWeeklyReport()
    })

    return {
      todayStr,
      streak,
      todayXP,
      dailyProgress,
      quoteCompleted,
      wordFlipped,
      wordCompleted,
      challengeCompleted,
      dailyQuote,
      dailyWord,
      dailyChallenge,
      calendarDays,
      weeklyReport,
      achievements,
      challengeTypeIcon,
      startChallenge,
    }
  },
}
</script>

<style scoped>
.daily-micro-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 今日概览 */
.daily-overview {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
}

.streak-badge {
  text-align: center;
}

.streak-fire {
  font-size: 32px;
  display: block;
  margin-bottom: 4px;
}

.streak-count {
  font-size: 28px;
  font-weight: 700;
  display: block;
}

.streak-label {
  font-size: 12px;
  opacity: 0.9;
}

.daily-xp {
  text-align: center;
}

.xp-value {
  font-size: 32px;
  font-weight: 700;
  display: block;
}

.xp-label {
  font-size: 12px;
  opacity: 0.9;
}

.daily-goal .goal-progress {
  text-align: center;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 通用区块 */
.daily-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
}

.section-date, .challenge-reward, .longest-streak {
  font-size: 13px;
  color: #999;
}

/* 每日一句 */
.quote-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
}

.quote-card.completed {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.quote-text {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.quote-translation {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.quote-source {
  font-size: 12px;
  color: #999;
  margin: 0 0 12px 0;
}

.quote-vocab {
  margin-bottom: 12px;
}

.vocab-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-right: 8px;
}

.vocab-item {
  display: inline-block;
  padding: 4px 8px;
  background: #f0f7ff;
  color: #667eea;
  border-radius: 8px;
  font-size: 12px;
  margin: 0 4px 4px 0;
}

.vocab-item small {
  color: #999;
}

.mark-complete {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 12px;
}

/* 词汇卡片 */
.word-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.word-front {
  padding: 32px;
  text-align: center;
  cursor: pointer;
}

.word-main {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.word-phonetic {
  font-size: 16px;
  color: #667eea;
  display: block;
  margin-bottom: 12px;
}

.word-hint {
  font-size: 12px;
  color: #999;
}

.word-back {
  padding: 24px;
  background: #f8f9fa;
}

.word-meaning {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.word-example {
  font-size: 14px;
  color: #666;
  font-style: italic;
  margin: 0 0 12px 0;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.word-context {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.context-label {
  font-weight: 600;
}

.word-synonyms, .word-collocations {
  margin-bottom: 8px;
  font-size: 13px;
}

.syn-label, .colloc-label {
  font-weight: 600;
  margin-right: 8px;
}

.syn-tag, .colloc-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f7ff;
  color: #667eea;
  border-radius: 8px;
  font-size: 11px;
  margin: 0 4px 4px 0;
}

/* 挑战卡片 */
.challenge-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.challenge-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.challenge-icon {
  font-size: 32px;
}

.challenge-details {
  flex: 1;
}

.challenge-name {
  font-size: 16px;
  font-weight: 600;
  display: block;
}

.challenge-desc {
  font-size: 13px;
  color: #666;
}

.challenge-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.start-challenge-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.view-results-btn {
  width: 100%;
  padding: 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

/* 打卡日历 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  background: white;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.calendar-day.today {
  border: 2px solid #667eea;
}

.calendar-day.completed {
  background: #ecfdf5;
}

.day-label {
  font-size: 11px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.day-dot {
  font-size: 18px;
  color: #10b981;
}

.day-dot.empty {
  color: #d1d5db;
}

/* 周报 */
.week-report {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.report-stat {
  text-align: center;
}

.report-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  display: block;
}

.report-label {
  font-size: 12px;
  color: #999;
}

.report-trend {
  margin-bottom: 20px;
}

.trend-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
}

.trend-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
}

.trend-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-fill {
  width: 20px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  margin-bottom: 4px;
}

.bar-label {
  font-size: 10px;
  color: #999;
}

.bar-value {
  font-size: 10px;
  color: #667eea;
  font-weight: 600;
}

.report-highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.highlight-item {
  font-size: 13px;
  color: #666;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 成就墙 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0.5;
}

.achievement-card.unlocked {
  opacity: 1;
  border: 2px solid #fbbf24;
}

.ach-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.ach-name {
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.ach-desc {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.ach-status {
  font-size: 11px;
  color: #10b981;
}

.ach-status.locked {
  color: #999;
}

/* 响应式 */
@media (max-width: 600px) {
  .daily-overview {
    flex-direction: column;
    gap: 16px;
  }
  
  .report-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .trend-bars {
    height: 80px;
  }
}
</style>
