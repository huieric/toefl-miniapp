<template>
  <div class="bookmark-page">
    <div class="page-header">
      <h2>⭐ 题目收藏</h2>
      <p class="subtitle">收藏重要题目 · 快速复习回顾</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ stats?.total || 0 }}</div>
        <div class="stat-label">总收藏</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">{{ stats?.subjects?.find(s => s.subject === 'reading')?.count || 0 }}</div>
        <div class="stat-label">阅读</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎧</div>
        <div class="stat-value">{{ stats?.subjects?.find(s => s.subject === 'listening')?.count || 0 }}</div>
        <div class="stat-label">听力</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🗣️</div>
        <div class="stat-value">{{ stats?.subjects?.find(s => s.subject === 'speaking')?.count || 0 }}</div>
        <div class="stat-label">口语</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✍️</div>
        <div class="stat-value">{{ stats?.subjects?.find(s => s.subject === 'writing')?.count || 0 }}</div>
        <div class="stat-label">写作</div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="全部类型" clearable class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="阅读题" value="question" />
        <el-option label="文章" value="passage" />
      </el-select>
      <el-input v-model="searchQuery" placeholder="搜索收藏备注..." clearable class="search-input" />
    </div>

    <!-- 收藏列表 -->
    <div class="bookmark-list">
      <div v-for="(b, i) in bookmarks" :key="i" class="bookmark-item">
        <div class="bookmark-main">
          <div class="bookmark-header">
            <span class="bookmark-subject">{{ subjectIcon(b.subject) }}</span>
            <span class="bookmark-type">{{ b.type === 'passage' ? '📄 文章' : '📝 题目' }}</span>
            <span v-if="b.difficulty" class="bookmark-difficulty" :class="'diff-' + b.difficulty">{{ difficultyLabel(b.difficulty) }}</span>
            <span class="bookmark-date">{{ formatDate(b.created_at) }}</span>
          </div>
          <div class="bookmark-content">
            {{ b.title || b.note || '无标题' }}
          </div>
          <div v-if="b.note" class="bookmark-note">
            📌 {{ b.note }}
          </div>
          <div v-if="b.correct_rate !== undefined" class="bookmark-stats">
            <span>正确率: {{ Math.round(b.correct_rate * 100) }}%</span>
          </div>
        </div>
        <div class="bookmark-actions">
          <el-button text size="small" @click="editNote(b)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button text size="small" type="danger" @click="removeBookmark(b.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!bookmarks?.length" class="empty-state">
        <div class="empty-icon">⭐</div>
        <p>还没有收藏任何题目</p>
        <el-button type="primary" @click="$router.push('/reading')">去刷题收藏题目</el-button>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more">
        <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
      </div>
    </div>

    <!-- 编辑备注弹窗 -->
    <el-dialog v-model="noteDialogVisible" title="编辑备注" width="400px">
      <el-input v-model="editingNote" type="textarea" :rows="3" placeholder="添加备注..." />
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bookmarkAPI } from '@/api'
import { Edit, Delete } from '@element-plus/icons-vue'

const bookmarks = ref([])
const stats = ref({})
const filterType = ref('')
const searchQuery = ref('')
const hasMore = ref(false)
const loadingMore = ref(false)
const noteDialogVisible = ref(false)
const editingNote = ref('')
const editingId = ref('')

const loadData = async () => {
  try {
    const [statsRes, bookmarksRes] = await Promise.allSettled([
      bookmarkAPI.stats(),
      bookmarkAPI.list({ limit: 50 }),
    ])
    stats.value = statsRes.status === 'fulfilled' ? statsRes.value.data?.data || {} : {}
    bookmarks.value = bookmarksRes.status === 'fulvanized' ? bookmarksRes.value.data?.data?.bookmarks || [] : []
    hasMore.value = bookmarksRes.status === 'fulfilled' ? bookmarksRes.value.data?.data?.hasMore || false : false
  } catch (_) {
    // 模拟数据
    bookmarks.value = [
      { id: 1, subject: 'reading', type: 'question', title: 'Reading passage 1 - Question 5', difficulty: 'hard', note: '长难句分析重点', correct_rate: 0.35, created_at: new Date() },
      { id: 2, subject: 'listening', type: 'question', title: 'Listening lecture - Question 3', difficulty: 'medium', note: '讲座结构题', correct_rate: 0.52, created_at: new Date() },
      { id: 3, subject: 'speaking', type: 'question', title: 'Speaking task 2 - Integrated', difficulty: 'normal', note: '独立口语参考', correct_rate: 0.68, created_at: new Date() },
    ]
    stats.value = { total: 3, subjects: [{ subject: 'reading', count: 1 }, { subject: 'listening', count: 1 }, { subject: 'speaking', count: 1 }] }
  }
}

const removeBookmark = async (id) => {
  try {
    await bookmarkAPI.remove(id)
    bookmarks.value = bookmarks.value.filter(b => b.id !== id)
  } catch (e) {
    console.error('取消收藏失败:', e)
  }
}

const editNote = (bookmark) => {
  editingNote.value = bookmark.note || ''
  editingId.value = bookmark.id
  noteDialogVisible.value = true
}

const saveNote = async () => {
  try {
    await bookmarkAPI.update(editingId.value, { note: editingNote.value })
    const bookmark = bookmarks.value.find(b => b.id === editingId.value)
    if (bookmark) bookmark.note = editingNote.value
  } catch (e) {
    console.error('更新备注失败:', e)
  }
  noteDialogVisible.value = false
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    const res = await bookmarkAPI.list({ offset: bookmarks.value.length, limit: 50 })
    const more = res.data?.data?.bookmarks || []
    bookmarks.value.push(...more)
    hasMore.value = res.data?.data?.hasMore || false
  } catch (e) {
    console.error('加载更多失败:', e)
  } finally {
    loadingMore.value = false
  }
}

const subjectIcon = (s) => ({ reading: '📖', listening: '🎧', speaking: '🗣️', writing: '✍️' }[s] || '📄')
const difficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => loadData())
</script>

<style scoped>
.bookmark-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 24px; margin: 0 0 4px; }
.subtitle { color: var(--text-secondary); margin: 0; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border);
}
.stat-icon { font-size: 20px; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--primary); }
.stat-label { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.filter-select { width: 150px; }
.search-input { flex: 1; }

.bookmark-list { display: flex; flex-direction: column; gap: 12px; }
.bookmark-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  transition: transform 0.2s;
}
.bookmark-item:hover { transform: translateX(4px); }
.bookmark-main { flex: 1; min-width: 0; }
.bookmark-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.bookmark-subject { font-size: 16px; }
.bookmark-type { font-size: 12px; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }
.bookmark-difficulty {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
}
.diff-hard { background: #f44336; }
.diff-medium { background: #FF9800; }
.diff-normal { background: #4CAF50; }
.bookmark-date { font-size: 11px; color: #999; margin-left: auto; }
.bookmark-content { font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bookmark-note { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.bookmark-stats { font-size: 11px; color: #2196F3; }
.bookmark-actions { flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }

.load-more { text-align: center; margin-top: 16px; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state p { color: var(--text-secondary); margin-bottom: 16px; }
</style>
