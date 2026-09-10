<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push('/mock-exam')">
          <el-icon><ArrowLeft /></el-icon>
          <span class="back-text">返回</span>
        </el-button>
      </div>
      <h2>考试成绩单</h2>
    </div>

    <div class="card" v-if="result">
      <!-- 总分 -->
      <div class="total-score">
        <div class="score-circle">
          <span class="big-score">{{ result.totalScore || result.score || 0 }}</span>
          <span class="score-unit">总分</span>
        </div>
      </div>

      <!-- 各科分数 -->
      <div class="score-grid">
        <div class="score-item" v-if="result.scores?.reading !== undefined || result.reading">
          <div class="score-subject">阅读</div>
          <div class="score-value">{{ result.scores?.reading || result.reading || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item" v-if="result.scores?.listening !== undefined || result.listening">
          <div class="score-subject">听力</div>
          <div class="score-value">{{ result.scores?.listening || result.listening || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item" v-if="result.scores?.speaking !== undefined || result.speaking">
          <div class="score-subject">口语</div>
          <div class="score-value">{{ result.scores?.speaking || result.speaking || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
        <div class="score-item" v-if="result.scores?.writing !== undefined || result.writing">
          <div class="score-subject">写作</div>
          <div class="score-value">{{ result.scores?.writing || result.writing || 0 }}</div>
          <div class="score-max">/ 30</div>
        </div>
      </div>

      <!-- 详细结果 -->
      <div class="detail-section" v-if="result.details?.length">
        <h4>详细结果</h4>
        <div
          v-for="(d, i) in result.details"
          :key="i"
          class="detail-item"
          :class="{ correct: d.isCorrect, wrong: !d.isCorrect }"
        >
          <span class="detail-text">{{ i + 1 }}. {{ d.question || d.title || '题目' }}</span>
          <el-tag :type="d.isCorrect ? 'success' : 'danger'" size="small" effect="plain">
            {{ d.isCorrect ? '✓ 正确' : '✗ 错误' }}
          </el-tag>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-area">
        <el-button type="primary" class="action-btn" @click="$router.push('/mock-exam')">再来一次</el-button>
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
  padding: 28px;
}

/* 总分圆圈 */
.total-score {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}
.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: var(--grad-primary);
  color: #fff;
  box-shadow: 0 16px 40px rgba(66, 85, 255, 0.28);
}
.big-score {
  font-size: 54px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}
.score-unit {
  font-size: 14px;
  opacity: 0.85;
  margin-top: 6px;
}

/* 各科分数网格 */
.score-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.score-item {
  text-align: center;
  padding: 22px 16px;
  background: #F8F9FC;
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: all 0.18s ease;
}
.score-subject {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 8px;
}
.score-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}
.score-max {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 详细结果 */
.detail-section {
  margin-bottom: 24px;
}
.detail-section h4 {
  font-size: 16px;
  font-weight: 700;
  margin: 4px 0 14px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 12px;
  border-left: 4px solid;
  font-size: 14px;
  color: var(--text);
}
.detail-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-item.correct {
  border-color: var(--success);
  background: var(--success-soft);
}
.detail-item.wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
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
    padding: 20px 16px;
    border-radius: var(--radius-sm);
  }
  
  /* 总分圆圈 */
  .total-score {
    margin-bottom: 20px;
  }
  .score-circle {
    width: 130px;
    height: 130px;
  }
  .big-score {
    font-size: 44px;
  }
  .score-unit {
    font-size: 12px;
  }
  
  /* 各科分数 2x2 网格 */
  .score-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 22px;
  }
  .score-item {
    padding: 16px 12px;
    border-radius: 12px;
  }
  .score-subject {
    font-size: 12px;
  }
  .score-value {
    font-size: 26px;
  }
  .score-max {
    font-size: 11px;
  }
  
  /* 详细结果 */
  .detail-section {
    margin-bottom: 18px;
  }
  .detail-section h4 {
    font-size: 15px;
    margin-bottom: 12px;
  }
  .detail-item {
    padding: 10px 12px;
    margin-bottom: 8px;
    font-size: 13px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .detail-text {
    font-size: 13px;
  }
  .detail-item .el-tag {
    flex-shrink: 0;
    font-size: 11px;
  }
  
  /* 操作按钮 */
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
    padding: 16px 14px;
  }
  .score-circle {
    width: 110px;
    height: 110px;
  }
  .big-score {
    font-size: 36px;
  }
  .score-item {
    padding: 14px 10px;
  }
  .score-value {
    font-size: 22px;
  }
  .detail-item {
    padding: 8px 10px;
  }
}
</style>
