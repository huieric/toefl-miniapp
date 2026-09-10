<template>
  <div class="page-container wrongbook-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>{{ t('wrongBook.title') }}</h2>
      <p class="subtitle">{{ t('wrongBook.subtitle') }}</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">{{ t('wrongBook.totalWrong') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayReview || 0 }}</div>
        <div class="stat-label">{{ t('wrongBook.todayReview') }}</div>
      </div>
      <div class="stat-card stat-action" @click="showReviewPush = true" v-if="list.length">
        <div class="stat-icon">💡</div>
        <div class="stat-label">{{ t('wrongBook.reviewPush') }}</div>
      </div>
    </div>

    <!-- 📊 错题模式统计图表 -->
    <div class="card chart-section" v-if="chartData.subjectDist.length">
      <h3 class="chart-title">📊 错题分布</h3>
      <div class="chart-grid">
        <div ref="subjectPieRef" class="chart-box"></div>
        <div ref="topicBarRef" class="chart-box"></div>
      </div>
      <!-- TOP5 薄弱知识点 -->
      <div v-if="chartData.weakPoints.length" class="weak-points">
        <h4 class="chart-subtitle">🎯 TOP5 薄弱点</h4>
        <div class="weak-point-bars">
          <div v-for="(wp, i) in chartData.weakPoints" :key="i" class="weak-point-item">
            <span class="wp-rank">{{ i + 1 }}</span>
            <span class="wp-name">{{ wp.label }}</span>
            <div class="wp-bar-bg">
              <div class="wp-bar-fill" :style="{ width: wp.percentage + '%' }"></div>
            </div>
            <span class="wp-pct">{{ wp.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">{{ t('wrongBook.wrongList') }}</span>
        <div class="card-actions">
          <el-button type="success" size="small" @click="showAttribution = true" v-if="list.length" :loading="attributionLoading">
            🧠 {{ t('wrongBook.attribution') }}
          </el-button>
          <el-button type="primary" size="small" @click="$router.push('/wrong-book/redo')" v-if="list.length">
            {{ t('wrongBook.redo') }}
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!list.length" :description="t('wrongBook.noWrong')">
        <el-button type="primary" @click="$router.push('/reading')">{{ t('wrongBook.goPractice') }}</el-button>
      </el-empty>

      <!-- 桌面端表格 -->
      <el-table v-if="list.length && !isMobile" :data="list" stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column :label="t('wrongBook.subject')" width="80">
          <template #default="{ row }">{{ subjectMap[row.subject] }}</template>
        </el-table-column>
        <el-table-column :prop="t('wrongBook.question')" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('wrongBook.wrongCount')" width="80">
          <template #default="{ row }">{{ row.wrongCount || row.count || 1 }}</template>
        </el-table-column>
        <el-table-column :label="t('wrongBook.nextReview')" width="160">
          <template #default="{ row }">
            <span v-if="row.nextReview">{{ formatNextReview(row.nextReview) }}</span>
            <el-tag v-else size="small" type="warning">{{ t('wrongBook.pending') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('wrongBook.mastery')" width="120">
          <template #default="{ row }">
            <el-progress :percentage="getMastery(row)" :stroke-width="6" :color="masteryColor(row)" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片列表 -->
      <div v-if="list.length && isMobile" class="mobile-wrong-list">
        <div v-for="(item, idx) in list" :key="item.wrongId || idx" class="wrong-card">
          <div class="wrong-card-header">
            <el-tag size="small" :type="subjectTag(item.subject)">{{ subjectMap[item.subject] }}</el-tag>
            <span class="wrong-card-wrong">{{ item.wrongCount || item.count || 1 }}</span>
            <el-icon class="wrong-card-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="wrong-card-body" @click="goToQuestion(item)">
            <p class="wrong-card-question">{{ item.question }}</p>
            <p class="wrong-card-analysis">{{ item.analysis || item.title || '' }}</p>
          </div>
          <div class="wrong-card-footer">
            <span v-if="item.nextReview" class="wrong-card-date">{{ formatNextReview(item.nextReview) }}</span>
            <el-tag v-else size="small" type="warning">{{ t('wrongBook.pending') }}</el-tag>
            <div class="wrong-card-mastery">
              <el-progress :percentage="getMastery(item)" :stroke-width="4" :color="masteryColor(item)" :show-text="false" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <AdBanner placement="wrong-book" />
  </div>

  <!-- 归因分析弹窗 -->
  <el-dialog v-model="showAttribution" :title="t('wrongBook.attributionTitle')" :width="dialogWidth('780px')" destroy-on-close>
    <div v-if="attributionData">
      <!-- 总览 -->
      <div class="attr-summary">
        <div class="attr-metric">
          <div class="attr-val">{{ attributionData.summary?.totalWrong || 0 }}</div>
          <div class="attr-label">{{ t('wrongBook.totalWrongCount') }}</div>
        </div>
        <div class="attr-metric">
          <div class="attr-val">{{ attributionData.summary?.avgWrongCount || '0' }}</div>
          <div class="attr-label">{{ t('wrongBook.avgWrongCount') }}</div>
        </div>
        <div class="attr-metric">
          <div class="attr-val" style="color:#F56C6C">{{ attributionData.summary?.highFreqWrongCount || 0 }}</div>
          <div class="attr-label">{{ t('wrongBook.highFreqWrong') }}</div>
        </div>
      </div>

      <!-- 主要原因分布 -->
      <div v-if="attributionData.categories?.length" class="attr-section">
        <h4>🎯 {{ t('wrongBook.mainCauses') }}</h4>
        <div class="attr-reason-list">
          <div v-for="(cat, i) in attributionData.categories" :key="cat.key" class="attr-reason-item">
            <div class="attr-rank">{{ i + 1 }}</div>
            <div class="attr-r-info">
              <div class="attr-r-label">{{ cat.label }} <span class="attr-r-pct">{{ cat.percentage }}%</span></div>
              <div class="attr-r-bar">
                <div class="attr-r-fill" :style="{ width: cat.percentage + '%' }"></div>
              </div>
            </div>
            <span class="attr-r-count">{{ cat.count }} {{ t('common.items') }}</span>
          </div>
        </div>
      </div>

      <!-- 高频错题 -->
      <div v-if="attributionData.highFreqWrong?.length" class="attr-section">
        <h4>⚠️ {{ t('wrongBook.highFreqQuestions') }}</h4>
        <div class="attr-hf-list">
          <div v-for="(q, i) in attributionData.highFreqWrong" :key="i" class="attr-hf-item">
            <el-tag size="small" type="info">{{ subjectMap[q.subject] }}</el-tag>
            <span class="attr-hf-title">{{ q.title || t('wrongBook.question') }}</span>
            <el-tag size="small" type="danger">{{ q.attribution || t('wrongBook.knowledge') }} · {{ t('wrongBook.wrongCount') }}{{ q.wrongCount }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 建议 -->
      <div v-if="attributionData.categories?.length" class="attr-section">
        <h4>💡 {{ t('wrongBook.targetedSuggestions') }}</h4>
        <div class="attr-sug-grid">
          <div v-for="cat in attributionData.categories" :key="cat.key" class="attr-sug-card">
            <div class="attr-sug-title">{{ cat.label }}</div>
            <ul>
              <li v-for="(s, i) in cat.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 明细 -->
      <div class="attr-section">
        <h4>📋 {{ t('wrongBook.questionAttributions') }}</h4>
        <el-table :data="attributionData.perQuestion" stripe max-height="350">
          <el-table-column type="index" label="#" width="40" />
          <el-table-column :label="t('wrongBook.subject')" width="60">
            <template #default="{ row }">{{ subjectMap[row.subject] }}</template>
          </el-table-column>
          <el-table-column :prop="t('wrongBook.question')" label="题目" min-width="200" show-overflow-tooltip />
          <el-table-column :label="t('wrongBook.reason')" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="getAttrTag(row.category)">{{ row.categoryLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :prop="t('wrongBook.reasons')" label="原因" min-width="200" show-overflow-tooltip />
          <el-table-column :prop="t('wrongBook.wrongCount')" :label="t('wrongBook.wrongCount')" width="70" />
        </el-table>
      </div>
    </div>
    <div v-else-if="attributionLoading" style="text-align:center;padding:40px 0">
      <el-icon :size="28" class="icon-spinner"><Loading /></el-icon>
      <p style="color:var(--text-secondary);margin-top:8px">{{ t('wrongBook.generating') }}</p>
    </div>
    <el-empty v-else :description="t('wrongBook.noData')" />
    <template #footer>
      <el-button @click="showAttribution = false">{{ t('common.close') }}</el-button>
      <el-button type="primary" @click="loadAttribution" :loading="attributionLoading">{{ t('wrongBook.refresh') }}</el-button>
    </template>
  </el-dialog>

  <!-- 智能复习推送弹窗 -->
  <el-dialog v-model="showReviewPush" :title="t('wrongBook.pushTitle')" :width="dialogWidth('800px')" destroy-on-close>
    <div v-if="reviewPushData" class="push-container">
      <!-- 总览 -->
      <div class="push-summary" v-if="reviewPushData.topCategories">
        <div class="push-metric">
          <div class="push-val">{{ reviewPushData.totalWrong || 0 }}</div>
          <div class="push-label">{{ t('wrongBook.totalWrongQuestions') }}</div>
        </div>
        <div class="push-metric">
          <div class="push-val">{{ reviewPushData.reviewPlan?.totalItems || 0 }}</div>
          <div class="push-label">{{ t('wrongBook.recommendPractice') }}</div>
        </div>
        <div class="push-metric" v-if="reviewPushData.topCategories[0]">
          <div class="push-val" style="color:#F56C6C">{{ reviewPushData.topCategories[0].label }}</div>
          <div class="push-label">{{ t('wrongBook.weakestArea') }}（{{ reviewPushData.topCategories[0].percentage }}%）</div>
        </div>
      </div>

      <!-- 薄弱类别分布 -->
      <div v-if="reviewPushData.topCategories?.length" class="push-section">
        <h4>🎯 {{ t('wrongBook.weakCategories') }}</h4>
        <div class="push-category-list">
          <div v-for="(cat, i) in reviewPushData.topCategories" :key="cat.key" class="push-cat-item">
            <div class="push-rank">{{ i + 1 }}</div>
            <div class="push-r-info">
              <div class="push-r-label">{{ cat.label }} <span class="push-r-pct">{{ cat.percentage }}%</span></div>
              <div class="push-r-bar">
                <div class="push-r-fill" :style="{ width: cat.percentage + '%', background: categoryColor(cat.key) }"></div>
              </div>
            </div>
            <span class="push-r-count">{{ cat.count }} {{ t('common.items') }}</span>
          </div>
        </div>
      </div>

      <!-- 推荐题目列表 -->
      <div v-if="reviewPushData.reviewPlan?.questions?.length" class="push-section">
        <h4>📝 {{ t('wrongBook.recommendList') }}</h4>
        <div class="push-question-list">
          <div v-for="(q, i) in reviewPushData.reviewPlan.questions" :key="q.questionId" class="push-q-item">
            <div class="push-q-num">{{ i + 1 }}</div>
            <div class="push-q-info">
              <span class="push-q-order">{{ t('reading.questionNumber') }}{{ q.order }}{{ t('reading.questionOf') }}</span>
              <el-button text size="small" type="primary" @click="startPractice(q.questionId)">
                {{ t('wrongBook.startPractice') }}
              </el-button>
              <el-button text size="small" @click="completeReview(q.questionId, i)">
                ✅ {{ t('wrongBook.completed') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类建议 -->
      <div v-if="reviewPushData.reviewItems?.length" class="push-section">
        <h4>💡 {{ t('wrongBook.targetedAdvice') }}</h4>
        <div class="push-suggestion-grid">
          <div v-for="(item, i) in reviewPushData.reviewItems" :key="i" class="push-sug-card">
            <div class="push-sug-title">{{ item.label }}（{{ item.wrongCount }} {{ t('wrongBook.wrongCount') }}）</div>
            <ul>
              <li v-for="(s, j) in item.suggestion" :key="j">{{ s }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- AI 建议 -->
      <div v-if="reviewPushData.aiSuggestions?.length" class="push-section">
        <h4>🤖 {{ t('wrongBook.aiAdvice') }}</h4>
        <div class="push-ai-list">
          <div v-for="(s, i) in reviewPushData.aiSuggestions" :key="i" class="push-ai-item">
            <span class="push-ai-num">{{ i + 1 }}.</span>
            <span>{{ s }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="reviewPushLoading" style="text-align:center;padding:40px 0">
      <el-icon :size="28" class="icon-spinner"><Loading /></el-icon>
      <p style="color:var(--text-secondary);margin-top:8px">{{ t('wrongBook.generating') }}</p>
    </div>
    <el-empty v-else :description="t('wrongBook.noData')" />

    <template #footer>
      <el-button @click="showReviewPush = false">{{ t('common.close') }}</el-button>
      <el-button type="primary" @click="loadReviewPush" :loading="reviewPushLoading">{{ t('wrongBook.refresh') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { wrongAPI, reviewAPI } from '@/api'
import { Loading, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AdBanner from '@/components/AdBanner.vue'
import * as echarts from 'echarts'

const { t } = useI18n()
const router = useRouter()

const subjectMap = { reading: t('nav.reading'), listening: t('nav.listening'), speaking: t('nav.speaking'), writing: t('nav.writing') }

const list = ref([])
const stats = reactive({ total: 0, todayReview: 0 })
const isMobile = ref(false)

// 归因分析
const showAttribution = ref(false)
const attributionLoading = ref(false)
const attributionData = ref(null)

// 智能复习推送
const showReviewPush = ref(false)
const reviewPushLoading = ref(false)
const reviewPushData = ref(null)

// ==================== 📊 ECharts 图表 ====================
const subjectPieRef = ref(null)
const topicBarRef = ref(null)
let pieChart = null
let barChart = null

const subjectColors = { reading: '#2563EB', listening: '#23B26D', speaking: '#FF8A2A', writing: '#7C5CFF' }

const chartData = computed(() => {
  const list = list.value || []
  // 按科目分布
  const dist = []
  const countMap = { reading: 0, listening: 0, speaking: 0, writing: 0 }
  list.forEach(item => {
    const subj = item.subject || 'reading'
    countMap[subj] = (countMap[subj] || 0) + 1
  })
  const labels = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }
  Object.keys(countMap).forEach(k => {
    if (countMap[k] > 0) {
      dist.push({ name: labels[k], value: countMap[k], itemStyle: { color: subjectColors[k] } })
    }
  })
  
  // 按科目统计 wrongCount 作为薄弱点
  const weakPoints = []
  const totalWrongCount = list.reduce((sum, item) => sum + (item.wrongCount || item.count || 1), 0)
  Object.keys(countMap).forEach(k => {
    if (countMap[k] > 0) {
      const wc = list.filter(i => i.subject === k).reduce((s, i) => s + (i.wrongCount || i.count || 1), 0)
      weakPoints.push({
        label: labels[k],
        percentage: Math.round(wc / totalWrongCount * 100),
        count: countMap[k],
        color: subjectColors[k],
      })
    }
  })
  weakPoints.sort((a, b) => b.percentage - a.percentage)
  
  return { subjectDist: dist, weakPoints }
})

function initCharts() {
  nextTick(() => {
    if (subjectPieRef.value && !pieChart) {
      pieChart = echarts.init(subjectPieRef.value)
      updatePieChart()
    }
    if (topicBarRef.value && !barChart) {
      barChart = echarts.init(topicBarRef.value)
      updateBarChart()
    }
  })
}

function updatePieChart() {
  if (!pieChart) return
  const dist = chartData.value.subjectDist
  if (!dist.length) return
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '55%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
      data: dist,
    }],
  })
}

function updateBarChart() {
  if (!barChart) return
  const wp = chartData.value.weakPoints
  if (!wp.length) return
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 80, right: 40, top: 16, bottom: 24 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: {
      type: 'category',
      data: wp.map(w => w.label).reverse(),
      axisLabel: { fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: wp.map(w => w.percentage).reverse(),
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: (params) => {
          const idx = params.dataIndex
          return wp[wp.length - 1 - idx]?.color || '#2563EB'
        },
      },
      label: { show: true, position: 'right', formatter: '{c}%' },
      barWidth: 18,
    }],
  })
}

function destroyCharts() {
  if (pieChart) { pieChart.dispose(); pieChart = null }
  if (barChart) { barChart.dispose(); barChart = null }
}

const getAttrTag = (cat) => {
  const map = { vocabulary: 'warning', grammar: '', logic: 'danger', knowledge: '', carelessness: 'info', time: 'info' }
  return map[cat] || ''
}

async function loadAttribution() {
  attributionLoading.value = true
  try {
    const res = await wrongAPI.attribution()
    attributionData.value = res.data?.data || res.data
  } catch (e) {
    console.error('归因分析加载失败:', e)
    ElMessage.warning(t('common.error'))
  } finally {
    attributionLoading.value = false
  }
}

// ==================== 智能复习推送 ====================
const categoryColor = (cat) => {
  const map = {
    vocabulary: '#E6A23C',
    grammar: '#409EFF',
    logic: '#F56C6C',
    knowledge: '#67C23A',
    carelessness: '#909399',
    time: '#909399',
  }
  return map[cat] || '#409EFF'
}

async function loadReviewPush() {
  reviewPushLoading.value = true
  try {
    const res = await reviewAPI.push({})
    reviewPushData.value = res.data?.data || res.data
  } catch (e) {
    console.error('智能复习推送加载失败:', e)
    ElMessage.warning(t('common.error'))
  } finally {
    reviewPushLoading.value = false
  }
}

function startPractice(questionId) {
  const item = reviewPushData.value?.reviewItems?.flatMap(i => i.recommendations)
    ?.find(r => r.questionId === questionId)
  if (!item) {
    ElMessage.warning(t('common.error'))
    return
  }
  const routeMap = { reading: '/reading', listening: '/listening', speaking: '/speaking', writing: '/writing' }
  const route = routeMap[item.subject] || '/reading'
  router.push({ path: route, query: { qid: questionId } })
}

async function completeReview(questionId, index) {
  try {
    await reviewAPI.complete({ questionId, isCorrect: true })
    ElMessage.success(t('wrongBook.completed'))
    if (reviewPushData.value?.reviewPlan?.questions) {
      reviewPushData.value.reviewPlan.questions.splice(index, 1)
      reviewPushData.value.reviewPlan.totalItems = reviewPushData.value.reviewPlan.questions.length
    }
  } catch (e) {
    console.error('标记复习完成失败:', e)
    ElMessage.error(t('common.error'))
  }
}

// ==================== 移动端卡片 ====================
const subjectTag = (s) => ({ reading: '', listening: 'warning', speaking: 'danger', writing: 'info' }[s] || '')

function goToQuestion(item) {
  const routeMap = { reading: '/reading', listening: '/listening', speaking: '/speaking', writing: '/writing' }
  const route = routeMap[item.subject] || '/reading'
  // 使用题目ID（wrongId 或 id）
  const qid = item.questionId || item.id
  if (qid) {
    router.push({ path: route, query: { qid } })
  }
}

const getMastery = (row) => {
  const ease = row.ease || 2.5
  return Math.min(100, Math.round(ease / 3.5 * 100))
}

const masteryColor = (row) => {
  const p = getMastery(row)
  if (p >= 70) return '#67C23A'
  if (p >= 40) return '#E6A23C'
  return '#F56C6C'
}

const formatNextReview = (d) => {
  if (!d) return '--'
  const now = new Date()
  const next = new Date(d)
  const diff = next - now
  if (diff < 0) return t('home.continue')
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours} ${t('plan.days')}`
  const days = Math.floor(hours / 24)
  return `${days} ${t('plan.days')}`
}

// 弹窗响应式宽度
function dialogWidth(desktop) {
  return isMobile.value ? '95vw' : desktop
}

// 窗口尺寸监听
const onResize = () => {
  isMobile.value = window.innerWidth < 768
  if (pieChart) pieChart.resize()
  if (barChart) barChart.resize()
}
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  destroyCharts()
})

onMounted(async () => {
  try {
    const [listRes, statsRes] = await Promise.all([wrongAPI.list({}), wrongAPI.stats()])
    list.value = listRes.data?.list || listRes.data?.wrongs || listRes.data || []
    const sd = statsRes.data?.data || {}
    stats.total = sd.total || 0
    stats.todayReview = sd.due || 0
  } catch (e) { console.error(e) }
  // 初始化图表
  initCharts()
})
</script>

<style scoped>
/* ===== 页面容器 ===== */
.wrongbook-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px 24px;
}
.page-header h2 {
  font-size: 22px;
  margin: 0 0 4px;
  color: var(--text);
}
.subtitle {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}
.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ===== 统计卡片 ===== */
.stat-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 120px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.stat-action {
  cursor: pointer;
  transition: all 0.15s;
  border-color: var(--primary);
  background: var(--primary-soft);
}
.stat-action:active {
  transform: scale(0.97);
}
.stat-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

/* ===== 移动端卡片列表 ===== */
.mobile-wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wrong-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.wrong-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.wrong-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}
.wrong-card-wrong {
  margin-left: auto;
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}
.wrong-card-arrow {
  color: var(--text-muted);
  margin-left: auto;
}
.wrong-card-body {
  padding: 14px;
  cursor: pointer;
}
.wrong-card-question {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
  line-height: 1.5;
}
.wrong-card-analysis {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wrong-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
}
.wrong-card-mastery {
  flex: 1;
  margin-left: 12px;
  max-width: 100px;
}

/* ===== 归因分析弹窗样式 ===== */
.attr-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.attr-metric {
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 14px;
  background: #F7F8FC;
  border-radius: 10px;
  border: 1px solid var(--border);
}
.attr-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}
.attr-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.attr-section {
  margin-bottom: 20px;
}
.attr-section h4 {
  font-size: 14px;
  margin-bottom: 10px;
  color: var(--text);
}
.attr-reason-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.attr-reason-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F7F8FC;
  border-radius: 8px;
}
.attr-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.attr-r-info {
  flex: 1;
}
.attr-r-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.attr-r-pct {
  color: var(--primary);
  font-weight: 700;
  margin-left: 4px;
}
.attr-r-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.attr-r-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.5s;
}
.attr-r-count {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.attr-hf-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.attr-hf-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F7F8FC;
  border-radius: 8px;
  font-size: 13px;
}
.attr-hf-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attr-sug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}
.attr-sug-card {
  padding: 12px;
  background: #F7F8FC;
  border-radius: 8px;
}
.attr-sug-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 6px;
}
.attr-sug-card ul {
  padding-left: 16px;
  margin: 0;
}
.attr-sug-card li {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 2px;
}

/* ==================== 智能复习推送样式 ==================== */
.push-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}
.push-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.push-metric {
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 14px;
  background: #F7F8FC;
  border-radius: 10px;
  border: 1px solid var(--border);
}
.push-val {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
  word-break: break-all;
}
.push-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.push-section {
  margin-bottom: 20px;
}
.push-section h4 {
  font-size: 14px;
  margin-bottom: 10px;
  color: var(--text);
}
.push-category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.push-cat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F7F8FC;
  border-radius: 8px;
}
.push-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.push-r-info { flex: 1; }
.push-r-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.push-r-pct {
  color: var(--primary);
  font-weight: 700;
  margin-left: 4px;
}
.push-r-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.push-r-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.5s;
}
.push-r-count {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.push-question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.push-q-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F7F8FC;
  border-radius: 8px;
}
.push-q-num {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.push-q-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.push-q-order {
  font-size: 13px;
  color: var(--text);
}
.push-suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}
.push-sug-card {
  padding: 12px;
  background: #F7F8FC;
  border-radius: 8px;
}
.push-sug-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 6px;
}
.push-sug-card ul {
  padding-left: 16px;
  margin: 0;
}
.push-sug-card li {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 2px;
}
.push-ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.push-ai-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #F7F8FC;
  border-radius: 8px;
  font-size: 13px;
}
.push-ai-num {
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .wrongbook-page {
    padding: 12px 14px 80px;
    padding-top: env(safe-area-inset-top, 0);
  }
  .page-header h2 {
    font-size: 18px;
  }
  .subtitle {
    font-size: 12px;
  }

  /* 统计卡片全宽 */
  .stat-cards {
    gap: 8px;
  }
  .stat-card {
    min-width: 80px;
    padding: 12px 8px;
    border-radius: 10px;
  }
  .stat-value {
    font-size: 22px;
  }
  .stat-label {
    font-size: 11px;
  }
  .stat-icon {
    font-size: 24px;
  }
  .stat-action .stat-icon {
    margin-bottom: 0;
  }

  /* 卡片头部响应式 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .card-actions {
    width: 100%;
  }
  .card-actions .el-button {
    flex: 1;
  }

  /* 弹窗移动端样式 */
  :deep(.el-dialog__body) {
    padding: 12px !important;
  }
  :deep(.el-dialog) {
    width: 95vw !important;
    margin: 5vh auto !important;
    max-height: 90vh;
  }
  :deep(.el-dialog__header) {
    padding: 12px 16px;
  }
  :deep(.el-dialog__footer) {
    padding: 10px 16px;
  }

  /* 归因/推送弹窗移动端优化 */
  .attr-summary,
  .push-summary {
    gap: 6px;
  }
  .attr-metric,
  .push-metric {
    padding: 10px 6px;
  }
  .attr-val,
  .push-val {
    font-size: 18px;
  }
  .attr-r-bar,
  .push-r-bar {
    height: 4px;
  }
  .attr-r-fill,
  .push-r-fill {
    height: 100%;
  }
  .attr-sug-grid,
  .push-suggestion-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  /* 弹窗内表格优化 */
  :deep(.el-table) {
    font-size: 12px;
  }
  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  .wrongbook-page {
    padding: 10px 12px 72px;
  }
  .page-header h2 {
    font-size: 16px;
  }
  .stat-card {
    min-width: 70px;
    padding: 10px 6px;
  }
  .stat-value {
    font-size: 18px;
  }
  .stat-label {
    font-size: 10px;
  }
  .attr-r-label,
  .push-r-label {
    font-size: 12px;
  }
  .attr-r-pct,
  .push-r-pct {
    font-size: 11px;
  }

  /* ===== 图表响应式 ===== */
  .chart-grid {
    grid-template-columns: 1fr !important;
  }
  .chart-box {
    height: 220px;
  }
  .weak-point-item {
    grid-template-columns: 20px 50px 1fr 30px;
    gap: 6px;
  }
  .wp-name {
    font-size: 12px;
  }
  .wp-rank {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
}

/* ==================== 错题统计图表 ==================== */
.chart-section {
  margin-bottom: 20px;
  border: 1px solid #E8F0FE;
  background: linear-gradient(135deg, #FAFBFF 0%, #F5F7FF 100%);
}
.chart-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text);
}
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.chart-box {
  width: 100%;
  height: 260px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #E8E8E8;
}
.chart-subtitle {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text);
}
.weak-points {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #E8E8E8;
}
.weak-point-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.weak-point-item {
  display: grid;
  grid-template-columns: 22px 70px 1fr 36px;
  align-items: center;
  gap: 8px;
}
.wp-rank {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #DDA0DD;
}
.weak-point-item:nth-child(1) .wp-rank { background: #F56C6C; }
.weak-point-item:nth-child(2) .wp-rank { background: #FF8A2A; }
.weak-point-item:nth-child(3) .wp-rank { background: #E6A23C; }
.weak-point-item:nth-child(4) .wp-rank { background: #409EFF; }
.weak-point-item:nth-child(5) .wp-rank { background: #67C23A; }
.wp-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
.wp-bar-bg {
  height: 10px;
  background: #F0F0F0;
  border-radius: 5px;
  overflow: hidden;
}
.wp-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease;
}
.weak-point-item:nth-child(1) .wp-bar-fill { background: #F56C6C; }
.weak-point-item:nth-child(2) .wp-bar-fill { background: #FF8A2A; }
.weak-point-item:nth-child(3) .wp-bar-fill { background: #E6A23C; }
.weak-point-item:nth-child(4) .wp-bar-fill { background: #409EFF; }
.weak-point-item:nth-child(5) .wp-bar-fill { background: #67C23A; }
.wp-pct {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: right;
}
</style>
