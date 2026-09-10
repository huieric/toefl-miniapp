<template>
  <div class="review-page">
    <div class="review-top">
      <el-button text @click="$router.push('/vocab')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <div class="mode-switch">
        <el-button :type="mode === 'flip' ? 'primary' : ''" size="small" @click="setMode('flip')">卡片模式</el-button>
        <el-button :type="mode === 'swipe' ? 'primary' : ''" size="small" @click="setMode('swipe')">翻页模式</el-button>
      </div>
    </div>

    <div v-if="loading" v-loading="loading" class="center-loading" />
    <div v-else-if="!queue.length" class="done-page">
      <el-icon :size="52" color="#23B26D"><CircleCheck /></el-icon>
      <p class="done-text">今日生词复习完成 🎉</p>
      <el-button type="primary" @click="$router.push('/vocab')">返回生词本</el-button>
    </div>

    <!-- 卡片翻转模式 -->
    <div v-else-if="mode === 'flip'" class="card-wrap" :key="current.id">
      <div class="flashcard-container" @click="flipCard = !flipCard">
        <div class="flashcard" :class="{ flipped: flipCard }">
          <div class="flashcard-face flashcard-front">
            <div class="word-big">{{ current.word }}</div>
            <div v-if="revealed" class="reveal">
              <div v-if="current.meaning" class="meaning">{{ current.meaning }}</div>
              <div v-if="current.context" class="context">{{ current.context }}</div>
              <div class="next-due">
                下次复习: {{ formatDate(current.nextReviewAt) }}
              </div>
            </div>
            <div v-if="!revealed" class="tap-hint">点击翻转</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="word-big">{{ current.word }}</div>
            <div class="meaning">{{ current.meaning }}</div>
            <div v-if="current.context" class="context">{{ current.context }}</div>
            <div class="memory-strength" :class="strengthClass(current.stability)">
              <span class="strength-label">记忆强度</span>
              <span class="strength-value">{{ strengthPercent(current.stability) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="revealed" class="rating-btns">
        <button class="rate again" @click="rate(1)">忘记</button>
        <button class="rate hard" @click="rate(2)">模糊</button>
        <button class="rate good" @click="rate(3)">认识</button>
        <button class="rate easy" @click="rate(4)">轻松</button>
      </div>
    </div>

    <!-- 翻页模式（左右滑动） -->
    <div v-else class="swipe-container"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd"
         @touchcancel="resetSwipe">
      <div class="swipe-card" :style="swipeStyle">
        <div class="flashcard swipe-inner">
          <div class="flashcard-face flashcard-front">
            <div class="swipe-count">{{ index + 1 }} / {{ queue.length }}</div>
            <div class="word-big">{{ current.word }}</div>
            <div v-if="revealed" class="reveal swipe-reveal">
              <div v-if="current.meaning" class="meaning">{{ current.meaning }}</div>
              <div v-if="current.context" class="context">{{ current.context }}</div>
              <div class="next-due">
                下次复习: {{ formatDate(current.nextReviewAt) }}
              </div>
            </div>
            <div v-if="!revealed" class="tap-hint">点击翻转</div>
            <div class="swipe-hint">← 向左:不认识 | 向右:认识 →</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="word-big">{{ current.word }}</div>
            <div class="meaning">{{ current.meaning }}</div>
            <div v-if="current.context" class="context">{{ current.context }}</div>
            <div class="memory-strength" :class="strengthClass(current.stability)">
              <span class="strength-label">记忆强度</span>
              <span class="strength-value">{{ strengthPercent(current.stability) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="revealed" class="swipe-btns">
        <button class="rate-swipe wrong" @click="rate(1)">
          <span class="swipe-icon">←</span> 不认识
        </button>
        <button class="rate-swipe correct" @click="rate(3)">
          <span class="swipe-icon">→</span> 认识
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue'
import { vocabAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const queue = ref([])
const index = ref(0)
const revealed = ref(false)
const flipCard = ref(false)
const mode = ref('flip')

// Swipe
const touchStartX = ref(0)
const touchCurrentX = ref(0)

const current = computed(() => queue.value[index.value] || {})

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await vocabAPI.review()
    queue.value = res.data?.data?.list || []
    index.value = 0
    revealed.value = false
    flipCard.value = false
  } catch (e) {
    queue.value = []
    ElMessage.error(e?._userMessage || '加载复习队列失败')
  } finally {
    loading.value = false
  }
}

const setMode = (m) => {
  mode.value = m
  flipCard.value = false
  revealed.value = false
}

const rate = async (rating) => {
  const w = current.value
  try {
    await vocabAPI.submitReview(w.id, rating)
    revealed.value = false
    flipCard.value = false
    if (index.value + 1 < queue.value.length) {
      index.value++
    } else {
      await fetchQueue()
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  }
}

// Swipe handlers
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchCurrentX.value = touchStartX.value
}

const handleTouchMove = (e) => {
  touchCurrentX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  const diff = touchCurrentX.value - touchStartX.value
  if (Math.abs(diff) > 60) {
    if (diff < 0) {
      // 向左滑 → 不认识
      rate(1)
    } else {
      // 向右滑 → 认识
      rate(3)
    }
  }
  resetSwipe()
}

const resetSwipe = () => {
  touchStartX.value = 0
  touchCurrentX.value = 0
}

const swipeStyle = computed(() => {
  if (mode.value !== 'swipe') return {}
  const diff = touchCurrentX.value - touchStartX.value
  const rotation = diff * 0.05
  const opacity = diff > 120 ? '0.6' : '1'
  return {
    transform: `translateX(${diff}px) rotate(${rotation}deg)`,
    opacity,
  }
})

// FSRS 记忆强度计算
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
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 12px 76px;
  min-height: 100vh;
  background: var(--page-bg);
}
.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.center-loading { display: flex; justify-content: center; padding: 60px 0; }
.done-page { text-align: center; padding: 40px 0; }
.done-text { color: #23B26D; font-size: 18px; font-weight: 600; }

/* 模式切换 */
.mode-switch { display: flex; gap: 6px; }
.mode-switch .el-button { font-size: 12px; height: 28px; padding: 0 10px; }

/* ===== 卡片翻转模式 ===== */
.card-wrap { display: flex; flex-direction: column; align-items: center; }
.flashcard-container {
  width: 100%;
  cursor: pointer;
  perspective: 1000px;
}
.flashcard {
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  min-height: 300px;
}
.flashcard.flipped { transform: rotateY(180deg); }
.flashcard-face {
  position: absolute;
  width: 100%;
  min-height: 300px;
  backface-visibility: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.flashcard-front { z-index: 2; }
.flashcard-back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-color: #A5D6A7;
}
.tap-hint {
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.7;
}
.swipe-count {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255,255,255,0.8);
  padding: 2px 10px;
  border-radius: 10px;
}

/* ===== 翻页模式 ===== */
.swipe-container {
  position: relative;
  width: 100%;
  touch-action: pan-y;
}
.swipe-card {
  transition: transform 0.3s ease;
  will-change: transform;
}
.swipe-hint {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
.swipe-btns {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
}
.rate-swipe {
  flex: 1;
  height: 52px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.rate-swipe.wrong { background: #FFF3E0; color: #E65100; border: 2px solid #FFB74D; }
.rate-swipe.correct { background: #E8F5E9; color: #2E7D32; border: 2px solid #81C784; }
.swipe-icon { font-size: 20px; }

/* 单词与释义 */
.word-big {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: center;
}
.meaning {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 500;
  text-align: center;
}
.context {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding: 0 12px;
  line-height: 1.5;
}
.next-due {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.memory-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
}
.memory-strength .strength-label { opacity: 0.7; }
.memory-strength .strength-value { font-weight: 700; }
.memory-strength.strength-high { background: #E8F5E9; color: #2E7D32; }
.memory-strength.strength-mid { background: #FFF3E0; color: #E65100; }
.memory-strength.strength-low { background: #FBE9E7; color: #D84315; }
.memory-strength.strength-weak { background: #FFEBEE; color: #C62828; }

/* 评分按钮 */
.rating-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 20px;
  width: 100%;
}
.rating-btns button {
  padding: 0;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.rating-btns .rate.again { background: #FFEBEE; color: #C62828; }
.rating-btns .rate.hard { background: #FFF3E0; color: #E65100; }
.rating-btns .rate.good { background: #E8F5E9; color: #2E7D32; }
.rating-btns .rate.easy { background: #E3F2FD; color: #1565C0; }
.rating-btns button:hover { transform: scale(1.05); }
.rating-btns button:active { transform: scale(0.95); }

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .flashcard-face { padding: 24px; min-height: 260px; }
  .flashcard-container { min-height: 260px; }
  .rating-btns { gap: 6px; }
  .rating-btns button { height: 44px; font-size: 13px; border-radius: 10px; }
}

@media (max-width: 480px) {
  .word-big { font-size: 26px; }
  .flashcard-face { padding: 20px; min-height: 220px; }
  .rating-btns { grid-template-columns: repeat(2, 1fr); }
  .rating-btns button { height: 46px; font-size: 14px; }
}
</style>
