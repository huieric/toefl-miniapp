<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>AI 设置</h2>
    </div>

    <div class="card">
      <p class="intro">
        口语/写作的 AI 评分需要调用大模型接口。你可以填入**自己的** API Key，key 只保存在<b>本机浏览器</b>，评分时直接发给所选 AI 服务，不会上传到我们的服务器。
      </p>

      <el-form label-width="90px" style="max-width: 480px">
        <el-form-item label="服务商">
          <el-select v-model="provider" style="width: 100%">
            <el-option label="DeepSeek（便宜，推荐）" value="deepseek" />
            <el-option label="OpenAI" value="openai" />
            <el-option label="自定义（OpenAI 兼容）" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="API Key">
          <el-input v-model="apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>

        <el-form-item label="接口地址" v-if="provider === 'custom'">
          <el-input v-model="baseURL" placeholder="https://api.example.com/v1" />
        </el-form-item>

        <el-form-item label="模型" v-if="provider === 'custom'">
          <el-input v-model="model" placeholder="如 gpt-4o-mini / deepseek-chat" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="test">测试连接</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="saved"
        type="success"
        :closable="false"
        show-icon
        title="已保存。现在去口语/写作练习提交答案即可获得 AI 评分。"
        style="margin-top: 8px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiAPI } from '@/api'

const provider = ref('deepseek')
const apiKey = ref('')
const baseURL = ref('')
const model = ref('')
const saved = ref(false)

const load = () => {
  provider.value = localStorage.getItem('ai_provider') || 'deepseek'
  apiKey.value = localStorage.getItem('ai_api_key') || ''
  baseURL.value = localStorage.getItem('ai_base_url') || ''
  model.value = localStorage.getItem('ai_model') || ''
}

const save = () => {
  if (!apiKey.value.trim()) {
    ElMessage.warning('请填写 API Key')
    return
  }
  localStorage.setItem('ai_provider', provider.value)
  localStorage.setItem('ai_api_key', apiKey.value.trim())
  localStorage.setItem('ai_base_url', baseURL.value.trim())
  localStorage.setItem('ai_model', model.value.trim())
  saved.value = true
  ElMessage.success('已保存')
}

const test = async () => {
  if (!apiKey.value.trim()) { ElMessage.warning('先填 API Key'); return }
  save()
  try {
    await aiAPI.grade({
      subject: 'writing',
      text: 'This is a test sentence for connection check.',
      apiKey: apiKey.value.trim(),
      provider: provider.value,
      baseURL: baseURL.value.trim(),
      model: model.value.trim(),
    })
    ElMessage.success('连接成功，AI 服务可用')
  } catch (e) {
    ElMessage.error('连接失败: ' + (e.response?.data?.message || e.message))
  }
}

onMounted(load)
</script>

<style scoped>
.intro { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 20px; }
</style>
