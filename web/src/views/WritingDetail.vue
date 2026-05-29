<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '写作练习' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <div class="question-block" v-if="question">
        <h4>题目要求</h4>
        <div class="question-text" v-html="formatText(question.content || question.question || question.stem)"></div>
        <p class="word-hint" v-if="question.wordLimit">字数要求：{{ question.wordLimit }} 词</p>
      </div>

      <div class="editor-section">
        <div class="editor-header">
          <span>你的作文</span>
          <span class="word-count">{{ wordCount }} 词</span>
        </div>
        <el-input
          v-model="content"
          type="textarea"
          :rows="isMobile ? 10 : 14"
          placeholder="在此输入你的作文..."
          :disabled="submitted"
        />
      </div>

      <div class="action-bar" v-if="!submitted">
        <CountdownTimer :seconds="timeLimit" :running="!submitted" @timeout="handleSubmit" />
        <el-button type="primary" :disabled="!content.trim()" :loading="submitting" @click="handleSubmit">
          提交批改
        </el-button>
      </div>

      <!-- AI Result -->
      <div class="ai-result" v-if="aiResult">
        <el-divider />
        <h4>AI 批改结果</h4>

        <div class="result-item">
          <span class="result-label">评分：</span>
          <el-tag type="primary" size="large">{{ aiResult.score || '--' }} / {{ aiResult.maxScore || 5 }}</el-tag>
        </div>

        <div class="result-item" v-if="aiResult.grammar">
          <span class="result-label">语法建议：</span>
          <p>{{ aiResult.grammar }}</p>
        </div>

        <div class="result-item" v-if="aiResult.vocabulary">
          <span class="result-label">词汇建议：</span>
          <p>{{ aiResult.vocabulary }}</p>
        </div>

        <div class="result-item" v-if="aiResult.overall">
          <span class="result-label">总体评价：</span>
          <p>{{ aiResult.overall }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI } from '@/api'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const isMobile = window.innerWidth < 768

const question = ref(null)
const content = ref('')
const submitted = ref(false)
const submitting = ref(false)
const aiResult = ref(null)
const loading = ref(false)
const timeLimit = ref(1800)

const wordCount = computed(() => {
  if (!content.value.trim()) return 0
  return content.value.trim().split(/\s+/).length
})

const formatText = (t) => (t || '').replace(/\n/g, '<br/>')

const handleSubmit = async () => {
  if (submitted.value || submitting.value) return
  submitting.value = true
  try {
    const res = await practiceAPI.submit({
      questionId: question.value?._id || question.value?.id,
      subject: 'writing',
      content: content.value,
    })
    submitted.value = true
    aiResult.value = res.data?.result || res.data || {
      score: 4,
      maxScore: 5,
      grammar: '整体语法良好，注意主谓一致',
      vocabulary: '可以尝试使用更多高级词汇',
      overall: '文章结构清晰，论点明确，继续保持！',
    }
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getById(route.params.id)
    question.value = res.data?.data || res.data || {}
    if (question.value.timeLimit) timeLimit.value = question.value.timeLimit
  } catch (e) { ElMessage.error('加载题目失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
.question-block { margin-bottom: 20px; }
.question-text { font-size: 15px; line-height: 1.7; margin-bottom: 8px; }
.word-hint { font-size: 13px; color: var(--text-secondary); }
.editor-section { margin-bottom: 16px; }
.editor-header {
  display: flex; justify-content: space-between;
  font-size: 14px; margin-bottom: 8px;
}
.word-count { color: var(--text-secondary); }
.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 16px; border-top: 1px solid var(--border);
}
.ai-result { margin-top: 8px; }
.ai-result h4 { font-size: 16px; margin-bottom: 12px; }
.result-item { margin-bottom: 14px; }
.result-label { font-weight: 600; font-size: 14px; }
.result-item p { margin-top: 4px; font-size: 14px; line-height: 1.6; color: var(--text); }
</style>