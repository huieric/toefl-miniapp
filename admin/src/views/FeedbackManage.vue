<template>
  <div class="feedback-manage">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>意见反馈管理</span>
          <el-select v-model="filterType" size="small" style="width: 110px" @change="fetchFeedback">
            <el-option label="全部" value="all" />
            <el-option label="BUG反馈" value="bug" />
            <el-option label="功能建议" value="suggest" />
            <el-option label="其他" value="other" />
          </el-select>
        </div>
      </template>

      <el-table :data="feedbackList" v-loading="loading" border stripe class="fb-table">
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="75" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reply ? 'success' : 'warning'" size="small">{{ row.reply ? '已回复' : '待回复' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openReply(row)">
              {{ row.reply ? '查看' : '回复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="15"
          layout="total, prev, next"
          @current-change="fetchFeedback"
        />
      </div>
    </el-card>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyDialog" :title="`回复反馈 #${replyForm.id}`" :width="isMobile ? '95%' : '540px'">
      <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px">
        <div style="font-size: 13px; color: #999; margin-bottom: 4px">用户反馈</div>
        <div style="font-size: 14px">{{ replyForm.content }}</div>
      </div>
      <div v-if="replyForm.existingReply" style="margin-bottom: 16px; padding: 12px; background: #e6f7ff; border-radius: 8px">
        <div style="font-size: 13px; color: #999; margin-bottom: 4px">已回复</div>
        <div style="font-size: 14px">{{ replyForm.existingReply }}</div>
      </div>
      <el-input
        v-model="replyForm.reply"
        type="textarea"
        :rows="4"
        placeholder="输入回复内容..."
        :disabled="!!replyForm.existingReply && !replyForm.isEdit"
      />
      <template #footer>
        <el-button @click="replyDialog = false">关闭</el-button>
        <el-button type="primary" @click="submitReply" :disabled="!replyForm.reply && !replyForm.existingReply" :loading="submitting">
          发送回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getFeedbackList, replyFeedback } from '../api';

const loading = ref(false);
const feedbackList = ref([]);
const filterType = ref('all');
const page = ref(1);
const total = ref(0);
const replyDialog = ref(false);
const submitting = ref(false);
const isMobile = computed(() => window.innerWidth < 768);

const replyForm = reactive({ id: null, content: '', reply: '', existingReply: '', isEdit: false });

const typeLabel = (t) => ({ bug: 'BUG反馈', suggest: '功能建议', other: '其他' }[t] || t);
const typeTag = (t) => ({ bug: 'danger', suggest: '', other: 'info' }[t] || 'info');

const fetchFeedback = async () => {
  loading.value = true;
  try {
    const res = await getFeedbackList({ type: filterType.value, page: page.value, limit: 15 });
    const data = res.data?.data || res.data || {};
    feedbackList.value = data.list || [];
    total.value = data.total || 0;
  } catch (_) {} finally { loading.value = false; }
};

const openReply = (row) => {
  Object.assign(replyForm, {
    id: row.id,
    content: row.content,
    reply: '',
    existingReply: row.reply || '',
    isEdit: false,
  });
  replyDialog.value = true;
};

const submitReply = async () => {
  if (!replyForm.reply) return;
  submitting.value = true;
  try {
    await replyFeedback(replyForm.id, { reply: replyForm.reply });
    ElMessage.success('回复成功');
    replyDialog.value = false;
    fetchFeedback();
  } catch (_) {} finally { submitting.value = false; }
};

onMounted(() => fetchFeedback());
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.fb-table { min-width: 380px; }
@media (max-width: 768px) {
  .card-header { flex-direction: column; align-items: flex-start; }
}
</style>