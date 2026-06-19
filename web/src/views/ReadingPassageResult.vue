<template>
  <div class="page-container">
    <div class="result-header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回篇章
      </el-button>
      <h2>答题结果</h2>
    </div>

    <div v-if="resultData" class="result-body">
      <!-- 成绩卡片 -->
      <div class="score-card">
        <div class="score-ring">
          <el-progress
            type="circle"
            :percentage="accuracyPercent"
            :width="140"
            :stroke-width="12"
            :color="scoreColor"
          >
            <template #default>
              <span class="score-value">{{ accuracyPercent }}%</span>
            </template>
          </el-progress>
        </div>
        <div class="score-stats">
          <div class="stat-item correct">
            <span class="stat-num">{{ correctCount }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item wrong">
            <span class="stat-num">{{ wrongCount }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat-item total">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-label">总题数</span>
          </div>
        </div>
      </div>

      <!-- 逐题回顾 -->
      <div class="review-section">
        <h3 class="review-title">逐题回顾</h3>
        <div
          v-for="(r, i) in results"
          :key="r.id"
          class="review-item"
          :class="{ correct: r.isCorrect, wrong: !r.isCorrect }"
        >
          <div class="review-head">
            <span class="review-num">Q{{ i + 1 }}</span>
            <span class="review-verdict">
              {{ r.isCorrect ? '✅ 正确' : '❌ 错误' }}
            </span>
            <el-tag size="small" effect="plain">{{ typeLabel(r.type) }}</el-tag>
          </div>
          <p class="review-content">{{ r.content }}</p>
          <div v-if="!r.isCorrect" class="review-detail">
            <p class="detail-line">你的答案：<strong>{{ r.selected }}</strong></p>
            <p class="detail-line">正确答案：<strong class="correct-answer">{{ r.answer }}</strong></p>
            <p v-if="r.analysis" class="detail-analysis">解析：{{ r.analysis }}</p>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="result-actions">
        <el-button @click="goBack">返回篇章</el-button>
        <el-button type="primary" @click="redoPassage">
          <el-icon><Refresh /></el-icon>重新作答
        </el-button>
        <el-button @click="goList">返回列表</el-button>
      </div>
    </div>

    <el-empty v-else description="暂无结果数据" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const passageId = computed(() => route.params.passageId)
const results = ref([])

const totalCount = computed(() => results.value.length)
const correctCount = computed(() => results.value.filter(r => r.isCorrect).length)
const wrongCount = computed(() => totalCount.value - correctCount.value)
const accuracyPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const scoreColor = computed(() => {
  if (accuracyPercent.value >= 80) return '#67c23a'
  if (accuracyPercent.value >= 60) return '#e6a23c'
  return '#f56c6c'
})

const resultData = computed(() => results.value.length > 0)

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'

const goBack = () => router.push(`/reading/passage/${passageId.value}`)
const goList = () => router.push('/reading')
const redoPassage = () => router.push(`/reading/passage/${passageId.value}`)

onMounted(() => {
  // 从 localStorage 读取答题结果
  try {
    const key = `passage_result_${passageId.value}`
    const raw = localStorage.getItem(key)
    if (raw) {
      results.value = JSON.parse(raw)
      // 读取后清理
      localStorage.removeItem(key)
    }
  } catch (e) {
    console.error('读取答题结果失败:', e)
  }
})
</script>

<style scoped>
.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.result-header h2 {
  margin: 0;
  font-size: 20px;
}

.result-body {
  max-width: 800px;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-bottom: 24px;
}
.score-ring {
  flex-shrink: 0;
}
.score-value {
  font-size: 28px;
  font-weight: 700;
}
.score-stats {
  display: flex;
  gap: 32px;
  flex: 1;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-num {
  font-size: 32px;
  font-weight: 700;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.stat-item.correct .stat-num { color: var(--el-color-success); }
.stat-item.wrong .stat-num { color: var(--el-color-danger); }
.stat-item.total .stat-num { color: var(--el-color-primary); }

.review-section {
  margin-bottom: 24px;
}
.review-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.review-item {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid var(--el-border-color);
}
.review-item.correct {
  border-left-color: var(--el-color-success);
}
.review-item.wrong {
  border-left-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.review-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.review-num {
  font-weight: 700;
  color: var(--text-secondary);
}
.review-verdict {
  font-weight: 600;
  font-size: 14px;
}
.review-content {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.5;
}
.review-detail {
  margin-top: 8px;
  padding: 10px 14px;
  background: white;
  border-radius: 6px;
}
.detail-line {
  margin: 0 0 4px;
  font-size: 13px;
}
.correct-answer {
  color: var(--el-color-success);
}
.detail-analysis {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}
</style>
