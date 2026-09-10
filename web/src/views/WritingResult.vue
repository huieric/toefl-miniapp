<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push('/writing')">
          <el-icon><ArrowLeft /></el-icon>
          <span class="back-text">返回列表</span>
        </el-button>
      </div>
      <h2>AI 批改结果</h2>
    </div>
    <div class="card" v-if="result">
      <!-- 分数仪表盘 -->
      <div class="score-display">
        <el-progress
          type="dashboard"
          :percentage="scorePercent"
          :color="scoreColor"
          :width="160"
        >
          <template #default="{ percentage }">
            <div class="score-value">
              <div class="score-number">{{ result.score || 0 }}</div>
              <div class="score-max">/ {{ result.maxScore || 5 }}</div>
            </div>
          </template>
        </el-progress>
      </div>

      <!-- 作文内容 -->
      <div class="essay-section" v-if="result.essayContent">
        <h4 class="section-title">📝 你的作文</h4>
        <div class="essay-text">{{ result.essayContent }}</div>
      </div>

      <!-- AI 反馈 -->
      <div class="feedback-section">
        <div class="feedback-item" v-if="result.grammar">
          <h4 class="section-title">🔧 语法建议</h4>
          <p>{{ result.grammar }}</p>
        </div>
        <div class="feedback-item" v-if="result.vocabulary">
          <h4 class="section-title">📖 词汇建议</h4>
          <p>{{ result.vocabulary }}</p>
        </div>
        <div class="feedback-item" v-if="result.overall">
          <h4 class="section-title">💡 总体评价</h4>
          <p>{{ result.overall }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-area">
        <el-button type="primary" class="action-btn" @click="$router.push('/writing')">继续练习</el-button>
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
  if (p >= 80) return '#23B26D'
  if (p >= 60) return '#FF8A2A'
  return '#F0544F'
})

onMounted(async () => {
  try {
    const res = await practiceAPI.getResult(route.params.id)
    result.value = res.data?.result || res.data || {}
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.page-container {
  padding: 20px 16px 48px;
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 800;
}
.back-text {
  margin-left: 4px;
}

.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 24px;
}

/* 分数仪表盘 */
.score-display {
  text-align: center;
  margin-bottom: 28px;
}
.score-value {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.score-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}
.score-max {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 作文区域 */
.essay-section {
  margin-bottom: 22px;
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}
.essay-text {
  background: #F8F9FC;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  color: var(--text);
}

/* 反馈区域 */
.feedback-section {
  margin-bottom: 8px;
}
.feedback-item {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: #F8F9FC;
  border: 1px solid var(--border);
  border-radius: 14px;
}
.feedback-item:last-of-type {
  margin-bottom: 0;
}
.feedback-item p {
  font-size: 14px;
  color: var(--text);
  line-height: 1.7;
  margin: 0;
}

/* 操作区 */
.action-area {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.action-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 80px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .back-text { display: none; }
  .card {
    padding: 16px;
    border-radius: var(--radius-sm);
  }
  .score-display {
    margin-bottom: 20px;
  }
  .score-number {
    font-size: 28px;
  }
  .score-max {
    font-size: 13px;
  }
  .essay-section {
    margin-bottom: 18px;
  }
  .section-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  .essay-text {
    padding: 14px 16px;
    font-size: 13px;
    line-height: 1.7;
  }
  .feedback-item {
    padding: 14px 16px;
    margin-bottom: 12px;
  }
  .feedback-item p {
    font-size: 13px;
    line-height: 1.6;
  }
  .action-area {
    margin-top: 16px;
    padding-top: 16px;
  }
  .action-btn {
    height: 44px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 10px 10px 76px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .card {
    padding: 14px;
  }
  .score-number {
    font-size: 24px;
  }
  .essay-text {
    padding: 12px 14px;
    font-size: 13px;
  }
  .feedback-item {
    padding: 12px 14px;
  }
}
</style>
