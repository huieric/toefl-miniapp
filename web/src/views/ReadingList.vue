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

    <!-- 上传进度卡片（替代旧的弹窗） -->
    <UploadProgressCard />

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
import UploadProgressCard from '@/components/UploadProgressCard.vue'
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
  margin-bottom: 20px;
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
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.passage-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-soft-2);
}
.orphan-card {
  opacity: 0.72;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.45;
  letter-spacing: -0.01em;
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
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.meta-qcount {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.meta-types {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.type-tag {
  font-size: 11px;
  opacity: 0.85;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}
.card-date {
  font-size: 12px;
  color: var(--text-muted);
}
.card-arrow {
  color: var(--primary);
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
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.set-meta {
  font-size: 12px;
  color: var(--text-secondary);
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
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.passage-row:hover {
  border-color: var(--primary-soft-2);
  background: var(--primary-soft);
}
.passage-row-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.passage-row-meta {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.passage-row-arrow {
  color: var(--text-muted);
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
  color: var(--text-secondary);
  font-size: 15px;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
}
.set-act:hover { color: var(--primary); background: var(--primary-soft); }
.set-act.danger:hover { color: var(--danger); background: var(--danger-soft); }
.passage-row-del {
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.15s;
}
.passage-row-del:hover { color: var(--danger); background: var(--danger-soft); }

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .page-container { padding: 0 12px 20px; }
  .page-header { margin-bottom: 12px; }
  .page-header h2 { font-size: 20px; }
  .source-tabs {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 14px;
  }
  .source-tabs-group {
    display: flex;
  }
  .source-tabs-group :deep(.el-radio-button) {
    flex: 1;
  }
  .tab-actions { justify-content: center; }
  .tab-actions .el-button {
    flex: 1;
    height: 40px;
  }
  .card { padding: 14px; }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .card-header .el-button {
    width: 100%;
    height: 40px;
    font-size: 14px;
  }
  .set-card {
    padding: 14px 12px;
  }
  .set-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .set-card-actions {
    margin-left: 0 !important;
  }
  .passage-grid {
    grid-template-columns: 1fr !important;
  }
  .passage-row {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }
  .passage-row-info { flex: 1; }
  .passage-row-arrow { display: none; }
  .card :deep(.el-table) { width: 100%; overflow-x: auto; }
}

@media (max-width: 600px) {
  .source-tabs { flex-direction: column; align-items: stretch; }
  .tab-actions { justify-content: center; }
}
</style>
