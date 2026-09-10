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
            <span class="vocab-strength" :class="vocabStrengthClass(v.stability)" :title="'记忆强度：' + vocabStrengthPct(v.stability) + '%'">
              {{ '●'.repeat(vocabStrengthDots(v.stability)) }}{{ '○'.repeat(3 - vocabStrengthDots(v.stability)) }}
            </span>
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

// FSRS 记忆强度可视化
function vocabStrengthPct(stability) {
  const s = parseFloat(stability) || 0
  return Math.round(Math.min(s / 30 * 100, 100))
}
function vocabStrengthClass(stability) {
  const s = parseFloat(stability) || 0
  if (s >= 20) return 'strength-high'
  if (s >= 10) return 'strength-mid'
  if (s >= 3) return 'strength-low'
  return 'strength-weak'
}
function vocabStrengthDots(stability) {
  const p = vocabStrengthPct(stability)
  if (p >= 80) return 3
  if (p >= 50) return 2
  if (p >= 20) return 1
  return 0
}

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
.page-container {
  padding: 16px 12px 80px;
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.due-pill {
  color: #d43030;
  font-size: 13px;
  font-weight: 600;
}
.add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.add-row .el-input {
  flex: 1;
  min-width: 120px;
}
.word-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.word-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--card-bg);
  transition: all 0.15s;
}
.word-card.due {
  border-color: #F0544F;
}
.word-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.word {
  font-size: 17px;
  font-weight: 650;
}
.word-meaning {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}
.word-context {
  margin-top: 4px;
  color: var(--text-muted, #999);
  font-size: 12.5px;
  line-height: 1.5;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 10px 12px 76px;
    max-width: 100%;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .add-row {
    gap: 6px;
  }
  .add-row .el-input {
    min-width: 100px;
  }
  .add-row .el-button {
    height: 36px;
    font-size: 13px;
    padding: 0 14px;
  }
  .word-list {
    gap: 8px;
  }
  .word-card {
    padding: 10px 12px;
    border-radius: 8px;
  }
  .word {
    font-size: 15px;
  }
  .word-meaning {
    font-size: 13px;
  }
  .word-context {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .add-row .el-input {
    min-width: 80px;
  }
  .add-row .el-input :deep(.el-input__wrapper) {
    height: 36px;
  }
}

/* ===== 记忆强度指示器 ===== */
.vocab-strength {
  font-size: 14px;
  letter-spacing: 1px;
  line-height: 1;
}
.vocab-strength.strength-high { color: #4CAF50; }
.vocab-strength.strength-mid { color: #FF9800; }
.vocab-strength.strength-low { color: #FF5722; }
.vocab-strength.strength-weak { color: #9E9E9E; }
</style>
