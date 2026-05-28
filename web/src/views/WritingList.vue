<template>
  <div class="page-container">
    <div class="page-header"><h2>写作练习</h2></div>
    <div class="card" v-loading="loading">
      <el-empty v-if="!loading && !list.length" description="暂无写作题目" />
      <el-table v-else :data="list" stripe @row-click="goDetail" style="cursor: pointer;">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="题型" width="100">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="diffTag(row.difficulty)" size="small">{{ diffLabel(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="160">
          <template #default="{ row }">{{ fmt(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { questionAPI } from '@/api'

const router = useRouter()
const list = ref([])
const loading = ref(false)

const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const diffLabel = (d) => diffMap[d] || d || '中等'
const diffTag = (d) => {
  if (d === 'easy') return 'success'
  if (d === 'hard') return 'danger'
  return 'warning'
}
const typeMap = { independent: '独立写作', integrated: '综合写作' }
const typeLabel = (t) => typeMap[t] || t || '--'
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/writing/${row.id}`)

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getBySubject('writing')
    const data = res.data?.data?.list || res.data?.list || res.data || []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取写作题目失败:', e)
    list.value = []
  }
  finally { loading.value = false }
})
</script>