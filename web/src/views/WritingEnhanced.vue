<template>
  <div class="page-container writing-enhanced-page">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📝 写作评分增强</h2>
      <div class="header-spacer" />
    </div>

    <div class="writing-content">
      <!-- 文章类型选择 -->
      <div class="type-selector">
        <el-radio-group v-model="essayType">
          <el-radio-button value="integrated">综合写作</el-radio-button>
          <el-radio-button value="academic">学术讨论写作</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 写作区域 -->
      <div class="writing-editor">
        <el-input
          v-model="essay"
          type="textarea"
          :rows="12"
          placeholder="在此输入你的作文..."
          :maxlength="5000"
          show-word-limit
        />
        <div class="editor-actions">
          <div class="word-count">
            字数：{{ wordCount }} / 150+
          </div>
          <el-button 
            type="primary" 
            @click="scoreEssay"
            :loading="scoring"
          >
            <el-icon><MagicStick /></el-icon> AI 评分
          </el-button>
        </div>
      </div>

      <!-- 评分结果 -->
      <div class="score-result" v-if="scoreResult">
        <!-- TOEFL 分数展示 -->
        <div class="score-overview">
          <div class="score-circle" :style="{ borderColor: scoreResult.levelColor }">
            <span class="score-value">{{ scoreResult.toeflScore }}</span>
            <span class="score-max">/ 30</span>
          </div>
          <div class="score-level" :style="{ color: scoreResult.levelColor }">
            {{ scoreResult.level }}
          </div>
        </div>

        <!-- 各维度评分 -->
        <div class="criteria-breakdown">
          <h3>📊 评分细则</h3>
          <div class="criteria-item" v-for="criterion in scoreResult.criteria" :key="criterion.name">
            <div class="criterion-header">
              <span class="criterion-name">{{ criterion.name }}</span>
              <span class="criterion-score">{{ criterion.score }} / {{ criterion.maxScore }}</span>
            </div>
            <div class="criterion-bar">
              <div class="criterion-fill" :style="{ width: (criterion.score / criterion.maxScore * 100) + '%' }"></div>
            </div>
            <div class="criterion-desc">{{ criterion.description }}</div>
          </div>
        </div>

        <!-- 文章统计 -->
        <div class="article-stats">
          <div class="stat-item">
            <span class="stat-value">{{ scoreResult.wordCount }}</span>
            <span class="stat-label">单词数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ scoreResult.sentenceCount }}</span>
            <span class="stat-label">句子数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ scoreResult.avgSentenceLength }}</span>
            <span class="stat-label">平均句长</span>
          </div>
        </div>

        <!-- 改进建议 -->
        <div class="improvement-tips">
          <h3>💡 改进建议</h3>
          <div class="tip-item" v-for="(tip, idx) in scoreResult.improvement" :key="idx">
            <el-icon color="#f59e0b"><WarningFilled /></el-icon>
            <span>{{ tip }}</span>
          </div>
        </div>
      </div>

      <!-- 评分历史 -->
      <div class="history-section" v-if="history.length > 0">
        <h3>📋 评分历史</h3>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item">
            <span class="h-type">{{ item.essay_type === 'integrated' ? '综合' : '学术' }}</span>
            <span class="h-score">TOEFL {{ item.ai_score?.toFixed?.(1) || 'N/A' }}</span>
            <span class="h-date">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, WarningFilled } from '@element-plus/icons-vue'
import { writingEnhancedAPI } from '@/api'

const essay = ref('')
const essayType = ref('integrated')
const scoring = ref(false)
const scoreResult = ref(null)
const history = ref([])

const wordCount = computed(() => {
  return essay.value.trim().split(/\s+/).filter(w => w).length
})

onMounted(async () => {
  try {
    const res = await writingEnhancedAPI.getHistory({ page: 1, limit: 5 })
    history.value = res.data?.data?.submissions || []
  } catch {
    // ignore
  }
})

const scoreEssay = async () => {
  if (!essay.value.trim()) {
    ElMessage.warning('请先输入作文内容')
    return
  }
  if (wordCount.value < 50) {
    ElMessage.warning('作文内容太短，请至少输入50个单词')
    return
  }

  scoring.value = true
  try {
    const res = await writingEnhancedAPI.score({
      essay: essay.value,
      essayType: essayType.value,
    })
    scoreResult.value = res.data?.data?.score
    ElMessage.success('评分完成')
    
    // 刷新历史
    try {
      const hRes = await writingEnhancedAPI.getHistory({ page: 1, limit: 5 })
      history.value = hRes.data?.data?.submissions || []
    } catch {}
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '评分失败')
  } finally {
    scoring.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
.writing-enhanced-page {
  max-width: 900px;
  margin: 0 auto;
}

.type-selector {
  margin-bottom: 20px;
}

.writing-editor {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.word-count {
  color: #909399;
  font-size: 14px;
}

.score-result {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.score-overview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 6px solid #4a6cf7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
}

.score-max {
  font-size: 14px;
  color: #909399;
}

.score-level {
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
}

.criteria-breakdown {
  margin-bottom: 24px;
}

.criteria-breakdown h3 {
  margin-bottom: 12px;
  color: #333;
}

.criteria-item {
  margin-bottom: 12px;
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.criterion-name {
  font-weight: 500;
}

.criterion-score {
  color: #4a6cf7;
  font-weight: 600;
}

.criterion-bar {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.criterion-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7, #10b981);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.criterion-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.article-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f7ff;
  border-radius: 8px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #4a6cf7;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.improvement-tips {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 16px;
}

.improvement-tips h3 {
  margin-bottom: 12px;
  color: #92400e;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  color: #92400e;
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.history-section h3 {
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f7ff;
}

.h-type { font-weight: 500; }
.h-score { color: #4a6cf7; font-weight: 600; }
.h-date { color: #909399; font-size: 13px; }
</style>
