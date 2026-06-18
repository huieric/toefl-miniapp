<template>
  <div class="page-container">
    <div class="page-header"><h2>听力练习</h2></div>

    <!-- Tab切换 -->
    <div class="source-tabs">
      <el-radio-group v-model="sourceTab" @change="onSourceChange">
        <el-radio-button value="real">真题练习</el-radio-button>
        <el-radio-button value="simulated">模拟练习</el-radio-button>
      </el-radio-group>
      <div class="tab-actions">
        <template v-if="sourceTab === 'real'">
          <input ref="fileInputRef" type="file" accept=".pdf" style="display:none" @change="handleFileChange" />
          <el-button type="primary" size="small" @click="triggerUpload">上传PDF真题</el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" :loading="generating" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </div>
    </div>

    <div class="card" v-loading="uploading || loading">
      <el-empty v-if="!loading && !list.length" :description="emptyDesc" />
      <el-table v-else :data="list" stripe @row-click="goDetail" style="cursor:pointer">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="题型" width="100">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag :type="row.source === 'real' ? 'success' : 'primary'" size="small" effect="plain">
              {{ row.source === 'real' ? '真题' : '模拟题' }}
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

    <!-- 上传进度 -->
    <el-dialog v-model="progressVisible" title="上传中" width="400px" :close-on-click-modal="false" :show-close="false">
      <el-progress :percentage="uploadProgress" />
    </el-dialog>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionAPI, withRetry } from '@/api'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const uploading = ref(false)
const generating = ref(false)
const sourceTab = ref('real')
const fileInputRef = ref(null)
const progressVisible = ref(false)
const uploadProgress = ref(0)
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

const emptyDesc = computed(() => sourceTab.value === 'real' ? '暂无听力真题' : '暂无模拟题')

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
const triggerUpload = () => fileInputRef.value?.click()

const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning('请选择 PDF 文件')
    e.target.value = ''
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  uploading.value = true
  progressVisible.value = true
  uploadProgress.value = 0
  try {
    await questionAPI.upload(formData, (pct) => { uploadProgress.value = pct })
    ElMessage.success('上传成功，正在后台解析题目')
    await new Promise(r => setTimeout(r, 2000))
    await fetchList()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '上传失败')
  } finally {
    uploading.value = false
    progressVisible.value = false
    e.target.value = ''
  }
}

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
    const params = { subject: 'listening', source: sourceTab.value }
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

onMounted(fetchList)
onUnmounted(clearSafety)
</script>

<style scoped>
.source-tabs { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:12px }
.tab-actions { display:flex; gap:8px }
</style>