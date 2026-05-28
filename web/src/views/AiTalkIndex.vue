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
        <el-icon :size="40"><component :is="scene.icon" /></el-icon>
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
  { key: 'free', label: '自由对话', desc: '轻松随意的英语聊天', icon: ChatDotRound },
  { key: 'campus', label: '校园场景', desc: '课堂讨论、图书馆、社团活动', icon: School },
  { key: 'academic', label: '学术讨论', desc: '学术话题、论文答辩、讲座', icon: Reading },
  { key: 'daily', label: '日常生活', desc: '购物、餐厅、旅行、社交', icon: UserFilled },
  { key: 'debate', label: '辩论练习', desc: '有观点的辩论，训练逻辑表达', icon: ChatLineSquare },
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
.subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.scenario-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.scenario-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.scenario-card .el-icon { color: var(--primary); margin-bottom: 12px; }
.scene-name { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.scene-desc { font-size: 12px; color: var(--text-secondary); }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.session-item {
  display: flex; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.session-item:hover { background: #f9fafb; }
.session-time { color: var(--text-secondary); font-size: 12px; }
</style>