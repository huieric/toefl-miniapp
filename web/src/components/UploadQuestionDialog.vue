<template>
  <el-dialog
    v-model="visible"
    title="上传题目"
    width="min(92vw, 480px)"
    :close-on-click-modal="false"
  >
    <div class="upload-form">
      <div class="form-row">
        <span class="form-label">科目</span>
        <el-radio-group v-model="subject" size="small">
          <el-radio-button value="reading">阅读</el-radio-button>
          <el-radio-button value="listening">听力</el-radio-button>
          <el-radio-button value="speaking">口语</el-radio-button>
          <el-radio-button value="writing">写作</el-radio-button>
        </el-radio-group>
      </div>

      <div class="form-row">
        <span class="form-label">题目 PDF</span>
        <input ref="pdfInput" type="file" accept=".pdf" style="display:none" @change="onPdfChange" />
        <el-button size="small" @click="pdfInput.click()">选择 PDF</el-button>
        <span v-if="pdfFile" class="file-name">{{ pdfFile.name }}</span>
      </div>

      <div class="form-row" v-if="subject === 'listening'">
        <span class="form-label">音频（可选）</span>
        <input ref="audioInput" type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac" style="display:none" @change="onAudioChange" />
        <el-button size="small" @click="audioInput.click()">选择音频</el-button>
        <span v-if="audioFile" class="file-name">{{ audioFile.name }}</span>
      </div>

      <div v-if="uploading" class="progress-wrap">
        <el-progress :percentage="progress" :stroke-width="8" />
        <div class="progress-text">{{ statusText }}</div>
      </div>

      <!-- 解析中状态（上传完成后显示） -->
      <div v-if="parsing" class="parsing-indicator">
        <el-icon :size="18" class="icon-spinner"><Loading /></el-icon>
        <span>后台解析中，题目将逐步出现在下方列表中。您可以继续浏览已有内容。</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="close" :disabled="uploading">取消</el-button>
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="!pdfFile"
        @click="submit"
      >
        上传并解析
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { questionAPI } from '@/api'

const STORAGE_KEY = 'toefl_active_upload'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultSubject: { type: String, default: 'reading' },
})
const emit = defineEmits(['update:modelValue', 'uploaded'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const subject = ref(props.defaultSubject)
watch(() => props.defaultSubject, (v) => { subject.value = v })

const pdfFile = ref(null)
const audioFile = ref(null)
const pdfInput = ref(null)
const audioInput = ref(null)
const uploading = ref(false)
const parsing = ref(false)
const progress = ref(0)
const statusText = ref('')

const onPdfChange = (e) => {
  pdfFile.value = e.target.files?.[0] || null
}
const onAudioChange = (e) => {
  audioFile.value = e.target.files?.[0] || null
}
const close = () => {
  if (uploading.value) return
  pdfFile.value = null
  audioFile.value = null
  progress.value = 0
  statusText.value = ''
  parsing.value = false
  visible.value = false
}

const submit = async () => {
  if (!pdfFile.value) return
  const formData = new FormData()
  formData.append('file', pdfFile.value)
  formData.append('subject', subject.value)
  if (audioFile.value) formData.append('audio', audioFile.value)

  uploading.value = true
  progress.value = 0
  statusText.value = '上传中...'
  try {
    const res = await questionAPI.upload(formData, (pct) => { progress.value = Math.round(pct) })
    const uploadId = res.data?.data?.uploadId
    // 记录到 sessionStorage，供 UploadProgressCard 轮询
    if (uploadId) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          id: uploadId,
          fileName: pdfFile.value.name,
          status: 'processing',
          parsedPassages: 0,
          totalPassages: 0,
          parsedCount: 0,
          timestamp: Date.now(),
        }))
      } catch { /* 忽略存储错误 */ }
    }
    // 上传成功，关闭弹窗，进入解析状态
    ElMessage.success('上传成功，后台解析中...')
    uploading.value = false
    parsing.value = true
    pdfFile.value = null
    audioFile.value = null
    progress.value = 0
    statusText.value = ''
    visible.value = false
    emit('uploaded', uploadId)
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.upload-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.form-label { width: 76px; font-size: 14px; color: var(--text-secondary); flex-shrink: 0; }
.file-name { font-size: 13px; color: var(--text-secondary); word-break: break-all; }
.progress-wrap { margin-top: 4px; }
.progress-text { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
.parsing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f0f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.icon-spinner {
  color: #4255FF;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
