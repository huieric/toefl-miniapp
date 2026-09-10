<template>
  <div class="review-page">
    <div class="review-top">
      <el-button text @click="$router.push('/vocab')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <span v-if="queue.length" class="progress">{{ index + 1 }} / {{ queue.length }}</span>
    </div>

    <div v-if="loading" v-loading="true" class="center"></div>

    <div v-else-if="!queue.length" class="done">
      <el-icon :size="52" color="#23B26D"><CircleCheck /></el-icon>
      <p class="done-text">今日生词复习完成 🎉</p>
      <el-button type="primary" @click="$router.push('/vocab')">返回生词本</el-button>
    </div>

    <div v-else class="card-wrap" :key="current.id">
      <div class="vocab-card">
        <div class="word-header">
          <div class="word-big">{{ current.word }}</div>
          <div class="memory-strength" :class="strengthClass(current.stability)">
            <span class="strength-label">记忆强度</span>
            <span class="strength-value">{{ strengthPercent(current.stability) }}%</span>
          </div>
        </div>
        <div v-if="revealed" class="reveal">
          <div v-if="current.meaning" class="meaning">{{ current.meaning }}</div>
          <div v-if="current.context" class="context">{{ current.context }}</div>
          <div v-if="current.intervalDays" class="next-due">
            下次复习: {{ formatDate(current.nextReviewAt) }} · 间隔 {{ current.intervalDays }} 天
          </div>
        </div>
        <el-button v-if="!revealed" type="primary" plain @click="revealed = true">显示释义</el-button>
      </div>

      <div v-if="revealed" class="rating-btns">
        <button class="rate again" @click="rate(1)">忘记</button>
        <button class="rate hard" @click="rate(2)">模糊</button>
        <button class="rate good" @click="rate(3)">认识</button>
        <button class="rate easy" @click="rate(4)">轻松</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import { vocabAPI } from '@/api'

const loading = ref(true)
const queue = ref([])
const index = ref(0)
const revealed = ref(false)

const current = computed(() => queue.value[index.value] || {})

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await vocabAPI.review()
    queue.value = res.data?.data?.list || []
    index.value = 0
    revealed.value = false
  } catch (e) {
    queue.value = []
    ElMessage.error(e?._userMessage || '加载复习队列失败')
  } finally {
    loading.value = false
  }
}

const rate = async (rating) => {
  const w = current.value
  try {
    const res = await vocabAPI.submitReview(w.id, rating)
    const result = res.data?.data || {}
    revealed.value = false
    if (index.value + 1 < queue.value.length) {
      index.value++
      // 更新队列中的 FSRS 数据
      queue.value[index.value] = { ...queue.value[index.value], ...result }
    } else {
      await fetchQueue()
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  }
}

// FSRS 记忆强度计算（stability 单位是天，30天 = 100%）
function strengthPercent(stability) {
  const s = parseFloat(stability) || 0
  return Math.round(Math.min(s / 30 * 100, 100))
}

function strengthClass(stability) {
  const p = strengthPercent(stability)
  if (p >= 80) return 'strength-high'
  if (p >= 50) return 'strength-mid'
  if (p >= 20) return 'strength-low'
  return 'strength-weak'
}

function formatDate(d) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(fetchQueue)
</script>

<style scoped>
.review-page {
  max-width: 520px;
  margin: 0 auto;
  padding: 16px 12px 80px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.progress {
  color: var(--text-secondary);
  font-size: 14px;
}
.center, .done {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60vh;
}
.done-text {
  color: var(--text-secondary);
}
.card-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}
.vocab-card {
  text-align: center;
  padding: 28px 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card-bg);
}
.word-big {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
}
.reveal {
  text-align: left;
  margin-bottom: 12px;
}
.meaning {
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.context {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.rating-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.rate {
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}
.rate.again { background: #fdecea; color: #d43030; }
.rate.hard { background: #fff4e6; color: #e8861a; }
.rate.good { background: #eaf7ea; color: #149033; }
.rate.easy { background: #e8f2ff; color: #2563eb; }

/* ===== 记忆强度指示器 ===== */
.word-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.memory-strength {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.2;
}
.memory-strength .strength-label {
  color: #999;
  font-size: 10px;
}
.memory-strength .strength-value {
  font-size: 16px;
  font-weight: 800;
}
.memory-strength.strength-high {
  background: #E8F5E9; color: #2E7D32;
  border: 1px solid #A5D6A7;
}
.memory-strength.strength-mid {
  background: #FFF8E1; color: #F57F17;
  border: 1px solid #FFE082;
}
.memory-strength.strength-low {
  background: #FFF3E0; color: #E65100;
  border: 1px solid #FFCC80;
}
.memory-strength.strength-weak {
  background: #FBE9E7; color: #BF360C;
  border: 1px solid #FFAB91;
}
.next-due {
  margin-top: 10px;
  padding: 8px 12px;
  background: #F5F5F5;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .review-page {
    padding: 10px 12px 76px;
    max-width: 100%;
  }
  .word-big {
    font-size: 28px;
    margin-bottom: 12px;
  }
  .vocab-card {
    padding: 22px 16px;
    border-radius: 12px;
  }
  .meaning {
    font-size: 14px;
  }
  .context {
    font-size: 12px;
  }
  .rating-btns {
    gap: 6px;
  }
  .rate {
    height: 44px;
    font-size: 13px;
    border-radius: 10px;
  }
  .done .el-button {
    width: 200px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .word-big {
    font-size: 24px;
  }
  .vocab-card {
    padding: 18px 12px;
  }
  .rating-btns {
    grid-template-columns: repeat(2, 1fr);
  }
  .rate {
    height: 46px;
    font-size: 14px;
  }
}
</style>
