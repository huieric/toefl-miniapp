<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>{{ question?.title || '写作练习' }}</h2>
    </div>

    <div class="card" v-loading="loading">
      <div class="question-block" v-if="question">
        <h4>题目要求</h4>
        <div class="question-text" v-html="formatText(question.content || question.question || question.stem)"></div>
        <p class="word-hint" v-if="question.wordLimit">字数要求：{{ question.wordLimit }} 词</p>
      </div>

      <div class="editor-section">
        <div class="editor-header">
          <div class="editor-title-group">
            <span>你的作文</span>
            <span class="auto-save" v-if="autoSaveStatus">{{ autoSaveStatus }}</span>
          </div>
          <div class="editor-controls">
            <!-- 字数进度条 -->
            <div class="word-progress" v-if="wordLimit">
              <div class="word-progress-bar">
                <div class="word-progress-fill" :style="{ width: wordPct + '%' }" :class="wordPctClass"></div>
              </div>
              <span class="word-count">{{ wordCount }} / {{ wordLimit }} 词</span>
            </div>
            <span class="word-count" v-else>{{ wordCount }} 词</span>
            <el-button text size="small" @click="copyContent" :disabled="!content.trim()">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
            <el-button text size="small" @click="exportContent" :disabled="!content.trim()">
              <el-icon><Download /></el-icon> 导出
            </el-button>
          </div>
        </div>
        <el-input
          v-model="content"
          type="textarea"
          :rows="isMobile ? 10 : 14"
          placeholder="在此输入你的作文..."
          :disabled="submitted"
          @input="onContentInput"
        />
      </div>

      <div class="action-bar" v-if="!submitted">
        <CountdownTimer :seconds="timeLimit" :running="!submitted" @timeout="handleSubmit" />
        <el-button type="warning" :loading="isBrainstorming" @click="callBrainstorm" :disabled="!question">
          💡 AI 构思助手
        </el-button>
        <el-button type="success" :loading="isPolishing" @click="callPolish" :disabled="!content.trim()">
          ✍️ AI 润色
        </el-button>
        <el-button type="primary" :disabled="!content.trim()" :loading="submitting" @click="handleSubmit">
          提交批改
        </el-button>
      </div>

      <!-- Bookmark -->
      <div class="bookmark-section">
        <el-button :type="isBookmarked ? 'warning' : 'info'" @click="toggleBookmark" :icon="Star">
          {{ isBookmarked ? '⭐ 已收藏' : '☆ 收藏题目' }}
        </el-button>
        <span class="bookmark-count">{{ bookmarkCount }} 人已收藏</span>
      </div>

      <!-- AI 构思助手结果 -->
      <div class="brainstorm-result" v-if="showBrainstorm">
        <el-divider />
        <div class="brainstorm-header">
          <h4>💡 AI 构思辅助</h4>
          <el-button text size="small" @click="showBrainstorm = false" v-if="!isBrainstorming">✕ 收起</el-button>
        </div>

        <div v-if="isBrainstorming" class="brainstorm-loading">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span>AI 正在生成构思...</span>
        </div>

        <template v-else-if="brainstormData">
          <!-- 核心论点 -->
          <div class="brainstorm-section">
            <h5>🎯 核心论点</h5>
            <p class="thesis-text">{{ brainstormData.thesis }}</p>
          </div>

          <!-- 推荐结构 -->
          <div class="brainstorm-section">
            <h5>📐 推荐结构</h5>
            <p>{{ brainstormData.structure }}</p>
          </div>

          <!-- 分论点 -->
          <div class="brainstorm-section" v-if="brainstormData.points && brainstormData.points.length">
            <h5>📝 分论点与论据</h5>
            <div class="point-card" v-for="(point, idx) in brainstormData.points" :key="idx">
              <h6>{{ idx + 1 }}. {{ point.title }}</h6>
              <p class="point-explanation">{{ point.explanation }}</p>
              <p class="point-example">💡 例证：{{ point.example }}</p>
              <p v-if="point.transition" class="point-transition">↪ 过渡：{{ point.transition }}</p>
            </div>
          </div>

          <!-- 范文段落 -->
          <div class="brainstorm-section" v-if="brainstormData.sampleIntro || brainstormData.sampleConclusion">
            <h5>📄 范文参考</h5>
            <div v-if="brainstormData.sampleIntro" class="sample-block">
              <strong>引言段：</strong>
              <div class="sample-text">{{ formatFeedback(brainstormData.sampleIntro) }}</div>
            </div>
            <div v-if="brainstormData.sampleConclusion" class="sample-block">
              <strong>结论段：</strong>
              <div class="sample-text">{{ formatFeedback(brainstormData.sampleConclusion) }}</div>
            </div>
          </div>

          <!-- 高级词汇 -->
          <div class="brainstorm-section" v-if="brainstormData.vocabulary && brainstormData.vocabulary.length">
            <h5>📖 推荐词汇</h5>
            <div class="vocab-grid">
              <div class="vocab-item" v-for="(v, idx) in brainstormData.vocabulary" :key="idx">
                <strong>{{ v.word }}</strong> — {{ v.meaning }}
                <small v-if="v.usage">例句：{{ v.usage }}</small>
              </div>
            </div>
          </div>

          <!-- 写作建议 -->
          <div class="brainstorm-section" v-if="brainstormData.tips">
            <h5>💡 写作建议</h5>
            <p>{{ brainstormData.tips }}</p>
          </div>
        </template>
      </div>

      <!-- AI 润色结果 -->
      <div class="polish-result" v-if="showPolish">
        <el-divider />
        <div class="polish-header">
          <h4>✍️ AI 润色结果</h4>
          <div style="display:flex;gap:8px">
            <el-button text size="small" @click="applyPolished" v-if="polishData && polishData.revisedEssay">
              📋 应用润色全文
            </el-button>
            <el-button text size="small" @click="showPolish = false" v-if="!isPolishing">✕ 收起</el-button>
          </div>
        </div>

        <div v-if="isPolishing" class="polish-loading">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span>AI 正在逐句润色...</span>
        </div>

        <template v-else-if="polishData">
          <!-- 总体评分 -->
          <div class="polish-overview">
            <div class="polish-score" :style="{ '--score-pct': polishPct, '--score-color': polishScoreColor }">
              <span class="score-value">{{ polishData.overallScore || '--' }}</span>
              <span class="score-max">/30</span>
            </div>
            <div class="polish-summary">{{ polishData.summary }}</div>
          </div>

          <!-- 评分详情 -->
          <div class="polish-dimensions" v-if="polishData.estimatedTOEFLScore">
            <div class="dim-bar" v-for="(val, key) in polishData.estimatedTOEFLScore" :key="key">
              <span class="dim-label">{{ dimLabel(key) }}</span>
              <div class="dim-track">
                <div class="dim-fill" :style="{ width: (val / 30 * 100) + '%' }"></div>
              </div>
              <span class="dim-val">{{ val }}</span>
            </div>
          </div>

          <!-- 优点/弱点 -->
          <div class="polish-attributes" v-if="polishData.strengths.length || polishData.weaknesses.length">
            <div class="attribute-col" v-if="polishData.strengths.length">
              <h5>✅ 优点</h5>
              <ul><li v-for="(s, i) in polishData.strengths" :key="'s'+i">{{ s }}</li></ul>
            </div>
            <div class="attribute-col" v-if="polishData.weaknesses.length">
              <h5>⚠️ 待改进</h5>
              <ul><li v-for="(w, i) in polishData.weaknesses" :key="'w'+i">{{ w }}</li></ul>
            </div>
          </div>

          <!-- 润色建议列表 -->
          <div class="polish-section" v-if="polishData.polishedSentences.length">
            <h5>✏️ 逐句润色建议</h5>
            <div class="sentence-card" v-for="(ps, idx) in polishData.polishedSentences" :key="idx">
              <div class="sentence-original">
                <span class="tag" :class="'tag-' + ps.level">{{ levelLabel(ps.level) }}</span>
                <span class="tag tag-type">{{ typeLabel(ps.type) }}</span>
                <p class="text">{{ ps.original }}</p>
              </div>
              <div class="sentence-arrow">↓</div>
              <div class="sentence-polished">
                <p class="text">{{ ps.polished }}</p>
              </div>
              <div class="sentence-explanation">{{ ps.explanation }}</div>
            </div>
          </div>

          <!-- 词汇升级 -->
          <div class="polish-section" v-if="polishData.vocabularyUpgrade.length">
            <h5>📖 词汇升级建议</h5>
            <div class="vocab-upgrade-item" v-for="(vu, idx) in polishData.vocabularyUpgrade" :key="idx">
              <span class="vu-from">{{ vu.original }}</span> <span class="vu-arrow">→</span>
              <span class="vu-to">{{ vu.suggested }}</span>
              <small v-if="vu.context" class="vu-context">（{{ vu.context }}）</small>
            </div>
          </div>

          <!-- 结构建议 -->
          <div class="polish-section" v-if="polishData.structureTips">
            <h5>📐 结构优化建议</h5>
            <p>{{ polishData.structureTips }}</p>
          </div>
        </template>
      </div>

      <!-- AI Result - 精批模式 -->
      <div class="ai-result" v-if="aiResult">
        <el-divider />
        <h4>📋 AI 批改结果</h4>

        <!-- 总分 + 四维度评分 -->
        <div class="score-breakdown">
          <!-- 总分 -->
          <div class="total-score">
            <div class="score-ring" :style="{ '--score-pct': scorePct, '--score-color': scoreColor }">
              <span class="score-value">{{ aiResult.score || '--' }}</span>
              <span class="score-max">/{{ aiResult.maxScore || 30 }}</span>
            </div>
            <div class="score-label">{{ scoreLabel }}</div>
          </div>

          <!-- 四维度评分条 -->
          <div class="dimensions">
            <div class="dimension-item" v-for="(val, key) in aiResult.detail" :key="key">
              <div class="dimension-header">
                <span class="dimension-name">{{ dimensionName(key) }}</span>
                <span class="dimension-value">{{ val }}/{{ aiResult.maxScore || 30 }}</span>
              </div>
              <div class="dimension-bar">
                <div class="dimension-fill" :style="{ width: dimPct(val) + '%', background: dimColor(val, aiResult.maxScore || 30) }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 亮点 -->
        <div class="feedback-section" v-if="aiResult.highlights && aiResult.highlights.length">
          <h4>✨ 亮点</h4>
          <ul class="highlight-list">
            <li v-for="(h, i) in aiResult.highlights" :key="i">{{ h }}</li>
          </ul>
        </div>

        <!-- 改进建议 -->
        <div class="feedback-section" v-if="aiResult.suggestions && aiResult.suggestions.length">
          <h4>💡 改进建议</h4>
          <ul class="suggestion-list">
            <li v-for="(s, i) in aiResult.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>

        <!-- 逐句点评 -->
        <div class="feedback-section" v-if="aiResult.lineFeedback && aiResult.lineFeedback.length">
          <h4>📖 逐句点评</h4>
          <div class="line-feedback-list">
            <div class="line-feedback-item" v-for="(lf, i) in aiResult.lineFeedback" :key="i"
              :class="'level-' + lf.level">
              <div class="line-original">
                <span class="line-level-badge" :class="lf.level">{{ levelLabel(lf.level) }}</span>
                <span class="line-text">{{ lf.original }}</span>
              </div>
              <div class="line-suggestion" v-if="lf.suggestion">
                <span class="suggest-label">修改：</span>
                <span class="suggest-text">{{ lf.suggestion }}</span>
              </div>
              <div class="line-explanation" v-if="lf.explanation">
                <span class="explain-label">说明：</span>
                <span>{{ lf.explanation }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 总体反馈 -->
        <div class="feedback-section" v-if="aiResult.feedback">
          <h4>📝 详细反馈</h4>
          <div class="feedback-text" v-html="formatFeedback(aiResult.feedback)"></div>
        </div>

        <!-- 兼容旧字段 -->
        <div class="feedback-section" v-if="aiResult.grammar && !aiResult.feedback">
          <h4>🔧 语法建议</h4>
          <p>{{ aiResult.grammar }}</p>
        </div>
        <div class="feedback-section" v-if="aiResult.vocabulary && !aiResult.feedback">
          <h4>📖 词汇建议</h4>
          <p>{{ aiResult.vocabulary }}</p>
        </div>
        <div class="feedback-section" v-if="aiResult.overall && !aiResult.feedback">
          <h4>💡 总体评价</h4>
          <p>{{ aiResult.overall }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, DocumentCopy, Download, Loading, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { questionAPI, practiceAPI, bookmarkAPI } from '@/api'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const isMobile = ref(window.innerWidth < 768)

let _resizeHandler = null
if (typeof window !== 'undefined') {
  _resizeHandler = () => { isMobile.value = window.innerWidth < 768 }
  window.addEventListener('resize', _resizeHandler)
}

const STORAGE_KEY = 'toefl_writing_draft'

const question = ref(null)
const content = ref('')
const submitted = ref(false)
const submitting = ref(false)
const aiResult = ref(null)
const loading = ref(false)
const timeLimit = ref(1800)
const wordLimit = computed(() => parseInt(question.value?.wordLimit) || 0)
const autoSaveStatus = ref('')

// 收藏
const isBookmarked = ref(false)
const bookmarkCount = ref(8)
const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value
  bookmarkCount.value += isBookmarked.value ? 1 : -1
  ElMessage.success(isBookmarked.value ? '收藏成功' : '已取消收藏')
}

// AI 构思助手
const brainstormData = ref(null)
const showBrainstorm = ref(false)
const isBrainstorming = ref(false)
const isPolishing = ref(false)
const showPolish = ref(false)
const polishData = ref(null)

const wordCount = computed(() => {
  if (!content.value.trim()) return 0
  return content.value.trim().split(/\s+/).length
})

const wordPct = computed(() => {
  if (!wordLimit.value) return 0
  return Math.min(Math.round((wordCount.value / wordLimit.value) * 100), 100)
})

const wordPctClass = computed(() => {
  if (!wordLimit.value) return ''
  const pct = wordPct.value
  if (pct >= 100) return 'word-complete'
  if (pct >= 70) return 'word-ok'
  return 'word-warning'
})

const formatText = (t) => (t || '').replace(/\n/g, '<br/>')

function formatFeedback(text) {
  return (text || '').replace(/\n/g, '<br/>')
}

// 维度中文名称
function dimensionName(key) {
  const map = {
    development: '内容发展',
    organization: '文章组织',
    languageUse: '语言运用',
    mechanics: '技术规范',
    delivery: '表达流利',
    topicDevelopment: '话题展开',
  }
  return map[key] || key
}

// 逐句点评级别标签
function levelLabel(level) {
  const map = {
    good: '✨ 好',
    acceptable: '📝 可接受',
    'needs-improvement': '🔧 需改进',
  }
  return map[level] || level
}

// 分数百分比
function dimPct(val, max = 30) {
  return Math.round((val / max) * 100)
}

// 分数颜色
function dimColor(val, max = 30) {
  const pct = val / max
  if (pct >= 0.8) return '#23B26D'
  if (pct >= 0.6) return '#FF8A2A'
  return '#F0544F'
}

const scorePct = computed(() => {
  if (!aiResult.value) return 0
  const max = aiResult.value.maxScore || 30
  return Math.round((aiResult.value.score || 0) / max * 100)
})

const scoreColor = computed(() => {
  const pct = scorePct.value
  if (pct >= 80) return '#23B26D'
  if (pct >= 60) return '#FF8A2A'
  return '#F0544F'
})

const scoreLabel = computed(() => {
  const pct = scorePct.value
  if (pct >= 90) return '优秀 Excellent'
  if (pct >= 75) return '良好 Good'
  if (pct >= 60) return '及格 Fair'
  return '需改进 Needs Improvement'
})

// ==================== AI 构思助手 ====================
function callBrainstorm() {
  if (!question.value) return
  isBrainstorming.value = true
  showBrainstorm.value = true
  brainstormData.value = null

  practiceAPI.brainstorm({
    question: question.value.content || question.value.question || question.value.title,
    type: question.value.type || 'independent',
  }).then(res => {
    if (res.data && res.data.code === 200) {
      brainstormData.value = res.data.data
      ElMessage.success('构思生成成功！')
    } else {
      ElMessage.error(res.data?.message || '构思生成失败')
      brainstormData.value = null
    }
  }).catch(err => {
    console.error('[WritingDetail] AI构思失败:', err)
    ElMessage.error('构思生成失败: ' + (err.message || '未知错误'))
    brainstormData.value = null
  }).finally(() => {
    isBrainstorming.value = false
  })
}

// ==================== AI 写作润色 ====================
function callPolish() {
  if (!content.value.trim()) return
  isPolishing.value = true
  showPolish.value = true
  polishData.value = null

  practiceAPI.polish({
    question: question.value?.content || question.value?.question || question.value?.title || '',
    essay: content.value,
    type: question.value?.type || 'independent',
  }).then(res => {
    if (res.data && res.data.code === 200) {
      polishData.value = res.data.data
      ElMessage.success('润色完成！')
    } else {
      ElMessage.error(res.data?.message || '润色失败')
      polishData.value = null
    }
  }).catch(err => {
    console.error('[WritingDetail] AI润色失败:', err)
    ElMessage.error('润色失败: ' + (err.message || '未知错误'))
    polishData.value = null
  }).finally(() => {
    isPolishing.value = false
  })
}

function applyPolished() {
  if (!polishData.value?.revisedEssay) return
  content.value = polishData.value.revisedEssay
  ElMessage.success('已应用润色全文')
}

// 润色维度中文
function dimLabel(key) {
  const map = {
    total: '总分',
    development: '内容发展',
    organization: '文章组织',
    languageUse: '语言运用',
    mechanics: '技术规范',
  }
  return map[key] || key
}

function typeLabel(type) {
  const map = {
    grammar: '🔧 语法',
    vocabulary: '📖 词汇',
    structure: '📐 结构',
    style: '✏️ 风格',
  }
  return map[type] || type
}

// 润色评分百分比 + 颜色
const polishPct = computed(() => {
  if (!polishData.value) return 0
  return Math.round(((polishData.value.overallScore || 0) / 30) * 100)
})

const polishScoreColor = computed(() => {
  const pct = polishPct.value
  if (pct >= 80) return '#23B26D'
  if (pct >= 60) return '#FF8A2A'
  return '#F0544F'
})

// 自动保存（防抖 2s）
let _saveTimer = null
function onContentInput() {
  autoSaveStatus.value = '保存中...'
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        content: content.value,
        questionId: question.value?._id || question.value?.id,
        savedAt: Date.now(),
      }))
      autoSaveStatus.value = '已保存'
      setTimeout(() => { autoSaveStatus.value = '' }, 2000)
    } catch { /* 忽略存储错误 */ }
  }, 2000)
}

// 恢复草稿
function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    const qId = question.value?._id || question.value?.id
    if (draft.questionId === qId && (Date.now() - draft.savedAt) < 24 * 3600 * 1000) {
      content.value = draft.content
      autoSaveStatus.value = '已恢复上次草稿'
      setTimeout(() => { autoSaveStatus.value = '' }, 3000)
    }
  } catch { /* 忽略解析错误 */ }
}

// 复制内容
async function copyContent() {
  try {
    await navigator.clipboard.writeText(content.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = content.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制到剪贴板')
  }
}

// 导出为文本文件
function exportContent() {
  if (!content.value.trim()) return
  const title = question.value?.title || '写作练习'
  const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}_writing.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出')
}

const handleSubmit = async () => {
  if (submitted.value || submitting.value) return
  submitting.value = true
  try {
    const res = await practiceAPI.submit({
      questionId: question.value?._id || question.value?.id,
      subject: 'writing',
      content: content.value,
      aiProvider: localStorage.getItem('ai_provider') || undefined,
      aiApiKey: localStorage.getItem('ai_api_key') || undefined,
      aiBaseURL: localStorage.getItem('ai_base_url') || undefined,
      aiModel: localStorage.getItem('ai_model') || undefined,
    })
    submitted.value = true
    aiResult.value = res.data?.result || res.data || {
      score: 4,
      maxScore: 5,
      grammar: '整体语法良好，注意主谓一致',
      vocabulary: '可以尝试使用更多高级词汇',
      overall: '文章结构清晰，论点明确，继续保持！',
    }
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getById(route.params.id)
    question.value = res.data?.data || res.data || {}
    if (question.value.timeLimit) timeLimit.value = question.value.timeLimit
    restoreDraft()
  } catch (e) { ElMessage.error('加载题目失败') }
  finally { loading.value = false }
})

onBeforeUnmount(() => {
  clearTimeout(_saveTimer)
  if (_resizeHandler) window.removeEventListener('resize', _resizeHandler)
})
</script>

<style scoped>
.question-block { margin-bottom: 20px; }
.question-text { font-size: 15px; line-height: 1.7; margin-bottom: 8px; }
.word-hint { font-size: 13px; color: var(--text-secondary); }
.editor-section { margin-bottom: 16px; }
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}
.editor-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.auto-save {
  font-size: 12px;
  color: var(--success);
  opacity: 0.8;
}
.editor-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.word-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 120px;
}
.word-progress-bar {
  flex: 1;
  height: 6px;
  background: #EBEEF5;
  border-radius: 3px;
  overflow: hidden;
}
.word-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s, background 0.3s;
}
.word-progress-fill.word-warning { background: #FF8A2A; }
.word-progress-fill.word-ok { background: #23B26D; }
.word-progress-fill.word-complete { background: #4255FF; }
.word-count { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.action-bar .CountdownTimer { flex: 1; min-width: 0; }

/* ===== AI 批改结果 ===== */
.ai-result {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}
.ai-result h4 {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text);
}

/* 总分 + 四维度 */
.score-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}
.total-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 140px;
}
.score-ring {
  --score-pct: 0;
  --score-color: #4255FF;
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: conic-gradient(var(--score-color) calc(var(--score-pct) * 1%), #EBEEF5 0);
  display: flex;
  align-items: center;
  justify-content: center;
}
.score-ring::before {
  content: '';
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--card-bg);
  position: absolute;
}
.score-value {
  position: relative;
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  z-index: 1;
}
.score-max {
  position: relative;
  font-size: 14px;
  color: var(--text-secondary);
  z-index: 1;
  margin-top: -4px;
}
.score-label {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 四维度评分条 */
.dimensions {
  flex: 1;
  min-width: 200px;
}
.dimension-item {
  margin-bottom: 12px;
}
.dimension-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}
.dimension-name {
  font-weight: 600;
  color: var(--text);
}
.dimension-value {
  color: var(--text-secondary);
  font-weight: 600;
}
.dimension-bar {
  height: 8px;
  background: #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}
.dimension-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 反馈区域 */
.feedback-section {
  margin-bottom: 20px;
}
.feedback-section h4 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--text);
}
.feedback-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
}
.feedback-section p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin: 0;
}

/* 亮点列表 */
.highlight-list, .suggestion-list {
  margin: 0;
  padding-left: 20px;
}
.highlight-list li {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin-bottom: 6px;
  padding-left: 4px;
}
.highlight-list li::marker {
  color: #23B26D;
  font-weight: 700;
}
.suggestion-list li {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin-bottom: 6px;
  padding-left: 4px;
}
.suggestion-list li::marker {
  color: #FF8A2A;
  font-weight: 700;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 76px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 12px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .question-text {
    font-size: 14px;
    line-height: 1.6;
  }
  .word-hint {
    font-size: 12px;
  }
  .editor-section {
    margin-bottom: 14px;
  }
  .editor-header {
    font-size: 13px;
    margin-bottom: 6px;
  }
  .editor-header .el-textarea__inner {
    font-size: 14px;
    line-height: 1.6;
    min-height: 180px;
  }
  .action-bar {
    flex-direction: column;
    gap: 10px;
    padding-top: 14px;
  }
  .action-bar .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
  }
  .action-bar .CountdownTimer {
    width: 100%;
  }

  /* AI 批改结果 移动端 */
  .ai-result h4 {
    font-size: 15px;
  }
  .score-breakdown {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .score-ring {
    width: 100px;
    height: 100px;
  }
  .score-ring::before {
    width: 80px;
    height: 80px;
  }
  .score-value {
    font-size: 28px;
  }
  .score-max {
    font-size: 12px;
  }
  .dimensions {
    width: 100%;
  }
  .dimension-item {
    margin-bottom: 10px;
  }
  .feedback-section p {
    font-size: 13px;
    line-height: 1.5;
  }

  /* 逐句点评 移动端 */
  .line-feedback-item {
    padding: 10px;
  }
  .line-original {
    font-size: 13px;
  }
}

/* 逐句点评样式 */
.line-feedback-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.line-feedback-item {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  background: #fafafa;
}
.line-feedback-item.level-good {
  border-left-color: #23B26D;
  background: #f0fff5;
}
.line-feedback-item.level-acceptable {
  border-left-color: #FF8A2A;
  background: #fff8f0;
}
.line-feedback-item.level-needs-improvement {
  border-left-color: #F0544F;
  background: #fff0f0;
}
.line-original {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}
.line-level-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 600;
}
.line-feedback-item.level-good .line-level-badge {
  background: #23B26D;
  color: white;
}
.line-feedback-item.level-acceptable .line-level-badge {
  background: #FF8A2A;
  color: white;
}
.line-feedback-item.level-needs-improvement .line-level-badge {
  background: #F0544F;
  color: white;
}
.line-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  flex: 1;
}
.line-suggestion {
  margin-top: 4px;
  font-size: 13px;
  color: #666;
}
.suggest-label {
  color: #FF8A2A;
  font-weight: 600;
  margin-right: 4px;
}
.suggest-text {
  color: #333;
}
.line-explanation {
  margin-top: 4px;
  font-size: 13px;
  color: #888;
}
.explain-label {
  color: #666;
  font-weight: 600;
  margin-right: 4px;
}

/* ==================== AI 构思助手样式 ==================== */
.brainstorm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brainstorm-header h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
}
.brainstorm-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 30px 0;
  color: #666;
}
.brainstorm-section {
  margin-bottom: 16px;
}
.brainstorm-section h5 {
  font-size: 15px;
  color: #333;
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}
.thesis-text {
  font-size: 15px;
  font-weight: 500;
  color: #1a73e8;
  padding: 10px 12px;
  background: #e8f0fe;
  border-radius: 6px;
  line-height: 1.6;
}
.point-card {
  padding: 12px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #1a73e8;
}
.point-card h6 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #333;
}
.point-explanation {
  font-size: 13px;
  color: #555;
  margin: 0 0 6px 0;
  line-height: 1.5;
}
.point-example {
  font-size: 13px;
  color: #555;
  margin: 0 0 4px 0;
  line-height: 1.5;
}
.point-transition {
  font-size: 12px;
  color: #888;
  margin: 0;
}
.sample-block {
  margin-bottom: 10px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}
.sample-block strong {
  display: block;
  margin-bottom: 4px;
  color: #333;
}
.sample-text {
  padding: 8px 12px;
  background: #fffde7;
  border-radius: 4px;
  border: 1px solid #fff9c4;
}
.vocab-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vocab-item {
  font-size: 13px;
  padding: 8px 10px;
  background: #f0f9ff;
  border-radius: 4px;
  line-height: 1.5;
}
.vocab-item strong {
  color: #1a73e8;
}
.vocab-item small {
  display: block;
  margin-top: 2px;
  color: #888;
  font-size: 12px;
}

/* ==================== AI 润色样式 ==================== */
.polish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.polish-header h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
}
.polish-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 30px 0;
  color: #666;
}
.polish-overview {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}
.polish-score {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(var(--score-color) calc(var(--score-pct) * 1%), transparent 0);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.polish-score::before {
  content: '';
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #f8f9fa;
  position: absolute;
}
.polish-score .score-value,
.polish-score .score-max {
  position: relative;
  z-index: 1;
}
.polish-score .score-value {
  font-size: 20px;
  font-weight: 700;
}
.polish-score .score-max {
  font-size: 12px;
  color: #888;
  margin-left: 2px;
}
.polish-summary {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  flex: 1;
}
.polish-dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.dim-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-label {
  font-size: 12px;
  color: #666;
  width: 64px;
  flex-shrink: 0;
}
.dim-track {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}
.dim-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #1a73e8, #23B26D);
  transition: width 0.3s;
}
.dim-val {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  width: 24px;
  text-align: right;
}
.polish-attributes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.attribute-col h5 {
  font-size: 14px;
  margin: 0 0 8px 0;
}
.attribute-col ul {
  margin: 0;
  padding-left: 16px;
  color: #555;
  font-size: 13px;
  line-height: 1.6;
}
.attribute-col li {
  margin-bottom: 4px;
}
.polish-section {
  margin-bottom: 16px;
}
.polish-section h5 {
  font-size: 15px;
  color: #333;
  margin: 0 0 10px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}
.sentence-card {
  padding: 12px;
  margin-bottom: 10px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.sentence-original {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}
.sentence-original .tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 2px;
}
.tag-essential { background: #ffebee; color: #d32f2f; }
.tag-recommended { background: #fff3e0; color: #ef6c00; }
.tag-optional { background: #e8f5e9; color: #2e7d32; }
.tag-type { background: #e3f2fd; color: #1565c0; }
.sentence-original .text,
.sentence-polished .text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}
.sentence-original .text {
  color: #888;
  text-decoration: line-through;
}
.sentence-arrow {
  text-align: center;
  color: #1a73e8;
  font-size: 16px;
  margin: 4px 0;
}
.sentence-polished .text {
  color: #2e7d32;
  font-weight: 500;
}
.sentence-explanation {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e0e0e0;
}
.vocab-upgrade-item {
  padding: 6px 10px;
  margin-bottom: 6px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 13px;
}
.vu-from {
  color: #888;
  text-decoration: line-through;
}
.vu-arrow {
  color: #1a73e8;
  margin: 0 6px;
}
.vu-to {
  color: #23B26D;
  font-weight: 600;
}
.vu-context {
  color: #888;
  font-size: 11px;
}
.bookmark-section {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.bookmark-count {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
