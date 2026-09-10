<template>
  <div class="page-container">
    <div class="page-header">
      <h2>AI 陪练</h2>
      <p class="subtitle">选择一个场景，开始英语口语练习</p>
    </div>

    <div class="scenario-grid">
      <div
        v-for="scene in scenarios"
        :key="scene.key"
        class="scenario-card"
        @click="startTalk(scene)"
      >
        <div class="scene-icon" :style="{ background: scene.bg, color: scene.color }">
          <el-icon :size="28"><component :is="scene.icon" /></el-icon>
        </div>
        <div class="scene-name">{{ scene.label }}</div>
        <div class="scene-desc">{{ scene.desc }}</div>
      </div>
    </div>

    <!-- History Sessions -->
    <div class="card" v-if="sessions.length" style="margin-top: 20px;">
      <h3 class="section-title">历史对话</h3>
      <div class="session-list">
        <div
          v-for="s in sessions"
          :key="s._id || s.id"
          class="session-item"
          @click="$router.push(`/ai-talk/chat?session=${s._id || s.id}`)"
        >
          <span>{{ s.scenario || '自由对话' }}</span>
          <span class="session-time">{{ fmt(s.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, School, Reading, UserFilled, ChatLineSquare } from '@element-plus/icons-vue'
import { aiTalkAPI } from '@/api'

const router = useRouter()

const scenarios = [
  { key: 'free', label: '自由对话', desc: '轻松随意的英语聊天', icon: ChatDotRound, color: '#4255FF', bg: 'var(--primary-soft)' },
  { key: 'campus', label: '校园场景', desc: '课堂讨论、图书馆、社团活动', icon: School, color: '#23B26D', bg: 'var(--success-soft)' },
  { key: 'academic', label: '学术讨论', desc: '学术话题、论文答辩、讲座', icon: Reading, color: '#7C5CFF', bg: '#EFE9FF' },
  { key: 'daily', label: '日常生活', desc: '购物、餐厅、旅行、社交', icon: UserFilled, color: '#FF8A2A', bg: 'var(--warning-soft)' },
  { key: 'debate', label: '辩论练习', desc: '有观点的辩论，训练逻辑表达', icon: ChatLineSquare, color: '#F0544F', bg: 'var(--danger-soft)' },
]

const sessions = ref([])
const fmt = (d) => d ? new Date(d).toLocaleString('zh-CN') : '--'

const startTalk = async (scene) => {
  try {
    const res = await aiTalkAPI.start({ scenario: scene.key })
    const id = res.data?.session?._id || res.data?._id || res.data?.sessionId
    if (id) {
      router.push(`/ai-talk/chat?session=${id}`)
    } else {
      router.push('/ai-talk/chat')
    }
  } catch (e) {
    router.push('/ai-talk/chat')
  }
}

onMounted(async () => {
  try {
    const res = await aiTalkAPI.sessions()
    sessions.value = res.data?.list || res.data?.sessions || res.data || []
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
.subtitle {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
}
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
}
.scenario-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.scenario-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}
.scene-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.scene-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}
.scene-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}
.session-item {
  display: flex;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s;
  font-size: 14px;
  min-height: 44px;
  align-items: center;
}
.session-item:last-child { border-bottom: none; }
.session-item:active { background: var(--primary-soft); }
.session-time { color: var(--text-secondary); font-size: 12px; }
.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 20px;
  margin-top: 20px;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 76px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .subtitle {
    font-size: 12px;
  }
  
  /* 场景卡片 2 列 */
  .scenario-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .scenario-card {
    padding: 20px 12px;
    min-height: 120px;
    border-radius: var(--radius-sm);
    gap: 4px;
  }
  .scene-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    margin-bottom: 10px;
  }
  .scene-icon .el-icon {
    --el-icon-size: 24px;
  }
  .scene-name {
    font-size: 14px;
  }
  .scene-desc {
    font-size: 11px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card {
    padding: 16px;
    border-radius: var(--radius-sm);
    margin-top: 14px;
  }
  .section-title {
    font-size: 15px;
    margin-bottom: 10px;
  }
  .session-item {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    min-height: 44px;
  }
  .session-time {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .scenario-card {
    padding: 16px 10px;
    min-height: 110px;
  }
  .scene-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 8px;
  }
  .scene-icon .el-icon {
    --el-icon-size: 22px;
  }
  .scene-name {
    font-size: 13px;
  }
  .scene-desc {
    font-size: 11px;
    -webkit-line-clamp: 1;
  }
}
</style>