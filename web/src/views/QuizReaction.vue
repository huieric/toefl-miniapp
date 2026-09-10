<template>
  <div class="quiz-reactions" v-if="show">
    <!-- 结果情感反馈层 -->
    <div class="reaction-overlay" :class="{ visible: showOverlay, complete: feedbackShown }">
      <div class="reaction-emoji" :class="reactionClass">
        {{ currentReaction.emoji }}
      </div>
      <div class="reaction-text">{{ currentReaction.text }}</div>
      <div class="reaction-sub">{{ currentReaction.sub }}</div>
      
      <!-- 连击指示器 -->
      <div v-if="streak > 1" class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">{{ streak }}</span>
      </div>
    </div>

    <!-- 情感选择按钮（答题后显示） -->
    <div v-if="!feedbackShown && showEmotionPicker" class="emotion-picker">
      <div class="picker-title">{{ pickerTitle }}</div>
      <div class="emotion-grid">
        <button
          v-for="emo in emotions"
          :key="emo.type"
          class="emotion-btn"
          :class="[emo.type, { selected: selectedEmotion === emo.type }]"
          @click="selectEmotion(emo)"
        >
          <span class="emo-icon">{{ emo.icon }}</span>
          <span class="emo-label">{{ emo.label }}</span>
        </button>
      </div>
    </div>

    <!-- 情感分布图（在统计数据中显示） -->
    <div class="emotion-stats" v-if="showStats && stats && stats.emotions?.length">
      <div class="stats-header">
        <span>😊 学习情感分析</span>
        <span class="stats-total">{{ stats.total }} 次答题</span>
      </div>
      <div class="stats-bar-container">
        <div
          v-for="e in stats.emotions"
          :key="e.emotion"
          class="stats-bar-segment"
          :style="{ width: e.percentage + '%' }"
          :class="e.emotion"
          :title="`${emotionMap[e.emotion].label}: ${e.percentage}% (${e.count})`"
        />
      </div>
      <div class="stats-legend">
        <span
          v-for="e in stats.emotions"
          :key="e.emotion"
          class="legend-item"
          :class="e.emotion"
        >
          <span class="legend-dot" :class="e.emotion" />
          <span class="legend-label">{{ emotionMap[e.emotion].emoji }} {{ emotionMap[e.emotion].label }}</span>
          <span class="legend-pct">{{ e.percentage }}%</span>
        </span>
      </div>
      <div class="positive-rate">
        积极学习率: <strong>{{ stats.positiveRate }}%</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { quizReactionAPI } from '@/api'

const props = defineProps({
  result: { type: Object, default: null },
  isCorrect: { type: Boolean, default: null },
  score: { type: Number, default: 0 },
})

const emit = defineEmits(['emotion-selected'])

const emotions = [
  { type: 'excited', icon: '🎉', label: '太棒了！', bg: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  { type: 'proud', icon: '🏆', label: '超有成就感', bg: 'linear-gradient(135deg, #4CAF50, #8BC34A)' },
  { type: 'relieved', icon: '😌', label: '松了一口气', bg: 'linear-gradient(135deg, #2196F3, #64B5F6)' },
  { type: 'confused', icon: '🤔', label: '有点迷茫', bg: 'linear-gradient(135deg, #FFC107, #FFD54F)' },
  { type: 'frustrated', icon: '💪', label: '绝不放弃', bg: 'linear-gradient(135deg, #9C27B0, #BA68C8)' },
]

const emotionMap = {
  excited: { emoji: '🎉', label: '兴奋' },
  proud: { emoji: '🏆', label: '自豪' },
  relieved: { emoji: '😌', label: '安心' },
  confused: { emoji: '🤔', label: '困惑' },
  frustrated: { emoji: '💪', label: '不甘' },
}

const show = ref(true)
const showOverlay = ref(false)
const feedbackShown = ref(false)
const showEmotionPicker = ref(true)
const showStats = ref(true)
const selectedEmotion = ref(null)
const streak = ref(0)
const stats = ref(null)

const currentReaction = computed(() => {
  if (!selectedEmotion.value) return { emoji: '', text: '', sub: '' }
  const emo = emotions.find(e => e.type === selectedEmotion.value)
  return {
    emoji: emo?.icon || '✨',
    text: emo?.label || '',
    sub: props.isCorrect === true ? '继续保持！' : '下次一定行！',
  }
})

const reactionClass = computed(() => selectedEmotion.value || '')

const pickerTitle = computed(() => {
  if (props.isCorrect === true) return '答对了！感觉如何？'
  return '没关系，你的感受是？'
})

const selectEmotion = async (emo) => {
  selectedEmotion.value = emo.type
  showEmotionPicker.value = false
  showOverlay.value = true
  feedbackShown.value = true

  try {
    await quizReactionAPI.record({
      questionId: props.result?.questionId || 0,
      emotion: emo.type,
      score: props.score || 0,
      isCorrect: props.isCorrect ?? true,
    })
  } catch (e) {
    console.warn('记录反应失败:', e)
  }

  emit('emotion-selected', { emotion: emo.type, isCorrect: props.isCorrect })
}

const fetchStats = async () => {
  try {
    const res = await quizReactionAPI.getSummary()
    stats.value = res.data?.data
  } catch (e) {
    console.warn('获取统计失败:', e)
  }
}

const fetchStreak = async () => {
  try {
    const res = await quizReactionAPI.getStreak()
    streak.value = res.data?.data?.currentStreak || 0
  } catch (e) {
    console.warn('获取连胜失败:', e)
  }
}

onMounted(() => {
  fetchStats()
  fetchStreak()
  // 如果有结果数据，自动选择对应的反应
  if (props.result && props.isCorrect !== null) {
    setTimeout(() => {
      if (!selectedEmotion.value) {
        selectEmotion(emotions[props.isCorrect ? 0 : 3])
      }
    }, 500)
  }
})
</script>

<style scoped>
.quiz-reactions {
  position: relative;
}

/* 结果反馈覆盖层 */
.reaction-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.reaction-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}
.reaction-emoji {
  font-size: 100px;
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.reaction-text {
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-top: 12px;
  animation: slideUp 0.4s ease 0.2s both;
}
.reaction-sub {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  animation: slideUp 0.4s ease 0.4s both;
}
.streak-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #FF6B35, #FF4500);
  border-radius: 20px;
  font-size: 18px;
  font-weight: 800;
  color: white;
  animation: bounce 0.6s ease 0.6s both;
}

/* 情感选择器 */
.emotion-picker {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}
.picker-title {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.emotion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.emotion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 600;
}
.emotion-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.emotion-btn.selected {
  border-width: 3px;
  transform: scale(1.05);
}
.emotion-btn.excited.selected { border-color: #FF6B6B; background: #FFF0F0; }
.emotion-btn.proud.selected { border-color: #4CAF50; background: #E8F5E9; }
.emotion-btn.relieved.selected { border-color: #2196F3; background: #E3F2FD; }
.emotion-btn.confused.selected { border-color: #FFC107; background: #FFF8E1; }
.emotion-btn.frustrated.selected { border-color: #9C27B0; background: #F3E5F5; }
.emo-icon { font-size: 24px; }
.emo-label { color: var(--text-secondary); }

/* 情感统计 */
.emotion-stats {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  margin-top: 12px;
}
.stats-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.stats-total { color: var(--text-secondary); font-weight: 400; }
.stats-bar-container {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}
.stats-bar-segment {
  transition: width 0.5s ease;
}
.stats-bar-segment.excited { background: linear-gradient(90deg, #FF6B6B, #FF8E53); }
.stats-bar-segment.proud { background: linear-gradient(90deg, #4CAF50, #8BC34A); }
.stats-bar-segment.relieved { background: linear-gradient(90deg, #2196F3, #64B5F6); }
.stats-bar-segment.confused { background: linear-gradient(90deg, #FFC107, #FFD54F); }
.stats-bar-segment.frustrated { background: linear-gradient(90deg, #9C27B0, #BA68C8); }
.stats-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-dot.excited { background: #FF6B6B; }
.legend-dot.proud { background: #4CAF50; }
.legend-dot.relieved { background: #2196F3; }
.legend-dot.confused { background: #FFC107; }
.legend-dot.frustrated { background: #9C27B0; }
.legend-pct { font-weight: 600; margin-left: 2px; }
.positive-rate {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 动画 */
@keyframes popIn {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  70% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* ===== 移动端适配 ===== */
@media (max-width: 480px) {
  .emotion-picker {
    left: 12px;
    right: 12px;
    transform: none;
    min-width: auto;
  }
  .reaction-emoji { font-size: 80px; }
  .reaction-text { font-size: 24px; }
}
</style>
