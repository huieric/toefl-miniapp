<template>
  <div class="question-review">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>待审核题目</span>
          <el-radio-group v-model="filterStatus" size="small" @change="fetchQuestions" class="filter-group">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="pending">待审核</el-radio-button>
            <el-radio-button value="approved">已通过</el-radio-button>
            <el-radio-button value="rejected">已驳回</el-radio-button>
          </el-radio-group>
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
import { getQuestions, approveQuestion, rejectQuestion } from '../api';

const loading = ref(false);
const questionList = ref([]);
const filterStatus = ref('pending');
const page = ref(1);
const total = ref(0);

const statusLabel = (s) => ({ pending: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s);
const statusTag = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info');
const subjectTag = (s) => ({ '阅读': '', '听力': 'success', '口语': 'warning', '写作': 'danger' }[s] || '');

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const res = await getQuestions({ status: filterStatus.value, page: page.value, limit: 15 });
    const data = res.data?.data || res.data || {};
    questionList.value = data.list || [];
    total.value = data.total || 0;
  } catch (_) {} finally { loading.value = false; }
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
.review-table { min-width: 480px; }
@media (max-width: 768px) {
  .card-header { flex-direction: column; align-items: flex-start; }
  .filter-group { width: 100%; overflow-x: auto; }
}
</style>