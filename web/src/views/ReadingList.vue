<template>
  <div class="page-container">
    <div class="page-header"><h2>阅读练习</h2></div>

    <!-- 模拟数据提示 -->
    <el-alert
      v-if="usingMock"
      title="当前显示模拟数据，实际数据需连接后端服务"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <div class="card" v-loading="uploading">
      <el-empty v-if="!loading && !list.length" description="暂无阅读题目">
        <el-button type="primary" @click="triggerUpload">上传/导入题目</el-button>
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
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="diffTag(row.difficulty)" size="small">{{ row.difficulty || '中等' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="添加时间" width="160">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
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
const usingMock = ref(false)
const fileInputRef = ref(null)
const progressVisible = ref(false)
const uploadProgress = ref(0)

const mockData = [
  {
    id: 'mock_1',
    _id: 'mock_1',
    title: 'TPO 1 - The Origins of Theater',
    difficulty: '中等',
    createdAt: '2026-05-01T00:00:00Z'
  },
  {
    id: 'mock_2',
    _id: 'mock_2',
    title: 'TPO 2 - Desert Formation',
    difficulty: '困难',
    createdAt: '2026-05-02T00:00:00Z'
  },
  {
    id: 'mock_3',
    _id: 'mock_3',
    title: 'TPO 3 - Architecture',
    difficulty: '中等',
    createdAt: '2026-05-03T00:00:00Z'
  },
  {
    id: 'mock_4',
    _id: 'mock_4',
    title: 'TPO 4 - Petroleum Resources',
    difficulty: '简单',
    createdAt: '2026-05-04T00:00:00Z'
  },
  {
    id: 'mock_5',
    _id: 'mock_5',
    title: 'TPO 5 - Minerals and Plants',
    difficulty: '困难',
    createdAt: '2026-05-05T00:00:00Z'
  }
]

const diffTag = (d) => {
  if (d === '简单') return 'success'
  if (d === '困难') return 'danger'
  return 'warning'
}
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/reading/${row._id || row.id}`)

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
    ElMessage.success('上传成功，题目已导入')
    // 刷新列表
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
    const data = res.data?.list || res.data?.questions || res.data || []
    if (data.length) {
      list.value = data
      usingMock.value = false
    } else {
      list.value = mockData
      usingMock.value = true
    }
  } catch (e) {
    console.error('API 调用失败，使用模拟数据:', e)
    list.value = mockData
    usingMock.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>