<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/mock-exam')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>考试成绩单</h2>
    </div>

    <div class="card" v-if="result">
      <div class="total-score">
        <div class="score-circle">
          <span class="big-score">{{ result.totalScore || result.score || 0 }}</span>
          <span class="score-unit">分</span>
        </div>
      </div>

      <div class="score-grid">
        <div class="score-item">
          <div class="score-subject">阅读</div>
          <div class="score-value">{{ result.scores?.reading || result.reading || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item">
          <div class="score-subject">听力</div>
          <div class="score-value">{{ result.scores?.listening || result.listening || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item">
          <div class="score-subject">口语</div>
          <div class="score-value">{{ result.scores?.speaking || result.speaking || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item">
          <div class="score-subject">写作</div>
          <div class="score-value">{{ result.scores?.writing || result.writing || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
      </div>

      <div class="detail-section" v-if="result.details?.length">
        <h4>详细结果</h4>
        <div v-for="(d, i) in result.details" :key="i" class="detail-item" :class="{ correct: d.isCorrect, wrong: !d.isCorrect }">
          <span>{{ i + 1 }}. {{ d.question || d.title }}</span>
          <el-tag :type="d.isCorrect ? 'success' : 'danger'" size="small">{{ d.isCorrect ? '正确' : '错误' }}</el-tag>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <el-button type="primary" @click="$router.push('/mock-exam')">再来一次</el-button>
      </div>
    </div>
    <el-empty v-else description="暂无成绩数据" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { examAPI } from '@/api'

const route = useRoute()
const result = ref(null)

onMounted(async () => {
  try {
    const res = await examAPI.result(route.params.id)
    result.value = res.data?.exam || res.data?.result || res.data || {}
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.total-score { text-align: center; margin-bottom: 24px; }
.score-circle {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  width: 140px; height: 140px; border-radius: 50%;
  background: linear-gradient(135deg, #4A90D9, #6BA5E7);
  color: #fff;
}
.big-score { font-size: 44px; font-weight: 700; }
.score-unit { font-size: 14px; opacity: 0.8; }
.score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.score-item {
  text-align: center; padding: 16px; background: #f9fafb; border-radius: 10px;
}
.score-subject { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.score-value { font-size: 28px; font-weight: 700; color: var(--primary); }
.score-max { font-size: 12px; color: var(--text-secondary); }
.detail-section h4 { margin-bottom: 12px; }
.detail-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; margin-bottom: 8px;
  border-radius: 8px; border-left: 4px solid;
}
.detail-item.correct { border-color: var(--success); background: rgba(103,194,58,0.04); }
.detail-item.wrong { border-color: var(--danger); background: rgba(245,108,108,0.04); }
@media (max-width: 767px) { .score-grid { grid-template-columns: repeat(2, 1fr); } }
</style>