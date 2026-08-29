<template>
  <div class="page-container">
    <div class="page-header"><h2>阅读练习</h2><span v-if="summaryText" style="font-size:13px;color:var(--text-secondary)">{{ summaryText }}</span></div>

    <!-- Tab切换 -->
    <div class="source-tabs">
      <el-radio-group v-model="sourceTab" @change="onSourceChange">
        <el-radio-button value="user">真题练习</el-radio-button>
        <el-radio-button value="simulated">模拟练习</el-radio-button>
      </el-radio-group>
      <div class="tab-actions">
        <template v-if="sourceTab === 'user'">
          <el-button type="primary" size="small" @click="uploadVisible = true">上传题目</el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" :loading="generating" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </div>
    </div>

    <div v-loading="loading" :element-loading-text="loadingText">
      <el-empty v-if="!loading && !hasData" :description="emptyDesc">
        <template v-if="sourceTab === 'user'">
          <el-button type="primary" @click="uploadVisible = true">上传题目</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="showGenDialog">生成模拟题</el-button>
        </template>
      </el-empty>

      <!-- 真题：题集两级折叠（题集 → 篇） -->
      <div v-else-if="sourceTab === 'user'" class="sets-list">
        <el-collapse v-model="activeSets">
          <el-collapse-item v-for="s in sets" :key="s.batchId" :name="s.batchId">
            <template #title>
              <div class="set-header">
                <span class="set-name">{{ s.batchName || '未命名题集' }}</span>
                <span class="set-meta">{{ s.passageCount }} 篇 · {{ s.questionCount }} 题</span>
                <span class="set-actions" @click.stop>
                  <el-icon class="set-act" @click="renameBatch(s)"><Edit /></el-icon>
                  <el-icon class="set-act danger" @click="deleteBatch(s)"><Delete /></el-icon>
                </span>
              </div>
            </template>
            <div class="passage-list">
              <div
                v-for="p in s.passages"
                :key="p.passageId"
                class="passage-row"
                @click="goPassage(p.passageId)"
              >
                <span class="passage-row-title">{{ cleanTitle(p.title) }}</span>
                <span class="passage-row-meta">{{ p.questionCount }} 题 · {{ diffLabel(p.difficulty) }}</span>
                <el-icon class="passage-row-del" @click.stop="deletePassage(p)"><Delete /></el-icon>
                <el-icon class="passage-row-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 模拟：平铺篇章卡片 -->
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
              <el-tag :type="p.source === 'user' ? 'success' : 'primary'" size="small" effect="plain">
                {{ p.source === 'user' ? '真题' : '模拟题' }}
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

    <UploadQuestionDialog v-model="uploadVisible" default-subject="reading" @uploaded="pollUpload" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Edit, Delete } from '@element-plus/icons-vue'
import { questionAPI, healthAPI, withRetry } from '@/api'
import UploadQuestionDialog from '@/components/UploadQuestionDialog.vue'
import { useUploadPolling } from '@/composables/useUploadPolling'

const router = useRouter()
const passages = ref([])
const orphans = ref([])
const sets = ref([])
const activeSets = ref([])
const loading = ref(false)
const uploading = ref(false)
const generating = ref(false)
const sourceTab = ref('user')
const fileInputRef = ref(null)
const progressVisible = ref(false)
const uploadProgress = ref(0)
const uploadVisible = ref(false)
const genVisible = ref(false)
const genCount = ref(5)
const genDifficulty = ref('medium')

const loadPhase = ref('')

const emptyDesc = computed(() => sourceTab.value === 'user' ? '暂无阅读真题' : '暂无模拟题')
const totalQuestions = computed(() => passages.value.reduce((s, p) => s + (p.questionCount || 0), 0))
const hasData = computed(() => sourceTab.value === 'user' ? sets.value.length > 0 : (passages.value.length > 0 || orphans.value.length > 0))
const summaryText = computed(() => {
  if (sourceTab.value === 'user') {
    if (!sets.value.length) return ''
    const totalP = sets.value.reduce((s, st) => s + (st.passageCount || 0), 0)
    const totalQ = sets.value.reduce((s, st) => s + (st.questionCount || 0), 0)
    return `共 ${sets.value.length} 个题集 · ${totalP} 篇 · ${totalQ} 题`
  }
  if (!passages.value.length) return ''
  return `共 ${passages.value.length} 篇 · ${totalQuestions.value} 题`
})

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
      let lastParsedPassages = 0
      // 立即刷新一次，先把已解析出的篇章显示出来
      await fetchList()
      ElMessage.info('开始后台解析，已解析出的题目会逐步显示，你可以先继续使用')

      // 分段展示：轮询期间每次都刷新列表，新解析出的篇章会自动出现
      for (let i = 0; i < 240; i++) {
        await new Promise(r => setTimeout(r, 5000))
        try {
          const s = await questionAPI.uploadStatus(uploadId)
          const st = s.data?.data
          if (st?.status === 'completed') {
            resolved = true
            await fetchList()
            if (st.parsedCount > 0) {
              if (st.meta?.truncated) {
                ElMessage.warning(`解析完成：已导入 ${st.parsedCount} 道题（${st.meta.passageCount} 篇）。文件较大仅解析前 ${st.meta.parsedPages || '-'} 页；若 PDF 是扫描图片（无文字层），其余内容无法解析，请用带文字层的 PDF 或拆分上传`)
              } else {
                ElMessage.success(`解析完成！共入库 ${st.parsedCount} 道题`)
              }
            } else if (st.meta?.skippedCount > 0) {
              ElMessage.info('这些题目之前已经导入过了，已刷新列表')
            } else {
              ElMessage.warning('PDF解析完成但未提取到题目：可能是扫描件/图片型 PDF（无文字层），请使用带文字层的 PDF')
            }
            break
          }
          if (st?.status === 'failed') {
            resolved = true
            ElMessage.error(`解析失败: ${st.error || '未知错误'}`)
            break
          }
          // 仍在解析中：刷新列表展示最新已解析的篇章，并提示进度
          if (st?.status === 'processing') {
            await fetchList()
            const parsedP = st.meta?.parsedPassages || 0
            if (parsedP > 0 && parsedP !== lastParsedPassages) {
              lastParsedPassages = parsedP
              ElMessage.info(`已解析 ${parsedP} 篇，剩余题目后台继续解析中，你可以先开始练习`)
            }
          }
        } catch (_) {}
      }
      if (!resolved) {
        await fetchList()
        ElMessage.warning('解析仍在后台进行（大文件较慢），已解析出的内容已显示；可稍后刷新列表查看新增')
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
  sets.value = []

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
    if (sourceTab.value === 'user') {
      // 真题：按题集两级展示
      const res = await withRetry(
        () => questionAPI.listSets({ subject: 'reading' }),
        { retries: 2, retryDelay: 5000 }
      )
      sets.value = res.data?.data?.sets || []
    } else {
      // 模拟：平铺篇章
      const res = await withRetry(
        () => questionAPI.listGrouped({ subject: 'reading', source: 'simulated' }),
        { retries: 2, retryDelay: 5000 }
      )
      const data = res.data?.data
      passages.value = data?.list || []
      orphans.value = data?.orphans || []
    }
  } catch (e) {
    console.error('获取阅读篇章失败:', e)
    passages.value = []
    orphans.value = []
    sets.value = []
    ElMessage.error('加载失败，请刷新页面重试')
  } finally {
    loadPhase.value = ''
    loading.value = false
  }
}

const { pollUpload } = useUploadPolling(fetchList)

const renameBatch = async (s) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的题集名称', '重命名题集', {
      inputValue: s.batchName || '',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    if (value && value.trim()) {
      await questionAPI.renameBatch(s.batchId, value.trim())
      ElMessage.success('已重命名')
      await fetchList()
    }
  } catch (_) { /* 取消 */ }
}

const deleteBatch = async (s) => {
  try {
    await ElMessageBox.confirm(
      `确认删除题集「${s.batchName || '未命名'}」？将删除其中 ${s.questionCount} 道题，不可恢复。`,
      '删除题集', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await questionAPI.deleteBatch(s.batchId)
    ElMessage.success('已删除')
    await fetchList()
  } catch (_) { /* 取消 */ }
}

const deletePassage = async (p) => {
  try {
    await ElMessageBox.confirm(
      `确认删除文章「${cleanTitle(p.title)}」？将删除其中 ${p.questionCount} 道题。`,
      '删除文章', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await questionAPI.deletePassage(p.passageId)
    ElMessage.success('已删除')
    await fetchList()
  } catch (_) { /* 取消 */ }
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

/* 题集两级折叠 */
.sets-list { margin-bottom: 16px; }
.set-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.set-name {
  font-size: 15px;
  font-weight: 650;
  color: var(--text-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.set-meta {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  flex-shrink: 0;
}
.passage-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 8px;
}
.passage-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.passage-row:hover {
  border-color: var(--primary, #4a90d9);
  background: rgba(74,144,217,0.04);
}
.passage-row-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.passage-row-meta {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  flex-shrink: 0;
}
.passage-row-arrow {
  color: var(--text-placeholder, #c0c4cc);
  flex-shrink: 0;
}
.set-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}
.set-act {
  cursor: pointer;
  color: var(--text-secondary, #909399);
  font-size: 15px;
  padding: 4px;
}
.set-act:hover { color: var(--primary, #4a6cf7); }
.set-act.danger:hover { color: var(--danger, #f56c6c); }
.passage-row-del {
  cursor: pointer;
  color: var(--text-placeholder, #c0c4cc);
  flex-shrink: 0;
  font-size: 14px;
}
.passage-row-del:hover { color: var(--danger, #f56c6c); }
</style>
