<template>
  <div class="page-container">
    <div class="page-header">
      <h2>AI 导师</h2>
      <p class="subtitle">基于你的练习数据，AI 为你量身定制备考策略</p>
    </div>

    <!-- Tab Switch -->
    <div class="tab-switch">
      <div class="tab-item" :class="{ active: activeTab === 'analysis' }" @click="activeTab = 'analysis'">
        学习分析报告
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">
        向导师提问
      </div>
    </div>

    <!-- ============ Analysis Tab ============ -->
    <template v-if="activeTab === 'analysis'">
      <!-- Data Preview (always visible) -->
      <div class="card" v-if="dataPreview">
        <h3 class="section-title">数据概览</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-value">{{ dataPreview.overall.totalPractice }}</div>
            <div class="overview-label">总练习题数</div>
          </div>
          <div class="overview-item">
            <div class="overview-value">{{ dataPreview.overall.totalExams }}</div>
            <div class="overview-label">模考次数</div>
          </div>
          <div class="overview-item">
            <div class="overview-value">{{ dataPreview.overall.totalWrong }}</div>
            <div class="overview-label">错题总数</div>
          </div>
        </div>
        <div class="subject-bars" v-if="dataPreview.subjectSummary">
          <div v-for="sub in dataPreview.subjectSummary" :key="sub.subject" class="subject-bar">
            <span class="bar-label">{{ subjectNames[sub.subject] }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: sub.accuracy + '%', background: subjectColors[sub.subject] }"></div>
            </div>
            <span class="bar-value">{{ sub.total > 0 ? sub.accuracy + '%' : '未练习' }}</span>
          </div>
        </div>
      </div>

      <!-- Generate Analysis Button -->
      <div class="card" v-if="!analysis && !analysisLoading">
        <div class="generate-prompt">
          <el-icon :size="48" color="#4A90D9"><MagicStick /></el-icon>
          <h3>生成你的专属学习分析</h3>
          <p>AI 导师将分析你的练习数据，预测托福分数，识别薄弱环节，并给出个性化备考建议</p>
          <el-button type="primary" size="large" :loading="analysisLoading" @click="loadAnalysis">
            <el-icon><MagicStick /></el-icon>&nbsp;生成分析报告
          </el-button>
          <p class="quota-hint" v-if="!isPremium">免费用户每日可生成 1 次分析报告</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="card" v-if="analysisLoading">
        <div class="loading-container">
          <el-icon class="is-loading" :size="40" color="#4A90D9"><Loading /></el-icon>
          <p>AI 导师正在分析你的学习数据...</p>
          <p class="loading-sub">这可能需要 10-20 秒，请耐心等待</p>
        </div>
      </div>

      <!-- Needs More Data -->
      <div class="card" v-if="analysis && analysis.needsMoreData">
        <div class="empty-state">
          <el-icon :size="48" color="#E6A23C"><WarningFilled /></el-icon>
          <h3>数据不足</h3>
          <p>{{ analysis.message }}</p>
          <el-button type="primary" @click="$router.push('/reading')">去练习</el-button>
        </div>
      </div>

      <!-- Analysis Result -->
      <template v-if="analysis && !analysis.needsMoreData">
        <!-- Score Prediction -->
        <div class="card score-card">
          <h3 class="section-title">分数预测</h3>
          <div class="score-display">
            <div class="total-score">
              <div class="score-number">{{ analysis.predictedScore.total }}</div>
              <div class="score-max">/ 120</div>
            </div>
            <div class="subject-scores">
              <div v-for="sub in scoreSubjects" :key="sub.key" class="sub-score-item">
                <div class="sub-score-circle" :style="{ borderColor: sub.color }">
                  <span class="sub-score-value">{{ analysis.predictedScore[sub.key] }}</span>
                </div>
                <span class="sub-score-label">{{ sub.label }}</span>
              </div>
            </div>
          </div>
          <div class="default-badge" v-if="analysis.isDefault">
            <el-tag type="info" size="small">基础评估（数据不足，建议多练习以获得精准预测）</el-tag>
          </div>
        </div>

        <!-- Weak Areas -->
        <div class="card" v-if="analysis.weakAreas && analysis.weakAreas.length">
          <h3 class="section-title">薄弱环节分析</h3>
          <div class="weak-areas">
            <div v-for="(area, i) in analysis.weakAreas" :key="i" class="weak-area-item" :class="'severity-' + area.severity">
              <div class="weak-area-header">
                <span class="weak-area-subject">{{ area.subject }}</span>
                <el-tag :type="severityType(area.severity)" size="small">{{ severityLabel(area.severity) }}</el-tag>
              </div>
              <p class="weak-area-issue">{{ area.issue }}</p>
              <div class="weak-area-suggestion">
                <el-icon :size="14"><Opportunity /></el-icon>
                <span>{{ area.suggestion }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="card" v-if="analysis.recommendations && analysis.recommendations.length">
          <h3 class="section-title">个性化建议</h3>
          <div class="recommendations">
            <div v-for="rec in analysis.recommendations" :key="rec.priority" class="rec-item">
              <div class="rec-priority">{{ rec.priority }}</div>
              <div class="rec-content">
                <div class="rec-title">{{ rec.title }}</div>
                <p class="rec-desc">{{ rec.description }}</p>
                <div class="rec-action">
                  <el-icon :size="14" color="#4A90D9"><Aim /></el-icon>
                  <span>{{ rec.action }}</span>
                </div>
                <div class="rec-time" v-if="rec.estimatedTime">
                  <el-icon :size="14"><Clock /></el-icon>
                  <span>{{ rec.estimatedTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Study Plan -->
        <div class="card" v-if="analysis.studyPlan">
          <h3 class="section-title">本周学习计划</h3>
          <div class="study-plan">
            <div class="plan-goal">
              <el-icon :size="18" color="#67C23A"><Flag /></el-icon>
              <span>{{ analysis.studyPlan.weeklyGoal }}</span>
            </div>
            <div class="plan-tasks" v-if="analysis.studyPlan.dailyTasks">
              <div v-for="(task, i) in analysis.studyPlan.dailyTasks" :key="i" class="plan-task">
                <el-icon :size="14" color="#4A90D9"><CircleCheck /></el-icon>
                <span>{{ task }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Encouragement -->
        <div class="card encouragement-card" v-if="analysis.encouragement">
          <el-icon :size="24" color="#E6A23C"><Sunny /></el-icon>
          <p>{{ analysis.encouragement }}</p>
        </div>

        <!-- Regenerate -->
        <div class="regenerate-section">
          <el-button @click="loadAnalysis" :loading="analysisLoading">
            <el-icon><Refresh /></el-icon>&nbsp;重新生成分析
          </el-button>
        </div>
      </template>
    </template>

    <!-- ============ Chat Tab ============ -->
    <template v-if="activeTab === 'chat'">
      <div class="card chat-card">
        <div class="chat-header">
          <div class="chat-header-info">
            <el-icon :size="32" color="#4A90D9"><MagicStick /></el-icon>
            <div>
              <div class="chat-title">AI 备考导师</div>
              <div class="chat-subtitle">问我任何关于托福备考的问题</div>
            </div>
          </div>
        </div>

        <div class="chat-messages" ref="chatContainer">
          <div v-if="!chatMessages.length" class="chat-welcome">
            <el-icon :size="48" color="#4A90D9"><ChatDotRound /></el-icon>
            <h3>你好！我是你的 AI 备考导师</h3>
            <p>我可以根据你的学习数据，为你解答备考疑问、制定学习策略</p>
            <div class="quick-questions">
              <div class="quick-q" v-for="q in quickQuestions" :key="q" @click="sendQuickQuestion(q)">{{ q }}</div>
            </div>
          </div>

          <div v-for="(msg, i) in chatMessages" :key="i" class="chat-msg" :class="msg.role">
            <div class="msg-avatar">
              <el-icon v-if="msg.role === 'assistant'" :size="20" color="#4A90D9"><MagicStick /></el-icon>
              <el-icon v-else :size="20" color="#999"><User /></el-icon>
            </div>
            <div class="msg-bubble">
              <div class="msg-text">{{ msg.content }}</div>
            </div>
          </div>

          <div v-if="chatLoading" class="chat-msg assistant">
            <div class="msg-avatar">
              <el-icon :size="20" color="#4A90D9"><MagicStick /></el-icon>
            </div>
            <div class="msg-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <el-input
            v-model="chatInput"
            type="textarea"
            :rows="2"
            placeholder="输入你的问题..."
            maxlength="500"
            show-word-limit
            @keydown.enter.exact.prevent="sendMessage"
          />
          <el-button type="primary" :loading="chatLoading" :disabled="!chatInput.trim()" @click="sendMessage">
            发送
          </el-button>
        </div>
        <p class="chat-quota-hint" v-if="!isPremium">免费用户每日可提问 3 次</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { MagicStick, Loading, WarningFilled, Opportunity, Aim, Clock, Flag, CircleCheck, Sunny, Refresh, ChatDotRound, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiTutorAPI } from '@/api'
import { useUserStore } from '@/stores/user'

const { isPremium } = useUserStore()

const activeTab = ref('analysis')
const analysisLoading = ref(false)
const analysis = ref(null)
const dataPreview = ref(null)

const chatMessages = ref([])
const chatInput = ref('')
const chatLoading = ref(false)
const chatContainer = ref(null)

const subjectNames = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
const subjectColors = { reading: '#4A90D9', listening: '#67C23A', speaking: '#E6A23C', writing: '#F56C6C' }

const scoreSubjects = [
  { key: 'reading', label: '阅读', color: '#4A90D9' },
  { key: 'listening', label: '听力', color: '#67C23A' },
  { key: 'speaking', label: '口语', color: '#E6A23C' },
  { key: 'writing', label: '写作', color: '#F56C6C' },
]

const quickQuestions = [
  '我的阅读怎么提高？',
  '口语练习有什么技巧？',
  '如何安排考前一个月的复习？',
  '听力听不懂怎么办？',
]

const severityType = (s) => ({ high: 'danger', medium: 'warning', low: 'info' }[s] || 'info')
const severityLabel = (s) => ({ high: '严重', medium: '中等', low: '轻微' }[s] || '未知')

const loadDataPreview = async () => {
  try {
    const res = await aiTutorAPI.dataPreview()
    dataPreview.value = res.data.data || res.data
  } catch (e) {
    console.error('Data preview error', e)
  }
}

const loadAnalysis = async () => {
  analysisLoading.value = true
  analysis.value = null
  try {
    const res = await aiTutorAPI.analysis()
    analysis.value = res.data.data || res.data
  } catch (e) {
    if (e.response?.status === 403) {
      ElMessage.warning(e.response.data?.message || '今日分析次数已用完，升级会员可无限查看')
    } else {
      ElMessage.error('分析生成失败，请稍后重试')
    }
  } finally {
    analysisLoading.value = false
  }
}

const sendMessage = async () => {
  const text = chatInput.value.trim()
  if (!text || chatLoading.value) return

  chatMessages.value.push({ role: 'user', content: text })
  chatInput.value = ''
  chatLoading.value = true

  await scrollToBottom()

  try {
    const history = chatMessages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
    const res = await aiTutorAPI.ask(text, history)
    const data = res.data.data || res.data
    chatMessages.value.push({ role: 'assistant', content: data.answer })
  } catch (e) {
    if (e.response?.status === 403) {
      ElMessage.warning(e.response.data?.message || '今日提问次数已用完')
    } else {
      chatMessages.value.push({ role: 'assistant', content: '抱歉，回复失败，请稍后重试。' })
    }
  } finally {
    chatLoading.value = false
    await scrollToBottom()
  }
}

const sendQuickQuestion = (q) => {
  chatInput.value = q
  sendMessage()
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

onMounted(() => {
  loadDataPreview()
})
</script>

<style scoped>
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

/* Tab Switch */
.tab-switch { display: flex; gap: 8px; margin-bottom: 20px; }
.tab-item {
  flex: 1; text-align: center; padding: 12px; border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 14px; font-weight: 500;
  transition: all 0.2s; border: 2px solid transparent;
}
.tab-item.active { background: #4A90D9; color: #fff; border-color: #4A90D9; }

/* Overview */
.overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.overview-item { text-align: center; padding: 12px; background: #f9fafb; border-radius: 8px; }
.overview-value { font-size: 28px; font-weight: 700; color: var(--primary); }
.overview-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.subject-bars { display: flex; flex-direction: column; gap: 10px; }
.subject-bar { display: flex; align-items: center; gap: 10px; }
.bar-label { width: 40px; font-size: 13px; flex-shrink: 0; }
.bar-track { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.bar-value { width: 60px; font-size: 12px; text-align: right; flex-shrink: 0; color: var(--text-secondary); }

/* Generate Prompt */
.generate-prompt { text-align: center; padding: 30px 20px; }
.generate-prompt h3 { margin: 16px 0 8px; font-size: 18px; }
.generate-prompt p { color: var(--text-secondary); margin-bottom: 20px; font-size: 14px; }
.quota-hint { font-size: 12px; color: #E6A23C; margin-top: 12px; }

/* Loading */
.loading-container { text-align: center; padding: 40px 20px; }
.loading-container p { margin-top: 16px; font-size: 14px; }
.loading-sub { color: var(--text-secondary); font-size: 12px !important; }

/* Empty State */
.empty-state { text-align: center; padding: 30px 20px; }
.empty-state h3 { margin: 16px 0 8px; }
.empty-state p { color: var(--text-secondary); margin-bottom: 16px; }

/* Score Card */
.score-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.score-card .section-title { color: #fff; }
.score-display { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.total-score { text-align: center; }
.score-number { font-size: 56px; font-weight: 800; line-height: 1; }
.score-max { font-size: 16px; opacity: 0.8; }
.subject-scores { display: flex; gap: 16px; flex-wrap: wrap; }
.sub-score-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.sub-score-circle {
  width: 56px; height: 56px; border-radius: 50%; border: 3px solid;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.15);
}
.sub-score-value { font-size: 20px; font-weight: 700; }
.sub-score-label { font-size: 12px; opacity: 0.9; }
.default-badge { margin-top: 12px; }

/* Weak Areas */
.weak-areas { display: flex; flex-direction: column; gap: 12px; }
.weak-area-item { padding: 14px; border-radius: 8px; border-left: 4px solid; }
.weak-area-item.severity-high { border-color: #F56C6C; background: #fef0f0; }
.weak-area-item.severity-medium { border-color: #E6A23C; background: #fdf6ec; }
.weak-area-item.severity-low { border-color: #909399; background: #f4f4f5; }
.weak-area-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.weak-area-subject { font-weight: 600; font-size: 14px; }
.weak-area-issue { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.weak-area-suggestion { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: #4A90D9; }

/* Recommendations */
.recommendations { display: flex; flex-direction: column; gap: 12px; }
.rec-item { display: flex; gap: 12px; padding: 14px; background: #f9fafb; border-radius: 8px; }
.rec-priority {
  width: 28px; height: 28px; border-radius: 50%; background: #4A90D9; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
  flex-shrink: 0;
}
.rec-content { flex: 1; }
.rec-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.rec-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.rec-action, .rec-time { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-top: 4px; }
.rec-action { color: #4A90D9; }
.rec-time { color: var(--text-secondary); }

/* Study Plan */
.study-plan { }
.plan-goal { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 16px; padding: 12px; background: #f0f9eb; border-radius: 8px; }
.plan-tasks { display: flex; flex-direction: column; gap: 8px; }
.plan-task { display: flex; align-items: center; gap: 8px; font-size: 14px; padding: 8px 12px; background: #f9fafb; border-radius: 6px; }

/* Encouragement */
.encouragement-card { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #fef9e7 0%, #fef0e7 100%); }
.encouragement-card p { font-size: 14px; color: #8B6914; font-style: italic; }

/* Regenerate */
.regenerate-section { text-align: center; margin-top: 20px; }

/* Chat */
.chat-card { display: flex; flex-direction: column; height: calc(100vh - 220px); min-height: 500px; }
.chat-header { padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.chat-header-info { display: flex; align-items: center; gap: 12px; }
.chat-title { font-size: 16px; font-weight: 700; }
.chat-subtitle { font-size: 12px; color: var(--text-secondary); }

.chat-messages { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
.chat-welcome { text-align: center; padding: 30px 20px; }
.chat-welcome h3 { margin: 16px 0 8px; }
.chat-welcome p { color: var(--text-secondary); margin-bottom: 20px; font-size: 14px; }
.quick-questions { display: flex; flex-direction: column; gap: 8px; max-width: 300px; margin: 0 auto; }
.quick-q { padding: 10px 16px; background: #f0f5ff; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.quick-q:hover { background: #4A90D9; color: #fff; }

.chat-msg { display: flex; gap: 10px; }
.chat-msg.user { flex-direction: row-reverse; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.msg-bubble { max-width: 75%; }
.chat-msg.user .msg-bubble { text-align: right; }
.msg-text { display: inline-block; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.6; text-align: left; white-space: pre-wrap; }
.chat-msg.assistant .msg-text { background: #f4f4f5; border-top-left-radius: 4px; }
.chat-msg.user .msg-text { background: #4A90D9; color: #fff; border-top-right-radius: 4px; }

.typing-indicator { display: flex; gap: 4px; padding: 14px; }
.typing-indicator span { width: 8px; height: 8px; border-radius: 50%; background: #ccc; animation: typing 1.4s infinite; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }

.chat-input-area { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.chat-input-area .el-input { flex: 1; }
.chat-quota-hint { font-size: 12px; color: #E6A23C; text-align: center; margin-top: 8px; }
</style>
