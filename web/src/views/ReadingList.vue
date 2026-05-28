<template>
  <div class="page-container">
    <div class="page-header"><h2>阅读练习</h2></div>

    <div class="card" v-loading="uploading || loading">
      <el-empty v-if="!loading && !list.length" description="暂无阅读题目">
        <el-button type="primary" @click="triggerUpload">上传PDF题目</el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf"
          style="display: none"
          @change="handleFileChange"
        />
      </el-empty>
      <el-table v-else :data="list" stripe @row-click="goDetail" style="cursor: pointer;">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="题型" width="100">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
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

    <!-- 上传进度条 -->
    <el-dialog v-model="progressVisible" title="上传中" width="400px" :close-on-click-modal="false" :show-close="false">
      <el-progress :percentage="uploadProgress" />
      <template #footer>
        <span style="color: var(--text-secondary); font-size: 13px;">正在上传，请稍候...</span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionAPI } from '@/api'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const uploading = ref(false)
const fileInputRef = ref(null)
const progressVisible = ref(false)
const uploadProgress = ref(0)

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}
const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题' }
const typeLabel = (t) => typeMap[t] || t || '--'
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/reading/${row.id}`)

const triggerUpload = () => {
  fileInputRef.value?.click()
}

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

const fetchList = async () => {
  loading.value = true
  try {
    const res = await questionAPI.getBySubject('reading')
    // getBySubject 调用 /questions?subject=reading，返回 { code, data: { list, total, ... } }
    const data = res.data?.data?.list || res.data?.list || res.data || []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取阅读题目失败:', e)
    list.value = []
    ElMessage.error('获取题目失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>