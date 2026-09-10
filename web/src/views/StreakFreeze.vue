<template>
  <div class="freeze-page">
    <div class="freeze-header">
      <el-button text @click="$router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🛡️ 连续保护</h2>
      <div class="header-spacer" />
    </div>

    <div v-loading="loading" class="freeze-content">
      <template v-if="!loading && data">
        <!-- Freeze 数量 -->
        <div class="freeze-balance">
          <div class="freeze-icon-big">🛡️</div>
          <div class="freeze-count">{{ data.freezeCount }}</div>
          <div class="freeze-label">Streak Freeze</div>
        </div>

        <!-- 连续打卡状态 -->
        <div class="streak-status" :class="{ 'at-risk': data.isStreakAtRisk }">
          <div class="streak-icon">{{ data.isStreakAtRisk ? '⚠️' : '✅' }}</div>
          <div class="streak-info">
            <div class="streak-days">{{ data.streakDays }} 天连续</div>
            <div class="streak-text">
              <span v-if="data.isStreakAtRisk" class="warning-text">
                明天不打卡连续将中断！使用 Streak Freeze 保护吧！
              </span>
              <span v-else class="success-text">
                保持学习，连续打卡继续增长！
              </span>
            </div>
          </div>
          <button v-if="data.isStreakAtRisk && data.freezeCount > 0" class="use-freeze-btn" @click="useFreeze">
            使用 1 个保护
          </button>
        </div>

        <!-- 获取 Freeze 进度 -->
        <div class="progress-section">
          <h3>获取 Streak Freeze</h3>
          <div class="progress-card">
            <div class="progress-icon">🎯</div>
            <div class="progress-text">
              连续打卡每 <strong>3</strong> 天获得 <strong>1</strong> 个 Streak Freeze
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: data.progressToNextFreeze + '%' }" />
            </div>
            <div class="progress-info">
              <span>{{ data.streakDays }} / {{ data.nextFreezeGoal }} 天连续</span>
              <span>{{ data.progressToNextFreeze }}%</span>
            </div>
          </div>
        </div>

        <!-- Freeze 历史 -->
        <div class="history-section">
          <h3>使用记录</h3>
          <div v-if="history.length === 0" class="empty-history">
            暂无记录
          </div>
          <div v-else class="history-list">
            <div v-for="(h, i) in history" :key="i" class="history-item">
              <span class="history-action">{{ h.action === 'earn' ? '🎁 获得' : '🛡️ 使用' }}</span>
              <span class="history-source">{{ getSourceLabel(h.source) }}</span>
              <span class="history-time">{{ formatTime(h.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="freeze-footer">
          <h4>💡 什么是 Streak Freeze？</h4>
          <p>Streak Freeze 可以保护你的连续打卡不被中断。当你无法学习的日子里，使用一个 Freeze 即可保持连续天数。</p>
          <p>获取方式：</p>
          <ul>
            <li>📅 连续打卡 3 天 → 获得 1 个</li>
            <li>📅 连续打卡 6 天 → 获得 2 个</li>
            <li>📅 完成每日任务 → 额外获得 1 个</li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { streakFreezeAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const data = ref(null)
const history = ref([])

const fetchData = async () => {
  try {
    const res = await streakFreezeAPI.get()
    data.value = res.data?.data
  } catch (e) {
    console.error('获取 Freeze 状态失败:', e)
  }
}

const fetchHistory = async () => {
  try {
    const res = await streakFreezeAPI.getHistory()
    history.value = res.data?.data || []
  } catch (e) {
    console.error('获取 Freeze 历史失败:', e)
  }
}

const useFreeze = async () => {
  try {
    const res = await streakFreezeAPI.use()
    ElMessage.success(res.data?.data?.message || 'Streak Freeze 已使用！')
    await Promise.all([fetchData(), fetchHistory()])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '使用 Freeze 失败')
  }
}

const getSourceLabel = (source) => {
  const labels = {
    daily_task: '每日任务',
    manual: '手动使用',
    achievement: '成就奖励',
  }
  return labels[source] || source
}

const formatTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  Promise.all([fetchData(), fetchHistory()]).finally(() => {
    loading.value = false
  })
})
</script>

<style scoped>
.freeze-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  background: var(--page-bg);
}
.freeze-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.freeze-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.header-spacer { flex: 1; }

/* Freeze 余额 */
.freeze-balance {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  margin-bottom: 16px;
  color: white;
}
.freeze-icon-big { font-size: 48px; margin-bottom: 8px; }
.freeze-count {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 4px;
}
.freeze-label { font-size: 14px; opacity: 0.8; }

/* 连续状态 */
.streak-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.streak-status.at-risk {
  border-color: #FF5722;
  background: #FFF3E0;
}
.streak-icon { font-size: 32px; flex-shrink: 0; }
.streak-info { flex: 1; }
.streak-days {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.streak-text { font-size: 12px; }
.warning-text { color: #FF5722; font-weight: 600; }
.success-text { color: #4CAF50; }
.use-freeze-btn {
  padding: 8px 16px;
  background: #FF5722;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* 进度 */
.progress-section, .history-section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.progress-section h3, .history-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.progress-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg);
  border-radius: 12px;
}
.progress-icon { font-size: 24px; margin-bottom: 4px; }
.progress-text {
  font-size: 14px;
  color: var(--text-primary);
}
.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 历史 */
.empty-history {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px 0;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg);
  border-radius: 10px;
}
.history-action {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}
.history-source {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
}
.history-time {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* 底部 */
.freeze-footer {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border);
}
.freeze-footer h4 {
  font-size: 14px;
  margin: 0 0 8px;
  color: var(--text-primary);
}
.freeze-footer p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}
.freeze-footer ul {
  margin: 8px 0;
  padding-left: 20px;
}
.freeze-footer li {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .streak-status { flex-wrap: wrap; }
  .use-freeze-btn { width: 100%; text-align: center; }
}
</style>
