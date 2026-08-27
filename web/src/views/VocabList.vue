<template>
  <div class="page-container">
    <div class="page-header">
      <h2>生词本</h2>
      <div class="header-actions">
        <span v-if="dueCount > 0 && !loading" class="due-pill">待复习 {{ dueCount }}</span>
        <el-button type="primary" size="small" :disabled="dueCount === 0" @click="$router.push('/vocab/review')">开始复习</el-button>
      </div>
    </div>

    <div class="add-row">
      <el-input v-model="newWord" placeholder="生词" size="small" style="max-width: 150px" @keyup.enter="addWord" />
      <el-input v-model="newMeaning" placeholder="释义（可选）" size="small" @keyup.enter="addWord" />
      <el-button type="primary" size="small" @click="addWord">加入</el-button>
    </div>

    <div v-loading="loading">
      <el-empty v-if="!loading && !list.length" description="还没有生词。在阅读/听力做题时点击生词即可加入" />
      <div v-else class="word-list">
        <div v-for="v in list" :key="v.id" class="word-card" :class="{ due: v.isDue }">
          <div class="word-head">
            <span class="word">{{ v.word }}</span>
            <el-tag v-if="v.isDue" type="danger" size="small" effect="plain">待复习</el-tag>
            <el-tag v-else size="small" type="info" effect="plain">{{ subjectLabel(v.subject) }}</el-tag>
          </div>
          <div v-if="v.meaning" class="word-meaning">{{ v.meaning }}</div>
          <div v-if="v.context" class="word-context">{{ v.context }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { vocabAPI } from '@/api'

const loading = ref(false)
const list = ref([])
const dueCount = ref(0)
const newWord = ref('')
const newMeaning = ref('')

const subjectLabel = (s) => ({ reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }[s] || s || '阅读')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await vocabAPI.list()
    list.value = res.data?.data?.list || []
    dueCount.value = res.data?.data?.dueCount || 0
  } catch (e) {
    list.value = []
    ElMessage.error(e?._userMessage || '加载生词失败')
  } finally {
    loading.value = false
  }
}

const addWord = async () => {
  const w = newWord.value.trim()
  if (!w) return
  try {
    await vocabAPI.add({ word: w, meaning: newMeaning.value.trim() })
    ElMessage.success('已加入生词本')
    newWord.value = ''
    newMeaning.value = ''
    await fetchList()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加入失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page-container { padding: 16px; max-width: 760px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.page-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.due-pill { color: #d43030; font-size: 13px; font-weight: 600; }
.add-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.add-row .el-input { flex: 1; min-width: 120px; }
.word-list { display: flex; flex-direction: column; gap: 10px; }
.word-card { border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; background: var(--card-bg); }
.word-card.due { border-color: #f56c6c; }
.word-head { display: flex; align-items: center; gap: 8px; }
.word { font-size: 17px; font-weight: 650; }
.word-meaning { margin-top: 6px; color: var(--text-secondary); font-size: 14px; }
.word-context { margin-top: 4px; color: var(--text-muted, #999); font-size: 12.5px; line-height: 1.5; }
</style>
