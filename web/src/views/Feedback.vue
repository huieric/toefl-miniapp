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