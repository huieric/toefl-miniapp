<template>
  <div class="league-page">
    <!-- 联赛段位展示 -->
    <div class="league-hero">
      <div class="hero-tier">
        <span class="tier-icon">{{ currentTier.icon }}</span>
        <h2>{{ currentTier.name }}</h2>
        <p class="tier-color" :style="{ color: currentTier.color }">{{ currentTier.name }}</p>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">{{ userProgress.rank }}</span>
          <span class="stat-label">排名</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userProgress.totalXP }}</span>
          <span class="stat-label">XP</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userWeekly.streak }}天</span>
          <span class="stat-label">连胜</span>
        </div>
      </div>
      <div class="xp-progress">
        <div class="progress-label">
          <span>升级进度</span>
          <span>{{ userProgress.progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: userProgress.progressPercent + '%' }"></div>
        </div>
        <div class="progress-tiers">
          <span :class="{ active: currentTier.name === tier.name }" v-for="tier in LEAGUE_TIERS" :key="tier.name">
            {{ tier.icon }}
          </span>
        </div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div class="leaderboard-section">
      <div class="section-header">
        <h3>🏆 本周排行榜</h3>
        <div class="filter-tabs">
          <button :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">全部</button>
          <button :class="{ active: activeFilter === tier.name }" v-for="tier in LEAGUE_TIERS.slice(0, 4)" :key="tier.name" @click="activeFilter = tier.name">
            {{ tier.icon }} {{ tier.name }}
          </button>
        </div>
      </div>

      <div class="leaderboard-table">
        <div class="table-header">
          <span class="col-rank">排名</span>
          <span class="col-user">用户</span>
          <span class="col-xp">XP</span>
          <span class="col-accuracy">正确率</span>
          <span class="col-streak">连胜</span>
        </div>
        <div class="table-row" :class="{ 'user-row': user.rank === item.rank }" v-for="item in leaderboard" :key="item.rank">
          <span class="col-rank">
            <span :class="['rank-badge', item.rank <= 3 ? 'top-3' : '']">
              {{ item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : '#' + item.rank }}
            </span>
          </span>
          <span class="col-user">
            <div class="user-info">
              <span class="user-name">{{ item.name }}</span>
              <span class="user-tier">{{ item.tier.icon }} {{ item.tier.name }}</span>
            </div>
          </span>
          <span class="col-xp">{{ item.xp.toLocaleString() }}</span>
          <span class="col-accuracy">{{ item.correctRate }}%</span>
          <span class="col-streak">{{ item.streak }}天</span>
        </div>
      </div>
    </div>

    <!-- 联赛成就 -->
    <div class="achievements-section">
      <h3>🏅 联赛成就</h3>
      <div class="achievements-grid">
        <div class="achievement-card" :class="{ unlocked: achievement.unlocked }" v-for="achievement in achievements" :key="achievement.id">
          <span class="achievement-icon">{{ achievement.icon }}</span>
          <div class="achievement-info">
            <h4>{{ achievement.name }}</h4>
            <p>{{ achievement.description }}</p>
          </div>
          <span class="achievement-status" v-if="achievement.unlocked">✅</span>
          <span class="achievement-status locked" v-else>🔒</span>
        </div>
      </div>
    </div>

    <!-- 下周预测 -->
    <div class="forecast-section">
      <h3>📊 下周预测</h3>
      <div class="forecast-grid">
        <div class="forecast-card">
          <span class="forecast-icon">🎯</span>
          <h4>预计获得XP</h4>
          <p class="forecast-value">+{{ Math.floor(Math.random() * 150) + 100 }}</p>
        </div>
        <div class="forecast-card">
          <span class="forecast-icon">📝</span>
          <h4>预计完成题目</h4>
          <p class="forecast-value">{{ Math.floor(Math.random() * 40) + 30 }}题</p>
        </div>
        <div class="forecast-card">
          <span class="forecast-icon">⬆️</span>
          <h4>升级概率</h4>
          <p class="forecast-value">{{ userProgress.progressPercent > 80 ? '高' : '中' }}</p>
        </div>
      </div>
    </div>

    <!-- 每周重置提示 -->
    <div class="reset-notice">
      <span class="reset-icon">⏰</span>
      <div class="reset-info">
        <h4>每周日凌晨重置</h4>
        <p>距重置还有 {{ getDaysUntilReset() }}天</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { leagueAPI } from '@/api'

export default {
  name: 'League',
  setup() {
    const LEAGUE_TIERS = [
      { name: '青铜联赛', icon: '🥉', minXP: 0, color: '#CD7F32' },
      { name: '白银联赛', icon: '🥈', minXP: 500, color: '#C0C0C0' },
      { name: '黄金联赛', icon: '🥇', minXP: 1500, color: '#FFD700' },
      { name: '铂金联赛', icon: '💎', minXP: 3000, color: '#B9F2FF' },
      { name: '钻石联赛', icon: '💠', minXP: 6000, color: '#B9F2FF' },
      { name: '大师联赛', icon: '👑', minXP: 10000, color: '#FF6B6B' },
    ]

    const currentTier = ref(LEAGUE_TIERS[2])
    const userProgress = ref({
      totalXP: 9800,
      rank: 3,
      progressPercent: 65,
    })
    const userWeekly = ref({
      xpEarned: 450,
      problemsSolved: 38,
      correctRate: 82,
      streak: 28,
    })
    const leaderboard = ref([])
    const achievements = ref([])
    const activeFilter = ref('all')

    async function loadLeaderboard() {
      try {
        const res = await leagueAPI.getLeaderboard()
        leaderboard.value = res.data?.data?.users || []
      } catch (e) {
        console.error('加载排行榜失败:', e)
        // Fallback to mock data
        leaderboard.value = [
          { rank: 1, name: '小明', xp: 12500, correctRate: 88, streak: 45, tier: LEAGUE_TIERS[5] },
          { rank: 2, name: '小红', xp: 11200, correctRate: 85, streak: 32, tier: LEAGUE_TIERS[5] },
          { rank: 3, name: '小李', xp: 9800, correctRate: 82, streak: 28, tier: LEAGUE_TIERS[4] },
          { rank: 4, name: '小王', xp: 8500, correctRate: 80, streak: 21, tier: LEAGUE_TIERS[4] },
          { rank: 5, name: '小张', xp: 7200, correctRate: 78, streak: 18, tier: LEAGUE_TIERS[3] },
        ]
      }
    }

    async function loadAchievements() {
      try {
        const res = await leagueAPI.getAchievements()
        achievements.value = res.data?.data?.achievements || []
      } catch (e) {
        console.error('加载成就失败:', e)
        achievements.value = [
          { id: 1, name: '初登赛场', description: '首次参加联赛', icon: '🏁', unlocked: true },
          { id: 2, name: '连胜勇士', description: '连续7天参加练习', icon: '🔥', unlocked: true },
          { id: 3, name: '段位晋升', description: '晋升到更高段位', icon: '⬆️', unlocked: true },
          { id: 4, name: '全服前十', description: '进入全服排行榜前十', icon: '🏆', unlocked: false },
          { id: 5, name: '准确率达人', description: '单次练习正确率100%', icon: '🎯', unlocked: false },
          { id: 6, name: '马拉松选手', description: '累计完成1000道题', icon: '🏃', unlocked: false },
        ]
      }
    }

    function getDaysUntilReset() {
      const now = new Date()
      const dayOfWeek = now.getDay()
      return dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    }

    onMounted(() => {
      loadLeaderboard()
      loadAchievements()
    })

    return {
      LEAGUE_TIERS,
      currentTier,
      userProgress,
      userWeekly,
      leaderboard,
      achievements,
      activeFilter,
      getDaysUntilReset,
    }
  },
}
</script>

<style scoped>
.league-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 英雄区域 */
.league-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  text-align: center;
  margin-bottom: 24px;
}

.hero-tier {
  margin-bottom: 24px;
}

.tier-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 12px;
}

.hero-tier h2 {
  font-size: 28px;
  margin: 0;
}

.tier-color {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.xp-progress {
  margin-top: 20px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f093fb, #f5576c);
  border-radius: 6px;
  transition: width 0.3s;
}

.progress-tiers {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.progress-tiers span {
  font-size: 20px;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.progress-tiers span.active {
  opacity: 1;
  transform: scale(1.2);
}

/* 排行榜 */
.leaderboard-section {
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
  font-size: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tabs button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.filter-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.leaderboard-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 100px 80px 80px;
  padding: 12px 16px;
  background: #f5f5f5;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 80px 80px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  transition: background 0.2s;
}

.table-row:hover {
  background: #fafafa;
}

.table-row.user-row {
  background: #f0f7ff;
  font-weight: 600;
}

.rank-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  font-size: 14px;
}

.rank-badge.top-3 {
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  color: white;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.user-tier {
  font-size: 11px;
  color: #999;
}

.col-xp, .col-accuracy, .col-streak {
  font-size: 14px;
}

/* 成就 */
.achievements-section {
  margin-bottom: 24px;
}

.achievements-section h3 {
  margin-bottom: 16px;
  font-size: 20px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.achievement-card.unlocked {
  border-color: #ffd700;
}

.achievement-card.locked {
  opacity: 0.6;
}

.achievement-icon {
  font-size: 32px;
}

.achievement-info {
  flex: 1;
}

.achievement-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.achievement-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.achievement-status {
  font-size: 20px;
}

.achievement-status.locked {
  opacity: 0.5;
}

/* 预测 */
.forecast-section {
  margin-bottom: 24px;
}

.forecast-section h3 {
  margin-bottom: 16px;
  font-size: 20px;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.forecast-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.forecast-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.forecast-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.forecast-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

/* 重置提示 */
.reset-notice {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.reset-icon {
  font-size: 40px;
}

.reset-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.reset-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 响应式 */
@media (max-width: 600px) {
  .hero-stats {
    gap: 16px;
  }

  .table-header, .table-row {
    grid-template-columns: 50px 1fr 80px 70px 70px;
    font-size: 12px;
  }

  .forecast-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }
}
</style>
