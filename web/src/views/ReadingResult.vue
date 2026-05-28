<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/reading')"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>
      <h2>答题结果</h2>
    </div>
    <div class="card" v-if="result">
      <div class="result-summary">
        <el-result :icon="result.isCorrect ? 'success' : 'error'" :title="result.isCorrect ? '回答正确！' : '回答错误'">
          <template #extra>
            <div class="summary-detail">
              <p><strong>题目：</strong>{{ result.title || '阅读理解' }}</p>
              <p><strong>你的答案：</strong>{{ result.userAnswer || '--' }}</p>
              <p><strong>正确答案：</strong>{{ result.correctAnswer || result.answer || '--' }}</p>
              <p><strong>用时：</strong>{{ result.duration || '--' }} 秒</p>
            </div>
            <el-button type="primary" @click="$router.push('/reading')">继续练习</el-button>
          </template>
        </el-result>
      </div>
    </div>
    <el-empty v-else description="暂无结果数据" />
    <AdBanner placement="practice-done" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
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
.summary-detail {
  text-align: left;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  line-height: 2;
}
</style>