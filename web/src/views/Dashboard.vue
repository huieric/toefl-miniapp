<template>
  <div class="page-container">
    <div class="page-header">
      <h2>学习仪表盘</h2>
      <p class="subtitle">欢迎回来，{{ userInfo?.nickname || '同学' }}</p>
    </div>

    <!-- Membership Status Card -->
    <div class="card member-card" :class="{ premium: isPremium }">
      <div class="member-left">
        <el-icon :size="28">
          <Trophy v-if="isPremium" />
          <UserFilled v-else />
        </el-icon>
        <div class="member-info">
          <div class="member-title">{{ isPremium ? 'VIP 会员 · 全量解锁' : '免费用户' }}</div>
          <div class="member-desc" v-if="!isPremium">
            今日剩余 <strong>{{ questionsRemaining }}</strong> 题 / <strong>{{ aiMinutesRemaining }}</strong> 分钟 AI 陪练
          </div>
          <div class="member-desc" v-else>所有功能已解锁，尽情备考！</div>
        </div>
      </div>
      <el-button v-if="!isPremium" type="warning" size="small" @click="$router.push('/membership')">升级会员</el-button>
      <el-tag v-else type="warning" effect="dark" size="small">VIP 已激活</el-tag>
    </div>

    <!-- Stat Cards -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayMinutes || 0 }}</div>
        <div class="stat-label">今日学习时长 (分钟)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalQuestions || 0 }}</div>
        <div class="stat-label">做题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.accuracy || 0 }}%</div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.avgExamScore || '--' }}</div>
        <div class="stat-label">模考平均分</div>
      </div>
    </div>

    <!-- Subject Progress Rings -->
    <div class="card">
      <h3 class="section-title">四科练习进度</h3>
      <div class="progress-rings">
        <div v-for="sub in subjects" :key="sub.key" class="ring-item">
          <div class="ring-wrapper">
            <svg class="ring-svg" viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="42" />
              <circle
                class="ring-fg"
                cx="50" cy="50" r="42"
                :stroke-dasharray="264"
                :stroke-dashoffset="264 * (1 - sub.percent / 100)"
                :stroke="sub.color"
              />
            </svg>
            <div class="ring-text">{{ sub.percent }}%</div>
          </div>
          <div class="ring-label">{{ sub.label }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Entry -->
    <div class="card">
      <h3 class="section-title">开始练习</h3>
      <div class="subject-cards">
        <div class="subject-card" @click="$router.push('/reading')">
          <el-icon :size="36"><Reading /></el-icon>
          <div class="subject-name">阅读</div>
        </div>
        <div class="subject-card" @click="$router.push('/listening')">
          <el-icon :size="36"><Headset /></el-icon>
          <div class="subject-name">听力</div>
        </div>
        <div class="subject-card" @click="$router.push('/speaking')">
          <el-icon :size="36"><Microphone /></el-icon>
          <div class="subject-name">口语</div>
        </div>
        <div class="subject-card" @click="$router.push('/writing')">
          <el-icon :size="36"><Edit /></el-icon>
          <div class="subject-name">写作</div>
        </div>
      </div>
    </div>

    <!-- AI Tutor Entry -->
    <div class="card ai-tutor-entry" @click="$router.push('/ai-tutor')">
      <div class="tutor-icon">
        <el-icon :size="32" color="#fff"><MagicStick /></el-icon>
      </div>
      <div class="tutor-info">
        <div class="tutor-title">AI 导师分析</div>
        <div class="tutor-desc">预测托福分数 · 识别薄弱环节 · 个性化备考建议</div>
      </div>
      <el-icon :size="20" color="#4A90D9"><ArrowRight /></el-icon>
    </div>

    <!-- Quick Wrong Book Entry -->
    <div class="card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;">最近错题</h3>
        <el-button text type="primary" size="small" @click="$router.push('/wrong-book')">查看全部</el-button>
      </div>
      <div v-if="recentWrong.length" class="wrong-preview">
        <div
          v-for="(w, i) in recentWrong"
          :key="i"
          class="wrong-preview-item"
          @click="$router.push(`/reading/${w.questionId || w.id}`)"
        >
          <el-icon :size="14" color="#F56C6C"><CircleClose /></el-icon>
          <span class="wrong-preview-title">{{ w.title || w.question || '题目' }}</span>
          <span class="wrong-preview-subject">{{ subjectMap[w.subject] || '' }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无错题" :image-size="60" />
    </div>

    <!-- Daily Study Plan -->
    <div class="card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;">每日学习任务</h3>
        <el-button text type="primary" size="small" @click="$router.push('/plan/daily')">查看全部</el-button>
      </div>
      <div v-if="dailyTasks.length" class="task-list">
        <div v-for="(task, i) in dailyTasks" :key="i" class="task-item" :class="{ completed: task.completed }">
          <el-icon :size="16" :color="task.completed ? '#67C23A' : '#ccc'">
            <CircleCheck v-if="task.completed" />
            <Clock v-else />
          </el-icon>
          <span class="task-title">{{ task.title || task.name || '学习任务' }}</span>
          <span class="task-duration" v-if="task.duration">{{ task.duration }}分钟</span>
        </div>
      </div>
      <el-empty v-else description="暂无今日任务，去制定计划吧" :image-size="60">
        <el-button size="small" type="primary" @click="$router.push('/plan/setup')">制定学习计划</el-button>
      </el-empty>
    </div>

    <!-- Ad Banner -->
    <AdBanner placement="home" />

    <!-- Recent Records -->
    <div class="card">
      <h3 class="section-title">最近练习</h3>
      <el-table :data="recentRecords" stripe style="width: 100%">
        <el-table-column prop="subject" label="科目" width="80">
          <template #default="{ row }">{{ subjectMap[row.subject] || row.subject }}</template>
        </el-table-column>
        <el-table-column prop="title" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column prop="score" label="得分" width="80" />
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recentRecords.length" description="暂无练习记录" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Reading, Headset, Microphone, Edit, Trophy, UserFilled, CircleClose, CircleCheck, Clock, MagicStick, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userAPI, practiceAPI, planAPI, wrongAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import AdBanner from '@/components/AdBanner.vue'

const router = useRouter()
const { isPremium, questionsRemaining, aiMinutesRemaining } = useUserStore()

const userInfo = ref(null)
const stats = reactive({
  todayMinutes: 0, totalQuestions: 0, accuracy: 0, avgExamScore: '--',
})
const recentRecords = ref([])
const recentWrong = ref([])
const dailyTasks = ref([])

const subjects = [
  { key: 'reading', label: '阅读', percent: 0, color: '#4A90D9' },
  { key: 'listening', label: '听力', percent: 0, color: '#67C23A' },
  { key: 'speaking', label: '口语', percent: 0, color: '#E6A23C' },
  { key: 'writing', label: '写作', percent: 0, color: '#F56C6C' },
]

const subjectMap = {
  reading: '阅读', listening: '听力', speaking: '口语', writing: '写作',
}

const formatDate = (d) => {
  if (!d) return '--'
  return new Date(d).toLocaleString('zh-CN')
}

const viewDetail = (row) => {
  if (row.subject === 'reading') router.push(`/reading/${row.questionId}/result`)
  else if (row.subject === 'listening') router.push(`/listening/${row.questionId}/result`)
  else if (row.subject === 'writing') router.push(`/writing/${row.questionId}/result`)
}

onMounted(async () => {
  const info = localStorage.getItem('userInfo')
  if (info) userInfo.value = JSON.parse(info)

  try {
    const [dashRes, pracRes, planRes, wrongRes] = await Promise.allSettled([
      userAPI.dashboard(),
      practiceAPI.history({ limit: 10 }),
      planAPI.daily(),
      wrongAPI.list({ limit: 5 }),
    ])

    // dashboard
    if (dashRes.status === 'fulfilled' && dashRes.value.data) {
      const d = dashRes.value.data.data || dashRes.value.data
      stats.todayMinutes = d.stats?.todayMinutes || d.stats?.totalMinutes || 0
      stats.totalQuestions = d.stats?.totalQuestions || 0
      stats.accuracy = d.stats?.accuracy || 0
      stats.avgExamScore = d.stats?.avgExamScore || '--'
      if (d.progress) {
        subjects.forEach(s => { s.percent = d.progress[s.key] || 0 })
      }
    } else {
      stats.todayMinutes = 45
      stats.totalQuestions = 128
      stats.accuracy = 72
      stats.avgExamScore = 88
      subjects.forEach(s => { s.percent = Math.floor(Math.random() * 60 + 20) })
    }

    // practice history
    if (pracRes.status === 'fulfilled' && pracRes.value.data) {
      const data = pracRes.value.data.data || pracRes.value.data
      recentRecords.value = Array.isArray(data) ? data.slice(0, 10) : (data.records || data.list || []).slice(0, 10)
    }

    // daily plan
    if (planRes.status === 'fulfilled' && planRes.value.data) {
      const data = planRes.value.data.data || planRes.value.data
      dailyTasks.value = Array.isArray(data) ? data.slice(0, 6) : (data.tasks || data.dailyTasks || []).slice(0, 6)
    } else {
      dailyTasks.value = [
        { title: '阅读练习 2 篇', duration: 30, completed: false },
        { title: '听力精听 1 篇', duration: 20, completed: false },
        { title: '错题复习（SM-2）', duration: 15, completed: true },
      ]
    }

    // recent wrong
    if (wrongRes.status === 'fulfilled' && wrongRes.value.data) {
      const data = wrongRes.value.data.data || wrongRes.value.data
      recentWrong.value = Array.isArray(data) ? data.slice(0, 5) : (data.list || data.wrong || []).slice(0, 5)
    }
  } catch (e) {
    console.error('Dashboard load error', e)
    ElMessage.warning('部分数据加载失败，已使用离线数据')
  }
})
</script>

<style scoped>
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

/* Membership Card */
.member-card {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border: none;
}
.member-card.premium {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: #5a3e00;
}
.member-left { display: flex; align-items: center; gap: 12px; }
.member-info { display: flex; flex-direction: column; gap: 2px; }
.member-title { font-size: 15px; font-weight: 700; }
.member-desc { font-size: 12px; opacity: 0.8; }
.member-desc strong { color: var(--primary); }

/* Stat Cards */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 16px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-value { font-size: 28px; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
@media (max-width: 768px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
}

/* Progress Rings (CSS + SVG) */
.progress-rings { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; }
.ring-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ring-wrapper { position: relative; width: 90px; height: 90px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: #eee; stroke-width: 8; }
.ring-fg { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.ring-text {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 16px; font-weight: 700;
}
.ring-label { font-size: 13px; color: var(--text-secondary); }

/* Subject Cards */
.subject-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.subject-card {
  flex: 1; min-width: 80px; text-align: center;
  padding: 20px 8px; border-radius: 10px;
  background: #f9fafb; cursor: pointer; transition: all 0.15s;
}
.subject-card:hover { background: #e8f0fe; transform: translateY(-2px); }
.subject-name { font-size: 13px; margin-top: 8px; font-weight: 500; }

/* AI Tutor Entry */
.ai-tutor-entry {
  display: flex; align-items: center; gap: 14px; cursor: pointer;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
  transition: all 0.2s;
}
.ai-tutor-entry:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(74,144,217,0.2); }
.tutor-icon {
  width: 52px; height: 52px; border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tutor-info { flex: 1; }
.tutor-title { font-size: 15px; font-weight: 700; color: #333; }
.tutor-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

/* Wrong Preview */
.wrong-preview { display: flex; flex-direction: column; gap: 8px; }
.wrong-preview-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px; cursor: pointer;
  font-size: 13px; transition: background 0.15s;
}
.wrong-preview-item:hover { background: #f9fafb; }
.wrong-preview-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wrong-preview-subject { font-size: 11px; color: var(--text-secondary); flex-shrink: 0; }

/* Task List */
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px; font-size: 14px;
}
.task-item.completed { opacity: 0.55; }
.task-title { flex: 1; }
.task-duration { font-size: 12px; color: var(--text-secondary); flex-shrink: 0; }
</style>
