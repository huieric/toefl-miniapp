<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.push('/profile')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>练习历史</h2>
    </div>

    <div class="card">
      <div class="filter-bar">
        <el-select v-model="filterSubject" placeholder="全部科目" clearable style="width: 130px;">
          <el-option label="阅读" value="reading" />
          <el-option label="听力" value="listening" />
          <el-option label="口语" value="speaking" />
          <el-option label="写作" value="writing" />
        </el-select>
      </div>

      <el-empty v-if="!filteredList.length" description="暂无练习记录" />

      <el-table v-else :data="filteredList" stripe>
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
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { practiceAPI } from '@/api'

const subjectMap = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }

const allList = ref([])
const filterSubject = ref('')
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)

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
    const res = await practiceAPI.history({ page: currentPage.value, limit: pageSize })
    const data = res.data
    allList.value = data?.list || data?.records || data || []
    total.value = data?.total || allList.value.length
  } catch (e) { console.error(e) }
}

onMounted(loadHistory)
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>