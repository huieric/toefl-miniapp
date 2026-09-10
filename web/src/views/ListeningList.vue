<template>
  <div class="page-container">
    <div class="page-header"><h2>听力练习</h2></div>

    <!-- Tab切换 -->
    <div class="source-tabs">
      <el-radio-group v-model="sourceTab" @change="onSourceChange">
        <el-radio-button value="user">真题练习</el-radio-button>
        <el-radio-button value="simulated">模拟练习</el-radio-button>
      </el-radio-group>
      <div class="tab-actions">
        <template v-if="sourceTab === 'user'">
          <el-button type="primary" size="small" @click="uploadVisible = true">上传题目</el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" :loading="generating" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </div>
    </div>

    <div class="card" v-loading="uploading || loading">
      <el-empty v-if="!loading && !list.length" :description="emptyDesc" />

      <!-- 移动端卡片列表 -->
      <div v-else class="listening-card-list">
        <div v-for="(item, idx) in list" :key="item.id || item._id || idx" class="listening-card" @click="goDetail(item)">
          <div class="listening-card-header">
            <el-tag size="small" :type="item.source === 'user' ? 'success' : 'primary'" effect="plain">
              {{ item.source === 'user' ? '真题' : '模拟' }}
            </el-tag>
            <el-tag v-if="item.type" size="small" effect="plain">{{ typeLabel(item.type) }}</el-tag>
            <el-tag v-if="item.difficulty" size="small" :type="diffTag(item.difficulty)">{{ diffLabel(item.difficulty) }}</el-tag>
            <el-icon v-if="item.audioUrl" :size="16" class="audio-badge"><Microphone /></el-icon>
            <el-icon v-else-if="item.passageText" :size="16" class="tts-badge" title="提供 TTS 朗读"><ChatDotRound /></el-icon>
          </div>
          <p class="listening-card-title">{{ item.title || '--' }}</p>
          <div class="listening-card-meta">
            <span>添加于 {{ fmt(item.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 桌面端 el-table -->
      <div class="table-wrapper">
        <el-table v-if="list.length" :data="list" stripe @row-click="goDetail" style="cursor:pointer">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="题型" width="100">
            <template #default="{ row }">{{ typeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column label="来源" width="90">
            <template #default="{ row }">
              <el-tag :type="row.source === 'user' ? 'success' : 'primary'" size="small" effect="plain">
                {{ row.source === 'user' ? '真题' : '模拟题' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="difficulty" label="难度" width="80">
            <template #default="{ row }">
              <el-tag :type="diffTag(row.difficulty)" size="small">{{ diffLabel(row.difficulty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="添加时间" width="160">
            <template #default="{ row }">{{ fmt(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 上传进度卡片 -->
    <UploadProgressCard />

    <!-- 生成模拟题对话框 -->
    <el-dialog v-model="genVisible" title="生成模拟题" width="420px">
      <el-form label-width="80px">
        <el-form-item label="题目数量">
          <el-slider v-model="genCount" :min="1" :max="10" :step="1" show-stops show-input />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="genDifficulty" style="width:100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="doGenerate">生成</el-button>
      </template>
    </el-dialog>

    <UploadQuestionDialog v-model="uploadVisible" default-subject="listening" @uploaded="pollUpload" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Microphone, ChatDotRound } from '@element-plus/icons-vue'
import { questionAPI, withRetry } from '@/api'
import UploadQuestionDialog from '@/components/UploadQuestionDialog.vue'
import UploadProgressCard from '@/components/UploadProgressCard.vue'
import { useUploadPolling } from '@/composables/useUploadPolling'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const uploading = ref(false)
const generating = ref(false)
const sourceTab = ref('simulated')
const uploadVisible = ref(false)
const genVisible = ref(false)
const genCount = ref(5)
const genDifficulty = ref('medium')

let _safetyTimer = null
const SAFETY_TIMEOUT = 35000
function clearSafety() { if (_safetyTimer) { clearTimeout(_safetyTimer); _safetyTimer = null } }
function setSafetyTimeout() {
  clearSafety()
  _safetyTimer = setTimeout(() => {
    if (loading.value) { loading.value = false; ElMessage.warning('请求耗时较长，请刷新页面重试') }
  }, SAFETY_TIMEOUT)
}

const emptyDesc = computed(() => sourceTab.value === 'user' ? '暂无听力真题' : '暂无模拟题')

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}
const typeMap = { lecture: '讲座', conversation: '对话', detail: '细节题', inference: '推断题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/listening/${row.id}`)

const onSourceChange = () => fetchList()

const showGenDialog = () => { genVisible.value = true }

const doGenerate = async () => {
  generating.value = true
  try {
    const res = await questionAPI.generate({ subject: 'listening', count: genCount.value, difficulty: genDifficulty.value })
    ElMessage.success(`成功生成 ${res.data?.data?.generated || 0} 道模拟题`)
    genVisible.value = false
    await fetchList()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

const fetchList = async () => {
  loading.value = true
  setSafetyTimeout()
  try {
    const params = { subject: 'listening' }
    const res = await withRetry(() => questionAPI.list(params), { retries: 2, retryDelay: 2000 })
    const data = res.data?.data?.list || res.data?.list || res.data || []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取听力题目失败:', e)
    list.value = []
    ElMessage.error(e._userMessage || e.response?.data?.message || '获取题目失败')
  } finally {
    clearSafety()
    loading.value = false
  }
}

const { pollUpload } = useUploadPolling(fetchList)

onMounted(fetchList)
onUnmounted(clearSafety)
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h2 { margin: 0 0 4px; font-size: 24px; font-weight: 800; }

.source-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.tab-actions { display: flex; gap: 8px; }

/* 移动端卡片列表 */
.listening-card-list {
  display: none;
  flex-direction: column;
  gap: 10px;
}
.listening-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  box-shadow: var(--shadow-xs);
  transition: all 0.15s;
}
.listening-card:active {
  transform: scale(0.98);
}
.listening-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.listening-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
  line-height: 1.5;
}
.listening-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

/* 桌面端表格 */
.table-wrapper { display: block; }

/* 音频 / TTS 徽标 */
.audio-badge {
  color: #23B26D;
  flex-shrink: 0;
}
.tts-badge {
  color: #4255FF;
  flex-shrink: 0;
  cursor: help;
}

@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 20px;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .source-tabs {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 14px;
  }
  .source-tabs .source-tabs-group {
    display: flex;
  }
  .source-tabs .source-tabs-group :deep(.el-radio-button) {
    flex: 1;
  }
  .source-tabs .tab-actions {
    justify-content: center;
  }
  .source-tabs .tab-actions .el-button {
    flex: 1;
    height: 40px;
  }
  .card {
    padding: 14px;
  }
  .card .el-empty {
    padding: 40px 0;
  }
  /* 隐藏桌面端表格 */
  .table-wrapper {
    display: none !important;
  }
  /* 显示移动端卡片列表 */
  .listening-card-list {
    display: flex;
  }
}

@media (min-width: 769px) {
  .listening-card-list {
    display: none;
  }
}
.card :deep(.el-table) { width: 100%; overflow-x: auto; }
@media (max-width: 600px) {
  .source-tabs { flex-direction: column; align-items: stretch; }
  .tab-actions { justify-content: center; }
}
</style>