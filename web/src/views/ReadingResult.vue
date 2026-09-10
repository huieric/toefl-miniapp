<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push('/reading')">
          <el-icon><ArrowLeft /></el-icon>
          <span class="back-text">返回列表</span>
        </el-button>
      </div>
      <h2>答题结果</h2>
    </div>
    <div class="card" v-if="result">
      <div class="result-summary">
        <div class="result-icon">
          <el-icon :size="64" :color="result.isCorrect ? 'var(--success)' : 'var(--danger)'">
            <CircleCheck v-if="result.isCorrect" />
            <CircleClose v-else />
          </el-icon>
        </div>
        <div class="result-title">
          <span :style="{ color: result.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }">
            {{ result.isCorrect ? '回答正确！' : '回答错误' }}
          </span>
        </div>
        <div class="summary-detail">
          <p><strong>题目：</strong>{{ result.title || '阅读理解' }}</p>
          <p><strong>你的答案：</strong><span class="answer-text">{{ result.userAnswer || '--' }}</span></p>
          <p><strong>正确答案：</strong><span class="correct-text">{{ result.correctAnswer || result.answer || '--' }}</span></p>
          <p><strong>用时：</strong>{{ result.duration || '--' }} 秒</p>
        </div>
        <el-button type="primary" class="action-btn" @click="$router.push('/reading')">继续练习</el-button>
      </div>
    </div>
    <el-empty v-else description="暂无结果数据" />
    <AdBanner placement="practice-done" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { practiceAPI } from '@/api'
import AdBanner from '@/components/AdBanner.vue'

const route = useRoute()
const result = ref(null)

onMounted(async () => {
  try {
    const res = await practiceAPI.getResult(route.params.id)
    result.value = res.data?.result || res.data || {}
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.result-summary { text-align: center; }
.result-icon { margin-bottom: 12px; }
.result-title { margin-bottom: 16px; font-size: 18px; }
.summary-detail {
  text-align: left;
  background: #F8F9FC;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px 22px;
  margin-bottom: 18px;
  line-height: 2.1;
  font-size: 14px;
}
.summary-detail p { margin: 0; }
.summary-detail strong { color: var(--text); font-weight: 700; }
.answer-text { color: var(--warning); font-weight: 600; }
.correct-text { color: var(--success); font-weight: 600; }
.action-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-left { display: flex; align-items: center; gap: 8px; }
  .back-text { display: none; }
  .page-container { padding: 12px 12px 80px; }
  .page-header { margin-bottom: 12px; }
  .page-header h2 { font-size: 20px; }
  .card { padding: 14px; }
  .result-icon .el-icon { font-size: 56px; }
  .result-title { font-size: 16px; margin-bottom: 12px; }
  .summary-detail {
    padding: 14px 16px;
    font-size: 13px;
    line-height: 2;
  }
  .action-btn {
    height: 44px;
    font-size: 15px;
  }
}
</style>
