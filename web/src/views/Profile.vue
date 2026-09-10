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
      <div class="menu-item" @click="$router.push('/profile/ai-settings')">
        <el-icon><MagicStick /></el-icon>
        <span>AI 设置</span>
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
import { ArrowRight, Trophy, List, Collection, Calendar, ChatLineSquare, MagicStick } from '@element-plus/icons-vue'
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
.page-container {
  padding: 20px 16px 48px;
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 16px;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 800;
}
.profile-card {
  margin-bottom: 16px;
  padding: 28px 30px;
  background:
    radial-gradient(600px 220px at 100% 0%, rgba(124, 92, 255, 0.12), transparent 55%),
    radial-gradient(500px 220px at 0% 100%, rgba(66, 85, 255, 0.1), transparent 55%),
    #fff;
}
.avatar-section {
  display: flex;
  align-items: center;
  gap: 18px;
}
.avatar-section :deep(.el-avatar) {
  background: var(--grad-primary);
  font-size: 30px;
  box-shadow: 0 10px 24px rgba(66, 85, 255, 0.28);
}
.nickname-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.nickname {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.phone {
  font-size: 13px;
  color: var(--text-secondary);
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  text-align: center;
  padding: 18px 10px;
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}
.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.menu-card {
  padding: 0;
  overflow: hidden;
  margin-bottom: 16px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  font-weight: 500;
  transition: all 0.15s;
  min-height: 52px;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: var(--primary-soft); padding-left: 24px; }
.menu-item .el-icon:first-child {
  color: var(--primary);
  background: var(--primary-soft);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.menu-item .arrow { margin-left: auto; color: var(--text-muted); }
.badge {
  margin-left: auto;
  margin-right: 6px;
  background: var(--danger);
  color: #fff;
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 700;
}
.about-card {
  padding: 0;
  margin-bottom: 16px;
}
.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}
.about-item:last-child { border-bottom: none; }
.about-value { color: var(--text-secondary); font-size: 13px; }

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 76px;
    max-width: 100%;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .profile-card {
    padding: 20px 16px;
    border-radius: var(--radius-sm);
  }
  .avatar-section {
    gap: 14px;
  }
  .avatar-section :deep(.el-avatar) {
    --el-avatar-size: 52px;
    font-size: 24px;
  }
  .nickname {
    font-size: 17px;
  }
  .phone {
    font-size: 12px;
  }
  
  /* 统计卡片 2x2 */
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .stat-card {
    padding: 16px 12px;
    border-radius: var(--radius-sm);
  }
  .stat-value {
    font-size: 20px;
  }
  .stat-label {
    font-size: 11px;
  }
  
  /* 菜单 */
  .menu-card {
    border-radius: var(--radius-sm);
  }
  .menu-item {
    padding: 14px 16px;
    gap: 12px;
    min-height: 48px;
    font-size: 14px;
  }
  .menu-item .el-icon:first-child {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .menu-item .el-icon:first-child .el-icon {
    --el-icon-size: 16px;
  }
  .badge {
    font-size: 11px;
    padding: 1px 7px;
  }
  
  .about-card {
    border-radius: var(--radius-sm);
  }
  .about-item {
    padding: 14px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 16px 12px;
  }
  .stat-value {
    font-size: 18px;
  }
}
</style>
