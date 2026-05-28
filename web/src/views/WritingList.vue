<template>
  <div class="page-container">
    <div class="page-header"><h2>写作练习</h2></div>
    <div class="card" v-loading="loading">
      <el-empty v-if="!loading && !list.length" description="暂无写作题目" />
      <el-table v-else :data="list" stripe @row-click="goDetail" style="cursor: pointer;">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="diffTag(row.difficulty)" size="small">{{ row.difficulty || '中等' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="添加时间" width="160">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
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

const diffTag = (d) => {
  if (d === '简单') return 'success'
  if (d === '困难') return 'danger'
  return 'warning'
}
const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const goDetail = (row) => router.push(`/writing/${row._id || row.id}`)

onMounted(async () => {
  loading.value = true
  try {
    const res = await questionAPI.getBySubject('writing')
    list.value = res.data?.list || res.data?.questions || res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>