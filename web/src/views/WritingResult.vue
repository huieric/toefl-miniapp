<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>
      <h2>AI 批改结果</h2>
    </div>
    <div class="card" v-if="result">
      <div class="score-display">
        <el-progress type="dashboard" :percentage="scorePercent" :color="scoreColor" :width="140">
          <template #default="{ percentage }">
            <span class="score-value">{{ result.score || 0 }}/{{ result.maxScore || 5 }}</span>
          </template>
        </el-progress>
      </div>
      <div class="essay-section" v-if="result.essayContent">
        <h4>你的作文</h4>
        <div class="essay-text">{{ result.essayContent }}</div>
      </div>
      <div class="feedback-section">
        <div class="feedback-item" v-if="result.grammar">
          <h4>语法建议</h4>
          <p>{{ result.grammar }}</p>
        </div>
        <div class="feedback-item" v-if="result.vocabulary">
          <h4>词汇建议</h4>
          <p>{{ result.vocabulary }}</p>
        </div>
        <div class="feedback-item" v-if="result.overall">
          <h4>总体评价</h4>
          <p>{{ result.overall }}</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <el-button type="primary" @click="$router.push('/writing')">继续练习</el-button>
      </div>
    </div>
    <el-empty v-else description="暂无结果数据" />
    <AdBanner placement="practice-done" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { practiceAPI } from '@/api'

const route = useRoute()
const result = ref(null)

const scorePercent = computed(() => {
  if (!result.value) return 0
  return Math.round((result.value.score || 0) / (result.value.maxScore || 5) * 100)
})

const scoreColor = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return '#67C23A'
  if (p >= 60) return '#E6A23C'
  return '#F56C6C'
})

onMounted(async () => {
  try {
    const res = await practiceAPI.getResult(route.params.id)
    result.value = res.data?.result || res.data || {}
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.score-display { text-align: center; margin-bottom: 24px; }
.score-value { font-size: 24px; font-weight: 700; }
.essay-section { margin-bottom: 20px; }
.essay-text {
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px;
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
}
.feedback-section { margin-bottom: 8px; }
.feedback-item { margin-bottom: 16px; }
.feedback-item h4 { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.feedback-item p { font-size: 14px; color: var(--text); line-height: 1.7; }
</style>