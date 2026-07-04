<template>
  <div>
    <h2 class="admin-page-title">题目审核</h2>
    <p class="admin-page-desc">审核用户上传或系统爬取的托福题目</p>

    <!-- Filter -->
    <div class="card filter-bar">
      <el-radio-group v-model="statusFilter" @change="currentPage = 1">
        <el-radio-button value="pending_review">待审核</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="rejected">已驳回</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="search"
          placeholder="搜索题目内容..."
          clearable
          prefix-icon="Search"
          style="max-width: 280px;"
          @input="currentPage = 1"
        />
        <el-button type="primary" @click="triggerUpload">
          上传/导入题目
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf"
          style="display: none"
          @change="handleFileChange"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <el-table :data="pagedList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="subjectTagType(row.subject)" size="small" effect="plain">{{ subjectLabel(row.subject) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="题目/文章标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="100" align="center">
          <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending_review'">
              <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
              <el-button size="small" type="danger" @click="handleReject(row)">驳回</el-button>
            </template>
            <span v-else style="color: var(--text-secondary); font-size: 12px;">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredList.length"
        layout="prev, pager, next, total"
        style="margin-top: 16px; justify-content: flex-end;"
      />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminAPI, questionAPI } from '@/api'

const statusFilter = ref('pending_review')
const search = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const list = ref([])
const fileInputRef = ref(null)
const uploading = ref(false)
const progressVisible = ref(false)
const uploadProgress = ref(0)

const subjectLabel = (s) => ({ reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }[s] || s)
const subjectTagType = (s) => ({ reading: '', listening: 'success', speaking: 'warning', writing: 'danger' }[s] || 'info')
const sourceLabel = (s) => ({ real: '真题', simulated: '模拟题', user_upload: '用户上传', system_crawled: '系统爬取', official: '官方' }[s] || s)
const statusLabel = (s) => ({ pending: '待审核', pending_review: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s)
const statusTagType = (s) => ({ pending: 'warning', pending_review: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info')

const filteredList = computed(() => {
  let data = list.value
  if (statusFilter.value) data = data.filter(q => q.status === statusFilter.value)
  const kw = search.value.trim().toLowerCase()
  if (kw) data = data.filter(q => (q.title || '').toLowerCase().includes(kw) || (q.questionText || '').toLowerCase().includes(kw))
  return data
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(`确认通过题目「${row.title || 'ID:' + row.id}」？`, '审核通过', { type: 'success' })
  } catch { return }
  try {
    await adminAPI.approveQuestion(row.id)
    ElMessage.success('已通过审核')
    await fetchQuestions()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '审核失败')
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm(`确认驳回题目「${row.title || 'ID:' + row.id}」？`, '审核驳回', { type: 'warning' })
  } catch { return }
  try {
    await adminAPI.rejectQuestion(row.id)
    ElMessage.warning('已驳回')
    await fetchQuestions()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '驳回失败')
  }
}

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
    const res = await questionAPI.upload(formData, (pct) => { uploadProgress.value = pct })
    const uploadId = res.data?.data?.uploadId
    ElMessage.success('上传成功，正在后台解析...')
    progressVisible.value = false

    if (uploadId) {
      let resolved = false
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const statusRes = await questionAPI.uploadStatus(uploadId)
        const st = statusRes.data?.data
        if (st?.status === 'completed') {
          resolved = true
          await fetchQuestions()
          if (st.meta?.truncated) {
            ElMessage.warning(`解析完成：入库 ${st.parsedCount} 题。本次解析了前 ${st.meta.parsedPages || '-'} 页。`)
          } else {
            ElMessage.success(`解析完成！入库 ${st.parsedCount} 题`)
          }
          break
        }
        if (st?.status === 'failed') {
          resolved = true
          ElMessage.error(`解析失败: ${st.error || '未知错误'}`)
          break
        }
      }
      if (!resolved) {
        ElMessage.warning('解析仍在进行，请稍后刷新列表')
      }
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '上传失败')
  } finally {
    uploading.value = false
    progressVisible.value = false
    e.target.value = ''
  }
}

const fetchQuestions = async () => {
  loading.value = true
  try {
    const status = statusFilter.value === 'pending_review' ? 'pending' : statusFilter.value
    const res = await adminAPI.questions({ status: status || undefined, page: 1, limit: 200 })
    const rows = res.data?.data?.list || []
    list.value = rows.map(row => ({
      ...row,
      questionText: row.content,
      createdAt: row.created_at || row.createdAt,
    }))
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '加载题目失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchQuestions)
</script>

<style scoped>
.admin-page-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.admin-page-desc { color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
</style>
