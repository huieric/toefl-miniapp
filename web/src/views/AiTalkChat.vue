<template>
  <div class="page-container chat-container">
    <div class="page-header">
      <el-button text @click="$router.push('/ai-talk')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>AI 对话</h2>
    </div>

    <div class="chat-card card">
      <!-- Messages -->
      <div class="messages" ref="msgContainer">
        <div v-if="!messages.length" class="empty-chat">
          <el-icon :size="48"><ChatDotRound /></el-icon>
          <p>开始和 AI 练习英语口语吧！</p>
        </div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message-row"
          :class="{ me: msg.role === 'user', ai: msg.role === 'assistant' }"
        >
          <div class="message-bubble">
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time" v-if="msg.createdAt">{{ fmt(msg.createdAt) }}</div>
          </div>
        </div>
        <div v-if="sending" class="message-row ai">
          <div class="message-bubble typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-area">
        <el-input
          v-model="input"
          placeholder="输入英文消息..."
          @keydown.enter="sendMessage"
          :disabled="sending"
          size="large"
        >
          <template #append>
            <el-button :icon="Promotion" @click="sendMessage" :disabled="!input.trim() || sending" />
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ChatDotRound, Promotion } from '@element-plus/icons-vue'
import { aiTalkAPI } from '@/api'

const route = useRoute()
const messages = ref([])
const input = ref('')
const sending = ref(false)
const msgContainer = ref(null)

const fmt = (d) => d ? new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''

const scrollBottom = async () => {
  await nextTick()
  if (msgContainer.value) {
    msgContainer.value.scrollTop = msgContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = ''

  messages.value.push({ role: 'user', content: text, createdAt: new Date().toISOString() })
  await scrollBottom()

  sending.value = true
  const sessionId = route.query.session
  try {
    const res = await aiTalkAPI.send(sessionId || 'temp', text)
    const reply = res.data?.reply || res.data?.message || { content: 'Sorry, I didn\'t get that.' }
    messages.value.push({
      role: 'assistant',
      content: reply.content || reply,
      createdAt: new Date().toISOString(),
    })
    await scrollBottom()
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, something went wrong. Please try again.',
      createdAt: new Date().toISOString(),
    })
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  const sessionId = route.query.session
  if (sessionId) {
    try {
      const res = await aiTalkAPI.history(sessionId)
      messages.value = res.data?.messages || res.data?.list || res.data || []
      await scrollBottom()
    } catch (e) { console.error(e) }
  }
})
</script>

<style scoped>
.chat-container { height: calc(100vh - 60px); display: flex; flex-direction: column; }
.chat-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.messages {
  flex: 1; overflow-y: auto; padding: 8px 4px;
  display: flex; flex-direction: column; gap: 8px;
}
.empty-chat {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: var(--text-secondary);
}
.empty-chat .el-icon { margin-bottom: 12px; opacity: 0.5; }
.message-row { display: flex; }
.message-row.me { justify-content: flex-end; }
.message-row.ai { justify-content: flex-start; }
.message-bubble {
  max-width: 75%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.6;
}
.message-row.me .message-bubble {
  background: var(--primary); color: #fff;
  border-bottom-right-radius: 4px;
}
.message-row.ai .message-bubble {
  background: #f0f2f5; color: var(--text);
  border-bottom-left-radius: 4px;
}
.message-time { font-size: 11px; margin-top: 4px; opacity: 0.7; }
.typing {
  display: flex; align-items: center; gap: 4px; padding: 14px 18px;
}
.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #aaa; animation: bounce 1.4s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
.input-area { padding-top: 12px; border-top: 1px solid var(--border); }
</style>