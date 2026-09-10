<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>意见反馈</h2>
    </div>

    <div class="card">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="反馈类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%;">
            <el-option label="功能建议" value="suggestion" />
            <el-option label="Bug 反馈" value="bug" />
            <el-option label="题目纠错" value="correction" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请详细描述你的建议或问题..." />
        </el-form-item>
        <el-form-item label="联系方式（选填）">
          <el-input v-model="form.contact" placeholder="邮箱或微信号，方便我们回复" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit" style="width: 100%;">
            提交反馈
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { feedbackAPI } from '@/api'

const form = reactive({ type: '', content: '', contact: '' })
const formRef = ref(null)
const submitting = ref(false)

const rules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入描述', trigger: 'blur' }, { min: 10, message: '至少 10 个字', trigger: 'blur' }],
}

const submit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await feedbackAPI.submit(form)
    ElMessage.success('感谢你的反馈！')
    form.type = ''
    form.content = ''
    form.contact = ''
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px 16px 48px;
  max-width: 600px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.page-header h2 {
  font-size: 22px;
  font-weight: 700;
}
.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  padding: 20px;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 76px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .card {
    padding: 16px;
    border-radius: var(--radius-sm);
  }
  .card :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  .card :deep(.el-form-item__label) {
    font-size: 14px;
    margin-bottom: 6px;
  }
  .card :deep(.el-textarea__inner) {
    font-size: 14px;
    line-height: 1.6;
  }
}

@media (max-width: 480px) {
  .card :deep(.el-textarea__inner) {
    font-size: 13px;
    min-height: 140px;
  }
}
</style>