<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/profile')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>练习历史</h2>
    </div>

    <div class="card">
      <div class="filter-bar">
        <el-select v-model="filterSubject" placeholder="全部科目" clearable style="width: 100%;">
          <el-option label="阅读" value="reading" />
          <el-option label="听力" value="listening" />
          <el-option label="口语" value="speaking" />
          <el-option label="写作" value="writing" />
        </el-select>
      </div>

      <el-empty v-if="!filteredList.length" description="暂无练习记录" />

      <!-- 桌面端表格 -->
      <el-table v-if="!isMobile && filteredList.length" :data="filteredList" stripe>
        <el-table-column label="科目" width="80">
          <template #default="{ row }">{{ subjectMap[row.subject] }}</template>
        </el-table-column>
        <el-table-column prop="title" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isCorrect ? 'success' : 'danger'" size="small">
              {{ row.isCorrect ? '正确' : '错误' }}
            </el-tag>
            <span v-if="row.score !== undefined">{{ row.score }}分</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="用时" width="80">
          <template #default="{ row }">{{ row.duration || '--' }}s</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片列表 -->
      <div v-if="isMobile && filteredList.length" class="history-card-list">
        <div
          v-for="(r, i) in filteredList"
          :key="i"
          class="history-item"
        >
          <div class="history-top">
            <el-tag size="small">{{ subjectMap[r.subject] }}</el-tag>
            <el-tag :type="r.isCorrect ? 'success' : 'danger'" size="small" effect="plain">
              {{ r.isCorrect ? '正确' : '错误' }}
            </el-tag>
          </div>
          <p class="history-title">{{ r.title }}</p>
          <div class="history-bottom">
            <span class="history-time">{{ fmt(r.createdAt) }}</span>
            <span class="history-score" v-if="r.score !== undefined">{{ r.score }}分</span>
            <span class="history-duration" v-if="r.duration">{{ r.duration }}s</span>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadHistory"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { practiceAPI, withRetry } from '@/api'

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }

const allList = ref([])
const filterSubject = ref('')
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)
const isMobile = ref(window.innerWidth < 768)

let _resizeHandler = null
if (typeof window !== 'undefined') {
  _resizeHandler = () => { isMobile.value = window.innerWidth < 768 }
  window.addEventListener('resize', _resizeHandler)
  onUnmounted(() => {
    if (_resizeHandler) window.removeEventListener('resize', _resizeHandler)
  })
}

const filteredList = computed(() => {
  let list = allList.value
  if (filterSubject.value) {
    list = list.filter(r => r.subject === filterSubject.value)
  }
  return list
})

const fmt = (d) => d ? new Date(d).toLocaleString('zh-CN') : '--'

const loadHistory = async () => {
  try {
    const res = await withRetry(() => practiceAPI.history({ page: currentPage.value, limit: pageSize }), { retries: 2, retryDelay: 2000 })
    const data = res.data
    allList.value = data?.list || data?.records || data || []
    total.value = data?.total || allList.value.length
  } catch (e) {
    console.error('加载练习历史失败:', e)
    ElMessage.error(e._userMessage || '加载历史记录失败')
  }
}

onMounted(loadHistory)
</script>

<style scoped>
.page-container {
  padding: 20px 16px 48px;
  max-width: 800px;
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
.filter-bar {
  margin-bottom: 16px;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 移动端卡片列表 */
.history-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.history-item {
  padding: 14px;
  background: #F8F9FC;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.history-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.history-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.history-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}
.history-time { flex: 1; }
.history-score { font-weight: 600; color: var(--primary); }
.history-duration { padding: 2px 8px; background: #fff; border-radius: 4px; }

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
    padding: 14px;
    border-radius: var(--radius-sm);
  }
  .history-card-list {
    gap: 8px;
  }
  .history-item {
    padding: 12px;
    border-radius: 8px;
  }
  .history-title {
    font-size: 13px;
  }
  .history-bottom {
    font-size: 11px;
    gap: 8px;
  }
}
</style>