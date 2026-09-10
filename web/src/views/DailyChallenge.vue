<template>
  <div class="challenge-page">
    <div class="challenge-header">
      <el-button text @click="$router.push('/dashboard')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>⚔️ 每日闯关</h2>
      <div class="header-spacer" />
    </div>

    <div v-loading="loading" class="challenge-content">
      <template v-if="!loading && challenge">
        <!-- 顶部进度条 -->
        <div class="progress-bar-section">
          <div class="progress-info">
            <span class="progress-text">已完成 {{ challenge.completedCount }} / {{ challenge.totalTasks }} 项</span>
            <span class="progress-xp">+{{ challenge.totalXP }} XP</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (challenge.completedCount / challenge.totalTasks * 100) + '%' }">
              <div class="progress-shine" />
            </div>
          </div>
        </div>

        <!-- 全部完成奖励 -->
        <div v-if="challenge.allCompleted" class="all-done-banner">
          <div class="banner-icon">🏆</div>
          <div class="banner-text">
            <div class="banner-title">全部闯关成功！</div>
            <div class="banner-desc">获得额外 50 XP 奖励！</div>
          </div>
        </div>

        <!-- 挑战任务列表 -->
        <div class="task-list">
          <div
            v-for="task in challenge.tasks"
            :key="task.id"
            class="task-card"
            :class="{ 'completed': task.completed, 'in-progress': !task.completed && task.progress > 0 }"
            @click="handleTaskClick(task)"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-info">
              <div class="task-title">
                {{ task.title }}
                <el-tag v-if="task.completed" size="small" type="success" effect="dark">✓ 完成</el-tag>
                <el-tag v-else-if="!task.completed && task.progress >= task.target" size="small" type="warning" effect="plain">可提交</el-tag>
              </div>
              <div class="task-desc">目标: {{ task.target }} {{ getUnit(task) }}</div>
              <div class="task-progress">
                <div class="task-progress-bar">
                  <div class="task-progress-fill" :style="{ width: Math.min(task.progress / task.target * 100, 100) + '%' }" />
                </div>
                <span class="task-progress-text">{{ task.progress }} / {{ task.target }}</span>
              </div>
            </div>
            <div class="task-reward">
              <div class="reward-xp">+{{ task.xp }} XP</div>
              <div v-if="!task.completed && task.progress >= task.target" class="reward-claim">点击领取</div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="challenge-footer">
          <p>💡 完成所有挑战可获得额外 50 XP 奖励！</p>
          <p>📅 挑战任务每日 00:00 重置</p>
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
import { challengeAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const challenge = ref(null)

const fetchChallenge = async () => {
  loading.value = true
  try {
    const res = await challengeAPI.get()
    challenge.value = res.data?.data
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载挑战失败')
  } finally {
    loading.value = false
  }
}

const handleTaskClick = async (task) => {
  if (task.completed) return

  try {
    const res = await challengeAPI.updateProgress(task.id)
    const data = res.data?.data || {}

    if (data.earnedXP > 0) {
      ElMessage.success(`获得 ${data.earnedXP} XP！${data.allComplete ? '🏆 全部挑战完成！' : ''}`)
    }

    await fetchChallenge()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '更新失败')
  }
}

const getUnit = (task) => {
  if (task.type === 'study_minutes') return '分钟'
  if (task.type === 'exam') return '次'
  return '题'
}

onMounted(fetchChallenge)
</script>

<style scoped>
.challenge-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  background: var(--page-bg);
}
.challenge-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.challenge-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.header-spacer { flex: 1; }

/* 进度条 */
.progress-bar-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.progress-text {
  font-size: 14px;
  color: var(--text-secondary);
}
.progress-xp {
  font-size: 16px;
  font-weight: 700;
  color: #FF9800;
}
.progress-track {
  height: 10px;
  background: var(--bg);
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  border-radius: 5px;
  transition: width 0.5s ease;
  position: relative;
}
.progress-shine {
  position: absolute;
  right: 0;
  top: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5));
  animation: shine 2s infinite;
}
@keyframes shine {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* 全部完成奖励 */
.all-done-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border: 1px solid #FFD54F;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.banner-icon { font-size: 36px; }
.banner-title {
  font-size: 16px;
  font-weight: 700;
  color: #E65100;
}
.banner-desc {
  font-size: 13px;
  color: #BF360C;
  margin-top: 4px;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.task-card.completed {
  border-color: #A5D6A7;
  background: #F1F8E9;
}
.task-card.in-progress {
  border-color: #FFB74D;
}
.task-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border-radius: 12px;
  flex-shrink: 0;
}
.task-info {
  flex: 1;
  min-width: 0;
}
.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
}
.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #64B5F6);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.task-progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.task-reward {
  text-align: right;
  flex-shrink: 0;
}
.reward-xp {
  font-size: 14px;
  font-weight: 700;
  color: #FF9800;
}
.reward-claim {
  font-size: 11px;
  color: #E65100;
  margin-top: 4px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 底部 */
.challenge-footer {
  margin-top: 24px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: center;
}
.challenge-footer p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .task-card {
    padding: 12px;
  }
  .task-icon {
    width: 40px;
    height: 40px;
    font-size: 26px;
  }
  .task-title {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .task-card {
    gap: 10px;
    padding: 10px;
  }
  .task-icon {
    width: 36px;
    height: 36px;
    font-size: 22px;
  }
  .task-title .el-tag {
    font-size: 10px;
  }
  .task-reward {
    display: none;
  }
}
</style>
