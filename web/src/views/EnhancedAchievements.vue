<template>
  <div class="enhanced-achievements-page">
    <!-- 概览 -->
    <div class="achievements-hero">
      <div class="hero-content">
        <h2>🏆 成就徽章</h2>
        <p class="desc">多维度成就系统，记录每一次进步</p>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="value">{{ stats.totalUnlocked }}</span>
            <span class="label">已解锁</span>
          </div>
          <div class="hero-stat">
            <span class="value">{{ stats.totalAvailable }}</span>
            <span class="label">总成就</span>
          </div>
          <div class="hero-stat">
            <span class="value">🔥 {{ stats.currentStreak }}</span>
            <span class="label">连续打卡</span>
          </div>
          <div class="hero-stat">
            <span class="value">{{ stats.totalXP }}</span>
            <span class="label">总XP</span>
          </div>
        </div>
      </div>
      <div class="season-banner">
        <h3>📅 {{ currentSeason?.name }}</h3>
        <p>当前排名: <strong>#{{ stats.seasonRank }}</strong></p>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs">
      <button class="cat-tab" :class="{ active: activeCat === 'all' }" @click="activeCat = 'all'">全部</button>
      <button class="cat-tab" :class="{ active: activeCat === cat.id }" v-for="cat in categories" :key="cat.id" @click="activeCat = cat.id">
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- 徽章等级进度 -->
    <div class="tier-progress">
      <div class="tier-card" v-for="tier in ['bronze', 'silver', 'gold', 'diamond']" :key="tier">
        <span class="tier-icon">{{ tierIcons[tier] }}</span>
        <span class="tier-name">{{ tierNames[tier] }}</span>
        <div class="tier-bar">
          <div class="tier-fill" :style="{ width: getTierPercent(tier) + '%' }"></div>
        </div>
        <span class="tier-count">{{ getTierCount(tier) }} / {{ getTierTotal(tier) }}</span>
      </div>
    </div>

    <!-- 成就网格 -->
    <div class="achievements-grid">
      <div class="achievement-card" v-for="ach in filteredAchievements" :key="ach.id"
        :class="{ unlocked: ach.unlocked, tier: ach.tier }">
        <div class="ach-icon-wrap" :style="{ background: getTierBg(ach.tier) }">
          <span class="ach-icon">{{ ach.icon }}</span>
          <span class="ach-tier-badge" v-if="ach.unlocked">{{ tierEmojis[ach.tier] }}</span>
        </div>
        <div class="ach-info">
          <span class="ach-name">{{ ach.name }}</span>
          <span class="ach-desc">{{ ach.description }}</span>
        </div>
        <div class="ach-progress" v-if="!ach.unlocked">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: ach.progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ ach.condition.current }} / {{ ach.condition.target }}</span>
        </div>
        <div class="ach-unlocked" v-else>
          <span class="unlocked-date">{{ ach.unlockedDate }}</span>
          <span class="unlocked-badge">✅</span>
        </div>
      </div>
    </div>

    <!-- 赛季排行榜 -->
    <div class="season-leaderboard" v-if="currentSeason">
      <h3>🏅 本赛季排行榜</h3>
      <div class="leaderboard">
        <div class="leaderboard-header">
          <span class="lb-rank">排名</span>
          <span class="lb-name">玩家</span>
          <span class="lb-score">分数</span>
          <span class="lb-level">等级</span>
        </div>
        <div class="lb-row" v-for="player in currentSeason.topPlayers" :key="player.rank"
          :class="{ 'is-user': player.isUser }">
          <span class="lb-rank">{{ player.rank <= 3 ? tierEmojis[player.level === '大师' ? 'diamond' : player.level === '钻石' ? 'gold' : player.level === '铂金' ? 'silver' : 'bronze'] : '#' + player.rank }}</span>
          <span class="lb-name">{{ player.name }}</span>
          <span class="lb-score">{{ player.score.toLocaleString() }}</span>
          <span class="lb-level">{{ player.level }}</span>
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <div class="achievement-wall">
      <h3>🎨 成就墙</h3>
      <div class="wall-grid">
        <div class="wall-piece unlocked" v-for="ach in unlockedAchievements" :key="ach.id"
          :style="{ background: getTierBg(ach.tier) }">
          <span class="wall-icon">{{ ach.icon }}</span>
          <span class="wall-name">{{ ach.name }}</span>
        </div>
        <div class="wall-piece locked" v-for="ach in lockedAchievements" :key="'l-'+ach.id">
          <span class="wall-icon">🔒</span>
          <span class="wall-name">{{ ach.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { achievementsAPI } from '@/api'

const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎' }
const tierNames = { bronze: '青铜', silver: '白银', gold: '黄金', diamond: '钻石' }
const tierEmojis = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎' }
const tierColors = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', diamond: '#b9f2ff' }
const tierBg = { bronze: '#fef3c7', silver: '#f0f9ff', gold: '#fef9c3', diamond: '#f0fdf4' }

const MOCK_ACHIEVEMENTS = [
  // 学习达人
  { id: 'a1', name: '初试牛刀', description: '完成第一次学习', icon: '📖', category: 'learning', tier: 'bronze', condition: { type: 'count', target: 1, current: 1 }, unlocked: true, unlockedDate: '2024-01-15', progress: 100 },
  { id: 'a2', name: '学海无涯', description: '完成100次学习', icon: '📚', category: 'learning', tier: 'silver', condition: { type: 'count', target: 100, current: 67 }, unlocked: false, progress: 67 },
  { id: 'a3', name: '博学多才', description: '完成500次学习', icon: '🎓', category: 'learning', tier: 'gold', condition: { type: 'count', target: 500, current: 67 }, unlocked: false, progress: 13 },
  // 做题能手
  { id: 'a5', name: '小试锋芒', description: '完成10道题目', icon: '✅', category: 'practice', tier: 'bronze', condition: { type: 'count', target: 10, current: 10 }, unlocked: true, unlockedDate: '2024-01-18', progress: 100 },
  { id: 'a6', name: '熟能生巧', description: '完成100道题目', icon: '🎯', category: 'practice', tier: 'silver', condition: { type: 'count', target: 100, current: 78 }, unlocked: false, progress: 78 },
  // 坚持不懈
  { id: 'a9', name: '三日打铁', description: '连续打卡3天', icon: '🔥', category: 'streak', tier: 'bronze', condition: { type: 'streak', target: 3, current: 7 }, unlocked: true, unlockedDate: '2024-01-20', progress: 100 },
  { id: 'a10', name: '一周达人', description: '连续打卡7天', icon: '🌟', category: 'streak', tier: 'silver', condition: { type: 'streak', target: 7, current: 7 }, unlocked: true, unlockedDate: '2024-01-26', progress: 100 },
  { id: 'a11', name: '月之光华', description: '连续打卡30天', icon: '🌙', category: 'streak', tier: 'gold', condition: { type: 'streak', target: 30, current: 7 }, unlocked: false, progress: 23 },
  { id: 'a12', name: '百日冲刺', description: '连续打卡100天', icon: '💎', category: 'streak', tier: 'diamond', condition: { type: 'streak', target: 100, current: 7 }, unlocked: false, progress: 7 },
  // 精通大师
  { id: 'a13', name: '阅读先锋', description: '阅读正确率90%以上', icon: '📖', category: 'mastery', tier: 'silver', condition: { type: 'accuracy', target: 90, current: 85 }, unlocked: false, progress: 94 },
  { id: 'a14', name: '听力达人', description: '听力正确率90%以上', icon: '🎧', category: 'mastery', tier: 'silver', condition: { type: 'accuracy', target: 90, current: 82 }, unlocked: false, progress: 91 },
  // 赛季荣誉
  { id: 'a16', name: '春季冠军', description: '春季赛季排名前10', icon: '🏆', category: 'season', tier: 'gold', condition: { type: 'rank', target: 10, current: 15 }, unlocked: false, progress: 67 },
]

const CATEGORIES = [
  { id: 'learning', name: '学习达人', icon: '📚', color: '#3b82f6' },
  { id: 'practice', name: '做题能手', icon: '✍️', color: '#10b981' },
  { id: 'streak', name: '坚持不懈', icon: '🔥', color: '#ef4444' },
  { id: 'mastery', name: '精通大师', icon: '🏆', color: '#8b5cf6' },
  { id: 'season', name: '赛季荣誉', icon: '⭐', color: '#ec4899' },
]

const CURRENT_SEASON = {
  id: 'spring-2024',
  name: '2024春季赛季',
  startDate: '2024-03-01',
  endDate: '2024-05-31',
  status: 'active',
  topPlayers: [
    { rank: 1, name: '张明', score: 15000, level: '大师' },
    { rank: 2, name: '李华', score: 13500, level: '钻石' },
    { rank: 3, name: '王小红', score: 12800, level: '铂金' },
    { rank: 4, name: '赵强', score: 11200, level: '黄金' },
    { rank: 5, name: '你', score: 10500, level: '黄金', isUser: true },
  ],
}

export default {
  name: 'EnhancedAchievements',
  setup() {
    const achievements = ref(MOCK_ACHIEVEMENTS)
    const categories = ref(CATEGORIES)
    const currentSeason = ref(CURRENT_SEASON)
    const activeCat = ref('all')
    const stats = ref({ totalUnlocked: 4, totalAvailable: 12, currentStreak: 7, longestStreak: 14, totalXP: 10500, seasonRank: 5 })

    const filteredAchievements = computed(() => {
      if (activeCat.value === 'all') return achievements.value
      return achievements.value.filter(a => a.category === activeCat.value)
    })

    const unlockedAchievements = computed(() => achievements.value.filter(a => a.unlocked))
    const lockedAchievements = computed(() => achievements.value.filter(a => !a.unlocked))

    function getTierPercent(tier) {
      const total = achievements.value.filter(a => a.tier === tier).length
      const unlocked = achievements.value.filter(a => a.tier === tier && a.unlocked).length
      return total > 0 ? Math.round((unlocked / total) * 100) : 0
    }

    function getTierCount(tier) {
      return achievements.value.filter(a => a.tier === tier && a.unlocked).length
    }

    function getTierTotal(tier) {
      return achievements.value.filter(a => a.tier === tier).length
    }

    function getTierBg(tier) {
      return tierBg[tier] || '#f0f0f0'
    }

    onMounted(async () => {
      try {
        const res = await achievementsAPI.getOverview()
        // 使用 API 数据
      } catch {
        // 使用模拟数据
      }
    })

    return {
      achievements,
      categories,
      currentSeason,
      activeCat,
      stats,
      tierIcons,
      tierNames,
      tierEmojis,
      filteredAchievements,
      unlockedAchievements,
      lockedAchievements,
      getTierPercent,
      getTierCount,
      getTierTotal,
      getTierBg,
    }
  },
}
</script>

<style scoped>
.enhanced-achievements-page { padding: 24px; max-width: 1000px; margin: 0 auto; }

/* 英雄区 */
.achievements-hero { background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 16px; padding: 32px; color: white; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.hero-content h2 { margin: 0 0 8px 0; font-size: 24px; }
.desc { opacity: 0.9; margin-bottom: 20px; }
.hero-stats { display: flex; gap: 24px; }
.hero-stat { text-align: center; }
.hero-stat .value { display: block; font-size: 28px; font-weight: 700; }
.hero-stat .label { font-size: 12px; opacity: 0.8; }
.season-banner { background: rgba(255,255,255,0.2); padding: 16px 24px; border-radius: 12px; text-align: center; }
.season-banner h3 { margin: 0 0 8px 0; }

/* 分类标签 */
.category-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.cat-tab { padding: 8px 16px; background: white; border: 2px solid #e5e7eb; border-radius: 20px; cursor: pointer; font-size: 13px; }
.cat-tab.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }

/* 等级进度 */
.tier-progress { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.tier-card { background: white; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.tier-icon { font-size: 24px; display: block; margin-bottom: 4px; }
.tier-name { font-size: 12px; color: #64748b; display: block; margin-bottom: 8px; }
.tier-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.tier-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); }
.tier-count { font-size: 11px; color: #94a3b8; }

/* 成就网格 */
.achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
.achievement-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 12px; transition: all 0.3s; }
.achievement-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.achievement-card.unlocked { border-left: 4px solid; }
.achievement-card.unlocked.tier-bronze { border-left-color: #cd7f32; }
.achievement-card.unlocked.tier-silver { border-left-color: #c0c0c0; }
.achievement-card.unlocked.tier-gold { border-left-color: #ffd700; }
.achievement-card.unlocked.tier-diamond { border-left-color: #06b6d4; }

.ach-icon-wrap { position: relative; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ach-icon { font-size: 24px; }
.ach-tier-badge { position: absolute; top: -4px; right: -4px; font-size: 12px; }
.ach-info { flex: 1; }
.ach-name { font-size: 14px; font-weight: 600; display: block; }
.ach-desc { font-size: 12px; color: #64748b; display: block; margin-top: 2px; }

.ach-progress { margin-top: 8px; }
.ach-progress .progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }
.ach-progress .progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); }
.progress-text { font-size: 11px; color: #94a3b8; margin-top: 4px; display: block; }

.ach-unlocked { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.unlocked-date { font-size: 11px; color: #94a3b8; }
.unlocked-badge { font-size: 14px; }

/* 排行榜 */
.season-leaderboard { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 32px; }
.season-leaderboard h3 { margin: 0 0 16px 0; }
.leaderboard-header { display: grid; grid-template-columns: 50px 1fr 100px 80px; padding: 8px 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; font-weight: 600; }
.lb-row { display: grid; grid-template-columns: 50px 1fr 100px 80px; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; align-items: center; }
.lb-row.is-user { background: #f0f9ff; font-weight: 600; }
.lb-rank { font-size: 16px; }
.lb-name { font-size: 14px; }
.lb-score { font-size: 14px; font-weight: 600; }
.lb-level { font-size: 12px; color: #64748b; }

/* 成就墙 */
.achievement-wall { margin-bottom: 32px; }
.wall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
.wall-piece { aspect-ratio: 1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s; }
.wall-piece.unlocked { cursor: pointer; }
.wall-piece.unlocked:hover { transform: scale(1.05); }
.wall-piece.locked { background: #f1f5f9; }
.wall-icon { font-size: 24px; }
.wall-name { font-size: 10px; color: #64748b; text-align: center; }
</style>
