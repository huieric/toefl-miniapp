<template>
  <div class="question-review">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>待审核题目</span>
          <div class="header-actions">
            <el-radio-group v-model="filterStatus" size="small" @change="fetchQuestions" class="filter-group">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="pending">待审核</el-radio-button>
              <el-radio-button value="approved">已通过</el-radio-button>
              <el-radio-button value="rejected">已驳回</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" :loading="uploading" @click="triggerUpload">上传 PDF</el-button>
            <input ref="fileInputRef" type="file" accept=".pdf" style="display:none" @change="handleFileChange" />
          </div>
        </div>
      </template>

      <el-table :data="questionList" v-loading="loading" border stripe class="review-table">
        <el-table-column prop="id" label="ID" width="55" />
        <el-table-column prop="subject" label="科目" width="60">
          <template #default="{ row }">
            <el-tag :type="subjectTag(row.subject)" size="small">{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="55" align="center" />
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="approve(row.id)">通过</el-button>
              <el-button type="danger" size="small" @click="reject(row.id)">驳回</el-button>
            </template>
            <span v-else style="color: #999">--</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="15"
          layout="total, prev, next"
          @current-change="fetchQuestions"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getQuestions, approveQuestion, rejectQuestion, uploadQuestionsPdf, getUploadStatus } from '../api';

const loading = ref(false);
const questionList = ref([]);
const filterStatus = ref('pending');
const page = ref(1);
const total = ref(0);
const fileInputRef = ref(null);
const uploading = ref(false);

const statusLabel = (s) => ({ pending: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s);
const statusTag = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info');
const subjectTag = (s) => ({ '阅读': '', '听力': 'success', '口语': 'warning', '写作': 'danger' }[s] || '');

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, limit: 15 };
    if (filterStatus.value !== 'all') params.status = filterStatus.value;
    const res = await getQuestions(params);
    const data = res.data?.data || res.data || {};
    questionList.value = data.list || [];
    total.value = data.total || 0;
  } catch (_) {} finally { loading.value = false; }
};

const triggerUpload = () => fileInputRef.value?.click();

const handleFileChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning('请选择 PDF 文件');
    event.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;

  try {
    const res = await uploadQuestionsPdf(formData);
    const uploadId = res.data?.uploadId || res.data?.data?.uploadId || res.uploadId;
    ElMessage.success('上传成功，正在后台解析...');

    if (uploadId) {
      let resolved = false;
      for (let i = 0; i < 20; i += 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const statusRes = await getUploadStatus(uploadId);
        const st = statusRes.data?.data || statusRes.data || statusRes;
        if (st?.status === 'completed') {
          resolved = true;
          await fetchQuestions();
          if (st.meta?.truncated) {
            ElMessage.warning(`解析完成：入库 ${st.parsedCount} 题。本次解析了前 ${st.meta.parsedPages || '-'} 页。`);
          } else {
            ElMessage.success(`解析完成！入库 ${st.parsedCount} 题`);
          }
          break;
        }
        if (st?.status === 'failed') {
          resolved = true;
          ElMessage.error(`解析失败: ${st.error || '未知错误'}`);
          break;
        }
      }
      if (!resolved) ElMessage.warning('解析仍在进行，请稍后刷新列表');
    }
  } catch (err) {
    ElMessage.error(err.message || '上传失败');
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
};

const approve = (id) => {
  ElMessageBox.confirm('确认通过该题目？', '确认', { type: 'success' }).then(async () => {
    try { await approveQuestion(id); ElMessage.success('已通过'); fetchQuestions(); } catch (_) {}
  }).catch(() => {});
};

const reject = (id) => {
  ElMessageBox.confirm('确认驳回该题目？', '确认', { type: 'warning' }).then(async () => {
    try { await rejectQuestion(id); ElMessage.success('已驳回'); fetchQuestions(); } catch (_) {}
  }).catch(() => {});
};

onMounted(() => fetchQuestions());
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.review-table { min-width: 480px; }
@media (max-width: 768px) {
  .card-header { flex-direction: column; align-items: flex-start; }
  .filter-group { width: 100%; overflow-x: auto; }
}
</style>
