<template>
  <div class="review-page">
    <!-- 顶部栏 -->
    <div class="review-top">
      <el-button text @click="$router.push('/wrong-book')">
        <el-icon><ArrowLeft /></el-icon>
        <span class="back-text">返回</span>
      </el-button>
      <div class="progress-bar">
        <span class="progress-text">{{ index + 1 }} / {{ queue.length }}</span>
        <div class="progress-track"><div class="progress-fill" :style="{ width: progressPercent + '%' }"></div></div>
      </div>
    </div>

    <!-- 加载中（骨架屏） -->
    <div v-if="loading" class="center">
      <div class="skeleton-card">
        <div class="skeleton-line w-30" style="height:24px; margin-bottom:14px;"></div>
        <div class="skeleton-line w-80 h-40"></div>
        <div class="skeleton-line w-100 h-20"></div>
        <div class="skeleton-line w-100"></div>
        <div class="skeleton-line w-100"></div>
        <div class="skeleton-line w-60" style="margin-top:16px;"></div>
      </div>
    </div>

    <!-- 完成 -->
    <div v-else-if="!queue.length" class="done">
      <div class="done-icon-wrap">
        <el-icon :size="64" color="#23B26D"><CircleCheck /></el-icon>
      </div>
      <p class="done-text">今日错题复习完成 🎉</p>
      <p class="done-sub">继续保持，明天见！</p>
      <el-button type="primary" @click="$router.push('/wrong-book')">返回错题本</el-button>
    </div>

    <!-- 卡片 -->
    <div v-else class="card-wrap" :key="current.wrongId + '-' + index">
      <!-- 翻转容器 -->
      <div class="flip-container" :class="{ flipped: revealed }" @click="toggleFlip">
        <!-- 正面：题目 -->
        <div class="card-face card-front">
          <div class="card-header">
            <el-tag size="small" :type="subjectTag(current.subject)">{{ subjectLabel(current.subject) }}</el-tag>
            <span class="difficulty-badge" :class="current.difficulty">{{ difficultyLabel(current.difficulty) }}</span>
          </div>
          <p v-if="current.passageText" class="passage-preview">{{ current.passageText }}</p>
          <p class="q-text">{{ current.content }}</p>

          <div class="options">
            <div
              v-for="opt in parsedOptions"
              :key="opt.label"
              class="option"
              :class="{ selected: selected === opt.label }"
              @click.stop="selectOption(opt.label)"
            >
              <span class="opt-letter">{{ opt.label }}.</span>
              <span class="opt-text">{{ opt.text }}</span>
              <span v-if="selected === opt.label" class="opt-check">
                <el-icon><Select /></el-icon>
              </span>
            </div>
          </div>

          <div v-if="!selected" class="hint">点击选项作答</div>
        </div>

        <!-- 反面：解析 + 评分 -->
        <div class="card-face card-back">
          <div class="card-header">
            <el-tag size="small" :type="subjectTag(current.subject)">{{ subjectLabel(current.subject) }}</el-tag>
            <el-tag size="small" :type="isCorrect ? 'success' : 'danger'">
              {{ isCorrect ? '✅ 正确' : '❌ 错误' }}
            </el-tag>
          </div>

          <div class="answer-reveal">
            <span class="reveal-label">正确答案</span>
            <span class="reveal-value">{{ answerLabels.value.join(', ') }}</span>
          </div>

          <p v-if="current.analysis" class="analysis">{{ current.analysis }}</p>
          <p v-else class="analysis no-analysis">暂无解析</p>

          <!-- FSRS 评分 -->
          <div class="rating-section">
            <p class="rating-question">掌握程度？</p>
            <div class="rating-btns">
              <button class="rate again" @click.stop="rate(1)">
                <span class="rate-label">忘记</span>
                <span class="rate-short">Again</span>
              </button>
              <button class="rate hard" @click.stop="rate(2)">
                <span class="rate-label">模糊</span>
                <span class="rate-short">Hard</span>
              </button>
              <button class="rate good" @click.stop="rate(3)">
                <span class="rate-label">认识</span>
                <span class="rate-short">Good</span>
              </button>
              <button class="rate easy" @click.stop="rate(4)">
                <span class="rate-label">轻松</span>
                <span class="rate-short">Easy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交/下一题按钮 -->
      <div v-if="!revealed" class="action-row">
        <el-button
          type="primary"
          size="large"
          :disabled="!selected"
          @click="submitAnswer"
          class="submit-btn"
        >
          提交答案
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck, Select } from '@element-plus/icons-vue'
import { wrongAPI } from '@/api'

const subjectLabel = (s) => ({ reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }[s] || s || '阅读')
const subjectTag = (s) => ({ reading: '', listening: 'warning', speaking: 'danger', writing: 'info' }[s] || '')
const difficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
const difficultyBadgeClass = (d) => ({ easy: 'easy', medium: 'medium', hard: 'hard' }[d] || '')

const loading = ref(true)
const queue = ref([])
const index = ref(0)
const selected = ref(null)
const revealed = ref(false)
const isCorrect = ref(false)

const current = computed(() => queue.value[index.value] || {})
const progressPercent = computed(() => queue.value.length ? Math.round(((index.value + (revealed.value ? 1 : 0)) / queue.value.length) * 100) : 0)

const parseOptions = (opts) => {
  if (!opts) return []
  let arr = opts
  if (typeof opts === 'string') { try { arr = JSON.parse(opts) } catch (_) { return [] } }
  if (!Array.isArray(arr)) return []
  return arr.map((o, i) => {
    if (o && typeof o === 'object') return { label: o.label || String.fromCharCode(65 + i), text: o.text || '' }
    return { label: String.fromCharCode(65 + i), text: String(o) }
  }).filter(o => o.text !== '')
}

const parsedOptions = computed(() => parseOptions(current.value.options))

const answerLabels = computed(() => {
  const a = current.value.answer
  if (Array.isArray(a)) return a.map(String).map(s => s.trim()).filter(Boolean)
  return String(a || '').match(/[A-F]/g) || []
})
const isInAnswer = (label) => answerLabels.value.includes(label)

const selectOption = (label) => {
  if (revealed.value) return
  selected.value = label
}

const toggleFlip = () => {
  if (revealed.value) {
    revealed.value = false
  }
}

const submitAnswer = () => {
  isCorrect.value = isInAnswer(selected.value)
  revealed.value = true
}

const rate = async (rating) => {
  try {
    await wrongAPI.submitReview(current.value.wrongId, rating)
    selected.value = null
    revealed.value = false
    if (index.value + 1 < queue.value.length) {
      // 平滑过渡到下一题
      setTimeout(() => { index.value++ }, 100)
    } else {
      await fetchQueue()
    }
    if (index.value < queue.value.length) {
      ElMessage.success('已记录，下一题')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '提交失败')
  }
}

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await wrongAPI.reviewPlan()
    queue.value = res.data?.data?.list || []
    index.value = 0
    selected.value = null
    revealed.value = false
  } catch (e) {
    queue.value = []
    ElMessage.error(e?._userMessage || '加载复习队列失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchQueue)
</script>

<style scoped>
/* ===== 整体布局 ===== */
.review-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* ===== 顶部栏 ===== */
.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.back-text { margin-left: 4px; }

.progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-text {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.progress-track {
  width: 120px;
  height: 6px;
  background: var(--border-light, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary, #409eff), #67c23a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* ===== 加载骨架屏 ===== */
.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 60vh;
}
.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid var(--border-light, #e5e7eb);
  border-top-color: var(--primary, #409eff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { color: var(--text-secondary); margin: 12px 0 0; font-size: 14px; }

/* 骨架屏卡片样式 */
.skeleton-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 10px;
}
.skeleton-line.w-30 { width: 30%; }
.skeleton-line.w-60 { width: 60%; }
.skeleton-line.w-80 { width: 80%; }
.skeleton-line.w-100 { width: 100%; }
.skeleton-line.h-20 { height: 20px; }
.skeleton-line.h-40 { height: 40px; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 完成 ===== */
.done {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60vh;
}
.done-text { color: var(--text-secondary); font-size: 16px; font-weight: 500; margin: 0; }
.done-sub { color: var(--text-muted, #909399); font-size: 13px; margin: 0; }
.done-icon-wrap { margin-bottom: 8px; }

/* ===== 翻转卡片 ===== */
.card-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

.flip-container {
  perspective: 1200px;
  cursor: default;
  min-height: 320px;
  transition: transform 0.3s ease;
}
.flip-container:active {
  transform: scale(0.98);
}
.flip-container.flipped { cursor: pointer; }

.card-face {
  width: 100%;
  min-height: 320px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 20px;
  padding: 24px 20px;
  backface-visibility: hidden;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.flip-container.flipped .card-front {
  transform: rotateY(180deg);
}
.card-back {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(180deg);
  width: 100%;
}
.flip-container.flipped .card-back {
  transform: rotateY(0);
}

/* 重置 absolute 在相对容器中 */
.card-back {
  position: relative;
  width: 100%;
}
.card-wrap > .flip-container {
  position: relative;
}
.card-back {
  position: absolute;
  top: 0;
  left: 0;
}

/* 点击提示 */
.tap-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 16px;
  font-size: 12px;
  color: var(--text-muted, #909399);
}
.tap-hint::before {
  content: '👆';
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.difficulty-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}
.difficulty-badge.easy { background: #eaf7ea; color: #149033; }
.difficulty-badge.medium { background: #fff4e6; color: #e8861a; }
.difficulty-badge.hard { background: #fdecea; color: #d43030; }

.passage-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
  background: var(--bg-secondary, #f8f9fa);
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.q-text {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  line-height: 1.7;
  color: var(--text, #1f2937);
}

/* ===== 选项 ===== */
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1.5px solid var(--border, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.15s;
  background: #fff;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}
.option:hover {
  border-color: var(--primary, #409eff);
  background: var(--primary-soft, #ecf5ff);
}
.option:active {
  transform: scale(0.98);
}
.option.selected {
  border-color: var(--primary, #409eff);
  background: var(--primary-soft, #ecf5ff);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}
.opt-letter { font-weight: 700; color: var(--primary, #409eff); min-width: 20px; }
.opt-text { flex: 1; }
.opt-check { color: var(--primary, #409eff); font-size: 18px; }

.hint {
  text-align: center;
  color: var(--text-muted, #909399);
  font-size: 13px;
  margin-top: 12px;
}

/* ===== 反面：解析 ===== */
.answer-reveal {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 10px;
  margin: 12px 0;
}
.reveal-label { font-size: 13px; color: var(--text-secondary); }
.reveal-value { font-size: 18px; font-weight: 700; color: var(--primary, #409eff); }

.analysis {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text, #1f2937);
  margin: 14px 0 0;
  padding: 14px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 10px;
  border-left: 3px solid var(--primary, #409eff);
  max-height: 200px;
  overflow-y: auto;
}
.analysis.no-analysis {
  border-left-color: var(--text-muted, #909399);
  color: var(--text-muted, #909399);
}

/* ===== FSRS 评分 ===== */
.rating-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e5e7eb);
}
.rating-question {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px;
  text-align: center;
}
.rating-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  border-radius: 14px;
  border: 2px solid var(--border, #e5e7eb);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
  background: var(--card-bg, #fff);
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
}
.rate::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.15s;
  border-radius: inherit;
}
.rate:active::before {
  opacity: 0.1;
}
.rate:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.rate .rate-label { font-size: 14px; font-weight: 700; }
.rate .rate-short { font-size: 10px; opacity: 0.7; margin-top: 2px; }

.rate.again { border-color: #fca5a5; color: #d43030; }
.rate.again::before { background: #d43030; }
.rate.hard { border-color: #fdba74; color: #d97706; }
.rate.hard::before { background: #d97706; }
.rate.good { border-color: #86efac; color: #149033; }
.rate.good::before { background: #149033; }
.rate.easy { border-color: #93c5fd; color: #1d4ed8; }
.rate.easy::before { background: #1d4ed8; }

/* ===== 提交按钮 ===== */
.action-row {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
.submit-btn {
  width: 100%;
  max-width: 320px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 14px;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .review-page {
    padding: 10px 12px 20px;
    padding-top: env(safe-area-inset-top, 0);
  }
  .review-top {
    margin-bottom: 12px;
  }
  .back-text { display: none; }
  .back-btn .el-icon { font-size: 20px; }
  .progress-track { width: 80px; }

  /* 卡片移动端适配 */
  .card-face {
    padding: 18px 16px;
    border-radius: 16px;
    min-height: 280px;
  }
  .q-text {
    font-size: 15px;
    margin-bottom: 12px;
  }
  .option {
    padding: 12px 14px;
    font-size: 13px;
    gap: 8px;
    border-radius: 12px;
    min-height: 48px;
  }
  .passage-preview {
    max-height: 100px;
    padding: 10px 12px;
    font-size: 12px;
  }

  /* 评分按钮全宽行 */
  .rating-btns {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .rate {
    min-height: 48px;
    border-radius: 12px;
    border-width: 2px;
  }
  .rate .rate-label { font-size: 13px; }
  .rate .rate-short { font-size: 9px; }

  /* 移动端固定底部提交按钮 */
  .action-row {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: linear-gradient(to top, rgba(255,255,255,0.98) 60%, rgba(255,255,255,0));
    z-index: 100;
  }
  .submit-btn {
    max-width: 100%;
    height: 44px;
  }
  .card-wrap {
    padding-bottom: 72px;
  }

  /* 翻转提示 */
  .tap-hint { display: none; }
}

@media (max-width: 480px) {
  .review-page {
    padding: 8px 10px 16px;
  }
  .card-face {
    padding: 16px 14px;
    min-height: 260px;
  }
  .q-text {
    font-size: 14px;
  }
  .option {
    padding: 10px 12px;
    font-size: 13px;
  }
  .rate .rate-label { font-size: 12px; }
  .rate .rate-short { font-size: 8px; }
}
</style>
