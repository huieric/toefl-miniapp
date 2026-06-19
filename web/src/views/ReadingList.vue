<template>
  <div class="page-container">
    <div class="page-header"><h2>阅读练习</h2></div>

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

    <div class="card" v-loading="uploading || loading" :element-loading-text="loadingText">
      <el-empty v-if="!loading && !list.length" :description="emptyDesc">
        <template v-if="sourceTab === 'real'">
          <el-button type="primary" @click="triggerUpload">上传PDF题目</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </el-empty>
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
      <template #footer><span style="color:var(--text-secondary);font-size:13px">正在上传，请稍候...</span></template>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionAPI, healthAPI, withRetry } from '@/api'

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

// 两阶段加载状态
const loadPhase = ref('') // '' | 'waking' | 'loading'

const emptyDesc = computed(() => sourceTab.value === 'real' ? '暂无阅读真题' : '暂无模拟题')

const loadingText = computed(() => {
  if (loadPhase.value === 'waking') return '正在连接服务器...'
  if (loadPhase.value === 'loading') return '正在加载题目...'
  return '加载中...'
})

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}
const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/reading/${row.id}`)

const onSourceChange = () => fetchList()

const triggerUpload = () => fileInputRef.value?.click()

// ====== PDF 上传 ======
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
    const res = await questionAPI.upload(formData, (pct) => { uploadProgress.value = pct })
    const uploadId = res.data?.data?.uploadId
    ElMessage.success('上传成功，正在后台解析题目...')
    progressVisible.value = false

    if (uploadId) {
      // 轮询真实状态（最多10次，每3s一次）
      let resolved = false
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const s = await questionAPI.uploadStatus(uploadId)
          const st = s.data?.data
          console.log(`[ReadingList] 轮询状态 #${i + 1}:`, st?.status, 'count:', st?.parsedCount)
          if (st?.status === 'completed') {
            resolved = true
            if (st.parsedCount > 0) {
              await fetchList()
              ElMessage.success(`解析完成！共入库 ${st.parsedCount} 道真题`)
            } else {
              ElMessage.warning('PDF解析完成但未提取到题目，请检查PDF格式')
            }
            break
          }
          if (st?.status === 'failed') {
            resolved = true
            ElMessage.error(`解析失败: ${st.error || '未知错误'}`)
            break
          }
          // status === 'processing' → 继续轮询
        } catch (_) {
          // 轮询中的单次网络错误不阻断
        }
      }
      if (!resolved) {
        await fetchList()
        ElMessage.warning('解析超时，请稍后刷新页面查看')
      }
    } else {
      // 没有 uploadId，降级到旧行为
      await new Promise(r => setTimeout(r, 5000))
      await fetchList()
    }
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
    const res = await questionAPI.generate({ subject: 'reading', count: genCount.value, difficulty: genDifficulty.value })
    ElMessage.success(`成功生成 ${res.data?.data?.generated || 0} 道模拟题`)
    genVisible.value = false
    await fetchList()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

// ====== 两阶段加载 ======
const fetchList = async () => {
  loading.value = true
  loadPhase.value = ''
  list.value = []

  // 阶段1：快速健康检查唤醒服务器（8s超时）
  loadPhase.value = 'waking'
  try {
    await healthAPI.check()
    console.log('[ReadingList] 服务器已就绪')
  } catch (_) {
    // 服务器冷启动中，进入自动重试
    console.log('[ReadingList] 服务器未就绪，进入唤醒重试')
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        await healthAPI.check()
        console.log(`[ReadingList] 唤醒成功 (第${i + 1}次重试)`)
        break
      } catch (_) {
        console.log(`[ReadingList] 唤醒重试 ${i + 1}/6`)
      }
    }
  }

  // 阶段2：加载数据
  loadPhase.value = 'loading'
  try {
    const params = { subject: 'reading', source: sourceTab.value }
    const res = await withRetry(() => questionAPI.list(params), { retries: 1, retryDelay: 2000 })
    const data = res.data?.data?.list || res.data?.list || res.data || []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取阅读题目失败:', e)
    list.value = []
    ElMessage.error('加载题目失败，请刷新页面重试')
  } finally {
    loadPhase.value = ''
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.source-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.tab-actions {
  display: flex;
  gap: 8px;
}
</style>