<template>
  <div>
    <h2 class="admin-page-title">反馈管理</h2>
    <p class="admin-page-desc">查看和回复用户反馈</p>

    <!-- Filter -->
    <div class="card filter-bar">
      <el-radio-group v-model="typeFilter" @change="currentPage = 1">
        <el-radio-button value="bug">Bug 反馈</el-radio-button>
        <el-radio-button value="suggestion">功能建议</el-radio-button>
        <el-radio-button value="praise">好评</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="statusFilter" @change="currentPage = 1">
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="reviewing">处理中</el-radio-button>
        <el-radio-button value="resolved">已解决</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Table -->
    <div class="card">
      <el-table :data="pagedList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="130" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="plain">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleReply(row)">回复</el-button>
            <el-button size="small" text type="success" @click="handleResolve(row)" v-if="row.status !== 'resolved'">解决</el-button>
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

    <!-- Reply Dialog -->
    <el-dialog v-model="replyVisible" title="回复反馈" width="520px">
      <div v-if="currentFeedback" class="reply-preview">
        <div class="reply-row"><span class="reply-label">用户反馈</span>{{ currentFeedback.content }}</div>
        <div class="reply-row" v-if="currentFeedback.adminReply">
          <span class="reply-label">历史回复</span>{{ currentFeedback.adminReply }}
        </div>
      </div>
      <el-input
        v-model="replyText"
        type="textarea"
        :rows="4"
        placeholder="请输入回复内容..."
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="submitting">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const typeFilter = ref('')
const statusFilter = ref('')
const search = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const replyVisible = ref(false)
const replyText = ref('')
const submitting = ref(false)
const currentFeedback = ref(null)
const list = ref([])

const typeLabel = (t) => ({ bug: 'Bug', suggestion: '建议', praise: '好评' }[t] || t)
const typeTagType = (t) => ({ bug: 'danger', suggestion: 'warning', praise: 'success' }[t] || 'info')
const statusLabel = (s) => ({ pending: '待处理', reviewing: '处理中', resolved: '已解决' }[s] || s)
const statusTagType = (s) => ({ pending: 'warning', reviewing: '', resolved: 'success' }[s] || 'info')

const filteredList = computed(() => {
  let data = list.value
  if (typeFilter.value) data = data.filter(f => f.type === typeFilter.value)
  if (statusFilter.value) data = data.filter(f => f.status === statusFilter.value)
  return data
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleReply = (row) => {
  currentFeedback.value = row
  replyText.value = row.adminReply || ''
  replyVisible.value = true
}

const submitReply = async () => {
  if (!replyText.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  submitting.value = true
  setTimeout(() => {
    currentFeedback.value.adminReply = replyText.value
    currentFeedback.value.status = 'resolved'
    submitting.value = false
    replyVisible.value = false
    ElMessage.success('回复已发送')
  }, 400)
}

const handleResolve = (row) => {
  row.status = 'resolved'
  ElMessage.success('已标记为已解决')
}

// 模拟反馈数据
onMounted(() => {
  loading.value = true
  setTimeout(() => {
    const types = ['bug', 'suggestion', 'praise']
    const statuses = ['pending', 'reviewing', 'resolved']
    list.value = Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      type: types[i % 3],
      content: [
        '做题时页面卡住，无法提交答案，请尽快修复！',
        '建议增加口语评分的详细反馈，目前只有总分。',
        '非常好用，帮我提高了 15 分！',
        '模拟考试计时器不准确，显示时间和实际不符。',
        '希望能增加更多 TPO 真题。',
        'AI 陪练的回复速度有点慢，希望能优化。',
      ][i % 6],
      contact: i % 3 === 0 ? '' : `138${String(10000000 + i).slice(0, 8)}`,
      status: i < 5 ? 'pending' : statuses[i % 3],
      adminReply: i % 7 === 0 ? '感谢反馈，问题已修复，请更新到最新版本。' : '',
      createdAt: `2026-05-${String(1 + (i % 28)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:30:00`,
    }))
    loading.value = false
  }, 300)
})
</script>

<style scoped>
.admin-page-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.admin-page-desc { color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; }
.filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.reply-preview { margin-bottom: 16px; }
.reply-row { display: flex; gap: 8px; font-size: 14px; margin-bottom: 8px; }
.reply-label {
  flex-shrink: 0; font-size: 12px; color: var(--text-secondary);
  background: #f5f7fa; padding: 2px 8px; border-radius: 4px;
}
</style>
