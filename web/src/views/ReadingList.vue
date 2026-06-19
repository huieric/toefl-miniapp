<template>
  <div class="page-container">
    <div class="page-header"><h2>阅读练习</h2></div>

    <!-- Tab切换 -->
    <div class="source-tabs">
      <el-radio-group v-model="sourceTab" @change="onSourceChange">
        <el-radio-button value="real">真题练习</el-radio-button>
        <el-radio-button value="simulated">模拟练习</el-radio-button>
      </el-radio-group>
      <div class="tab-actions">
        <template v-if="sourceTab === 'real'">
          <input ref="fileInputRef" type="file" accept=".pdf" style="display:none" @change="handleFileChange" />
          <el-button type="primary" size="small" @click="triggerUpload">上传PDF真题</el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" :loading="generating" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </div>
    </div>

    <div v-loading="loading" :element-loading-text="loadingText">
      <el-empty v-if="!loading && !passages.length" :description="emptyDesc">
        <template v-if="sourceTab === 'real'">
          <el-button type="primary" @click="triggerUpload">上传PDF题目</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </el-empty>

      <!-- 篇章卡片列表 -->
      <div v-else class="passage-grid">
        <el-card
          v-for="p in passages"
          :key="p.passageId"
          class="passage-card"
          shadow="hover"
          @click="goPassage(p.passageId)"
        >
          <div class="card-body">
            <h3 class="card-title">{{ cleanTitle(p.title) }}</h3>
            <div class="card-tags">
              <el-tag :type="p.source === 'real' ? 'success' : 'primary'" size="small" effect="plain">
                {{ p.source === 'real' ? '真题' : '模拟题' }}
              </el-tag>
              <el-tag :type="diffTag(p.difficulty)" size="small" effect="plain">
                {{ diffLabel(p.difficulty) }}
              </el-tag>
            </div>
            <div class="card-meta">
              <span class="meta-qcount">共 {{ p.questionCount }} 题</span>
              <span class="meta-types">
                <el-tag
                  v-for="t in typeIcons(p.types)"
                  :key="t.key"
                  size="small"
                  class="type-tag"
                >{{ t.label }}</el-tag>
              </span>
            </div>
            <div class="card-footer">
              <span class="card-date">{{ fmt(p.createdAt) }}</span>
              <el-icon class="card-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

        <!-- 旧数据兼容：未归入篇章的散题 -->
        <template v-if="orphans.length">
          <div class="orphans-divider">
            <el-divider>独立题目（旧数据）</el-divider>
          </div>
          <el-card
            v-for="o in orphans"
            :key="'orphan-' + o.id"
            class="passage-card orphan-card"
            shadow="hover"
          >
            <div class="card-body">
              <h3 class="card-title">{{ o.title }}</h3>
              <div class="card-tags">
                <el-tag type="info" size="small" effect="plain">单题</el-tag>
                <el-tag :type="diffTag(o.difficulty)" size="small" effect="plain">
                  {{ diffLabel(o.difficulty) }}
                </el-tag>
              </div>
              <div class="card-footer">
                <span class="card-date">{{ fmt(o.created_at) }}</span>
              </div>
            </div>
          </el-card>
        </template>
      </div>
    </div>

    <!-- 上传进度 -->
    <el-dialog v-model="progressVisible" title="上传中" width="400px" :close-on-click-modal="false" :show-close="false">
      <el-progress :percentage="uploadProgress" />
      <template #footer><span style="color:var(--text-secondary);font-size:13px">正在上传，请稍候...</span></template>
    </el-dialog>

    <!-- 生成模拟题对话框 -->
    <el-dialog v-model="genVisible" title="生成模拟题" width="420px">
      <el-form label-width="80px">
        <el-form-item label="题目数量">
          <el-slider v-model="genCount" :min="1" :max="10" :step="1" show-stops show-input />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="genDifficulty" style="width:100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="doGenerate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { questionAPI, healthAPI, withRetry } from '@/api'

const router = useRouter()
const passages = ref([])
const orphans = ref([])
const loading = ref(false)
const uploading = ref(false)
const generating = ref(false)
const sourceTab = ref('real')
const fileInputRef = ref(null)
const progressVisible = ref(false)
const uploadProgress = ref(0)
const genVisible = ref(false)
const genCount = ref(5)
const genDifficulty = ref('medium')

const loadPhase = ref('')

const emptyDesc = computed(() => sourceTab.value === 'real' ? '暂无阅读真题' : '暂无模拟题')

const loadingText = computed(() => {
  if (loadPhase.value === 'waking') return '正在连接服务器...'
  if (loadPhase.value === 'loading') return '正在加载篇章...'
  return '加载中...'
})

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}

const typeMap = { detail: '细节题', inference: '推断题', vocabulary: '词汇题', summary: '总结题', purpose: '目的题', reference: '指代题' }
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'

// 去标题中的 "(Q1)" 等编号后缀
const cleanTitle = (t) => (t || '未命名篇章').replace(/\s*\(Q\d+\)\s*$/g, '')

// 提取最多3种题型作为标签
const typeIcons = (types) => {
  if (!Array.isArray(types) || !types.length) return []
  return types.slice(0, 3).map(t => ({ key: t, label: typeMap[t] || t }))
}

const goPassage = (passageId) => router.push(`/reading/passage/${passageId}`)

const onSourceChange = () => fetchList()

const triggerUpload = () => fileInputRef.value?.click()

// ====== PDF 上传 ======
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
    ElMessage.success('上传成功，正在后台解析题目...')
    progressVisible.value = false

    if (uploadId) {
      let resolved = false
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const s = await questionAPI.uploadStatus(uploadId)
          const st = s.data?.data
          if (st?.status === 'completed') {
            resolved = true
            if (st.parsedCount > 0) {
              await fetchList()
              ElMessage.success(`解析完成！共入库 ${st.parsedCount} 道真题`)
            } else {
              ElMessage.warning('PDF解析完成但未提取到题目，请检查PDF格式')
            }
            break
          }
          if (st?.status === 'failed') {
            resolved = true
            ElMessage.error(`解析失败: ${st.error || '未知错误'}`)
            break
          }
        } catch (_) {}
      }
      if (!resolved) {
        await fetchList()
        ElMessage.warning('解析超时，请稍后刷新页面查看')
      }
    } else {
      await new Promise(r => setTimeout(r, 5000))
      await fetchList()
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || '上传失败')
  } finally {
    uploading.value = false
    progressVisible.value = false
    e.target.value = ''
  }
}

const showGenDialog = () => { genVisible.value = true }

const doGenerate = async () => {
  generating.value = true
  try {
    const res = await questionAPI.generate({ subject: 'reading', count: genCount.value, difficulty: genDifficulty.value })
    ElMessage.success(`成功生成 ${res.data?.data?.generated || 0} 道模拟题`)
    genVisible.value = false
    await fetchList()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

// ====== 两阶段加载 ======
const fetchList = async () => {
  loading.value = true
  loadPhase.value = ''
  passages.value = []
  orphans.value = []

  loadPhase.value = 'waking'
  try {
    await healthAPI.check()
  } catch (_) {
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        await healthAPI.check()
        break
      } catch (_) {}
    }
  }

  loadPhase.value = 'loading'
  try {
    const res = await withRetry(
      () => questionAPI.listGrouped({ subject: 'reading', source: sourceTab.value }),
      { retries: 1, retryDelay: 2000 }
    )
    const data = res.data?.data
    passages.value = data?.list || []
    orphans.value = data?.orphans || []
  } catch (e) {
    console.error('获取阅读篇章失败:', e)
    passages.value = []
    orphans.value = []
    ElMessage.error('加载失败，请刷新页面重试')
  } finally {
    loadPhase.value = ''
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.source-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.tab-actions {
  display: flex;
  gap: 8px;
}

.passage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.passage-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--el-border-color-light);
}
.passage-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.orphan-card {
  opacity: 0.7;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-qcount {
  font-size: 13px;
  color: var(--text-secondary, #909399);
}
.meta-types {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.type-tag {
  font-size: 11px;
  opacity: 0.8;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.card-date {
  font-size: 12px;
  color: var(--text-placeholder, #c0c4cc);
}
.card-arrow {
  color: var(--text-placeholder, #c0c4cc);
  font-size: 14px;
}
.orphans-divider {
  grid-column: 1 / -1;
}
</style>
