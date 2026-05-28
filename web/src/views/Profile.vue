<template>
  <div class="page-container">
    <div class="page-header"><h2>个人中心</h2></div>

    <!-- User Info -->
    <div class="card profile-card">
      <div class="avatar-section">
        <el-avatar :size="64" icon="UserFilled" />
        <div class="user-detail">
          <div class="nickname-row">
            <span class="nickname">{{ userInfo?.nickname || '同学' }}</span>
            <el-tag v-if="isPremium" type="warning" size="small" effect="dark">VIP</el-tag>
            <el-tag v-else size="small" type="info">免费用户</el-tag>
          </div>
          <div class="phone">{{ userInfo?.phone || '未绑定' }}</div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalPractice || 0 }}</div>
        <div class="stat-label">总练习次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.wrongCount || 0 }}</div>
        <div class="stat-label">错题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.examCount || 0 }}</div>
        <div class="stat-label">模考次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.avgScore || '--' }}</div>
        <div class="stat-label">平均分</div>
      </div>
    </div>

    <!-- Menu -->
    <div class="card menu-card">
      <div class="menu-item" @click="$router.push('/profile/history')">
        <el-icon><List /></el-icon>
        <span>练习历史</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/wrong-book')">
        <el-icon><Collection /></el-icon>
        <span>错题本</span>
        <span class="badge" v-if="stats.wrongCount">{{ stats.wrongCount }}</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/plan')">
        <el-icon><Calendar /></el-icon>
        <span>学习计划</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/membership')">
        <el-icon><Trophy /></el-icon>
        <span>我的会员</span>
        <el-tag v-if="isPremium" size="small" type="warning" effect="plain">VIP</el-tag>
        <el-tag v-else size="small" type="info" effect="plain">免费</el-tag>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/profile/feedback')">
        <el-icon><ChatLineSquare /></el-icon>
        <span>意见反馈</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- About -->
    <div class="card about-card">
      <div class="about-item">
        <span>关于我们</span>
        <span class="about-value">版本 v1.0.0</span>
      </div>
      <div class="about-item">
        <span>技术文档</span>
        <span class="about-value">托福备考助手</span>
      </div>
    </div>

    <!-- Logout -->
    <div class="card" style="text-align: center;">
      <el-button type="danger" text @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Trophy } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { userAPI, wrongAPI, examAPI } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { isPremium: isPremiumRef, logout: storeLogout } = useUserStore()

const userInfo = ref(null)
const isPremium = isPremiumRef
const stats = reactive({ totalPractice: 0, wrongCount: 0, examCount: 0, avgScore: '--' })

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确认退出登录？', '退出', { type: 'warning' })
  } catch { return }
  storeLogout()
  router.replace('/auth')
}

onMounted(async () => {
  const info = localStorage.getItem('userInfo')
  if (info) userInfo.value = JSON.parse(info)
  try {
    const [dashRes, wrongRes, examRes] = await Promise.all([
      userAPI.dashboard(),
      wrongAPI.stats(),
      examAPI.history({ limit: 100 }),
    ])
    if (dashRes.data?.stats) Object.assign(stats, dashRes.data.stats)
    if (wrongRes.data) stats.wrongCount = wrongRes.data.total || wrongRes.data.count || 0
    if (examRes.data) {
      const exams = examRes.data.list || examRes.data.exams || examRes.data || []
      stats.examCount = exams.length
      if (exams.length) {
        const sum = exams.reduce((a, b) => a + (b.totalScore || b.score || 0), 0)
        stats.avgScore = Math.round(sum / exams.length)
      }
    }
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.profile-card { margin-bottom: 16px; }
.avatar-section { display: flex; align-items: center; gap: 16px; }
.nickname-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.nickname { font-size: 18px; font-weight: 600; }
.phone { font-size: 13px; color: var(--text-secondary); }
.menu-card { padding: 0; }
.menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:hover { background: #f9fafb; }
.menu-item .arrow { margin-left: auto; color: var(--text-secondary); }
.badge {
  margin-left: auto; margin-right: 0;
  background: var(--danger); color: #fff;
  border-radius: 10px; padding: 0 8px; font-size: 12px;
}
.about-card { padding: 0; }
.about-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}
.about-item:last-child { border-bottom: none; }
.about-value { color: var(--text-secondary); font-size: 13px; }
</style>
