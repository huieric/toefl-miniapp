/**
 * 用户状态管理（Vue reactive store）
 * 纯前端 localStorage 模拟，适配静态部署
 */
import { reactive, computed } from 'vue'

const state = reactive({
  // 用户基本信息
  token: localStorage.getItem('token') || '',
  userInfo: (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} }
  })(),
  // 会员状态
  membership: (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}').membership || 'free' } catch { return 'free' }
  })(),
  // 每日用量追踪（日期隔离）
  dailyUsage: (() => {
    try {
      const data = JSON.parse(localStorage.getItem('toefl_daily_usage') || '{}')
      // 日期不对则重置
      const today = new Date().toISOString().slice(0, 10)
      if (data.date !== today) return { date: today, questionsDone: 0, aiTalkMinutes: 0 }
      return data
    } catch {
      return { date: new Date().toISOString().slice(0, 10), questionsDone: 0, aiTalkMinutes: 0 }
    }
  })(),
})

// 免费用户限制
const FREE_LIMITS = {
  questionsPerDay: 20,   // 每日做题数上限
  aiTalkMinutesPerDay: 10, // 每日 AI 陪练时长上限（分钟）
}

const saveDailyUsage = () => {
  localStorage.setItem('toefl_daily_usage', JSON.stringify(state.dailyUsage))
}

const saveUserInfo = () => {
  localStorage.setItem('userInfo', JSON.stringify(state.userInfo))
}

export function useUserStore() {
  const isPremium = computed(() => state.membership === 'premium')
  const isFree = computed(() => state.membership === 'free')

  // 今日已做题数
  const todayQuestions = computed(() => state.dailyUsage.questionsDone)
  const todayAiMinutes = computed(() => state.dailyUsage.aiTalkMinutes)
  const questionsRemaining = computed(() => Math.max(0, FREE_LIMITS.questionsPerDay - state.dailyUsage.questionsDone))
  const aiMinutesRemaining = computed(() => Math.max(0, FREE_LIMITS.aiTalkMinutesPerDay - state.dailyUsage.aiTalkMinutes))

  // 检查是否达到免费限制
  const canDoQuestion = computed(() => isPremium.value || state.dailyUsage.questionsDone < FREE_LIMITS.questionsPerDay)
  const canUseAiTalk = computed(() => isPremium.value || state.dailyUsage.aiTalkMinutes < FREE_LIMITS.aiTalkMinutesPerDay)

  // 增加用量
  const addQuestionCount = (n = 1) => {
    resetIfNewDay()
    state.dailyUsage.questionsDone += n
    saveDailyUsage()
  }

  const addAiTalkMinutes = (mins = 1) => {
    resetIfNewDay()
    state.dailyUsage.aiTalkMinutes += mins
    saveDailyUsage()
  }

  // 如果跨天则重置
  const resetIfNewDay = () => {
    const today = new Date().toISOString().slice(0, 10)
    if (state.dailyUsage.date !== today) {
      state.dailyUsage = { date: today, questionsDone: 0, aiTalkMinutes: 0 }
      saveDailyUsage()
    }
  }

  // 登录后更新状态
  const setUser = (user) => {
    state.userInfo = user || {}
    state.membership = user?.membership || 'free'
    saveUserInfo()
  }

  const setMembership = (type) => {
    state.membership = type // 'free' | 'premium'
    state.userInfo.membership = type
    saveUserInfo()
  }

  const logout = () => {
    state.token = ''
    state.userInfo = {}
    state.membership = 'free'
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    state,
    isPremium,
    isFree,
    todayQuestions,
    todayAiMinutes,
    questionsRemaining,
    aiMinutesRemaining,
    canDoQuestion,
    canUseAiTalk,
    addQuestionCount,
    addAiTalkMinutes,
    resetIfNewDay,
    setUser,
    setMembership,
    logout,
    FREE_LIMITS,
  }
}
