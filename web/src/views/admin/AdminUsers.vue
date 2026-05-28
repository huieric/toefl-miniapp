<template>
  <div>
    <h2 class="admin-page-title">用户管理</h2>
    <p class="admin-page-desc">查看和管理注册用户（模拟数据）</p>

    <!-- Search -->
    <div class="card search-bar">
      <el-input
        v-model="search"
        placeholder="搜索手机号 / 昵称"
        clearable
        prefix-icon="Search"
        style="max-width: 320px;"
        @input="handleSearch"
      />
      <div class="user-stats">
        <el-tag type="info">共 {{ filteredUsers.length }} 位用户</el-tag>
        <el-tag type="success">VIP {{ premiumCount }} 人</el-tag>
        <el-tag type="warning">免费 {{ freeCount }} 人</el-tag>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <el-table :data="pagedUsers" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px;">
              <el-avatar :size="28" icon="UserFilled" />
              <div>
                <div style="font-size:14px;font-weight:500;">{{ row.nickname }}</div>
                <div style="font-size:12px;color:var(--text-secondary);">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="membership" label="会员" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.membership === 'premium' ? 'warning' : 'info'" size="small" effect="plain">
              {{ row.membership === 'premium' ? 'VIP' : '免费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalMinutes" label="练习时长" width="110" align="center">
          <template #default="{ row }">{{ row.totalMinutes || 0 }} 分钟</template>
        </el-table-column>
        <el-table-column prop="totalQuestions" label="做题数" width="90" align="center" />
        <el-table-column prop="lastLogin" label="最后登录" width="160" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewUser(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredUsers.length"
        layout="prev, pager, next, total"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="用户详情" width="480px">
      <div v-if="currentUser" class="user-detail">
        <div class="detail-row"><span class="detail-label">昵称</span>{{ currentUser.nickname }}</div>
        <div class="detail-row"><span class="detail-label">手机号</span>{{ currentUser.phone }}</div>
        <div class="detail-row"><span class="detail-label">会员类型</span>
          <el-tag :type="currentUser.membership === 'premium' ? 'warning' : 'info'" size="small">
            {{ currentUser.membership === 'premium' ? 'VIP' : '免费' }}
          </el-tag>
        </div>
        <div class="detail-row"><span class="detail-label">目标分数</span>{{ currentUser.targetScore || '--' }}</div>
        <div class="detail-row"><span class="detail-label">考试日期</span>{{ currentUser.examDate || '--' }}</div>
        <div class="detail-row"><span class="detail-label">练习时长</span>{{ currentUser.totalMinutes || 0 }} 分钟</div>
        <div class="detail-row"><span class="detail-label">做题数</span>{{ currentUser.totalQuestions || 0 }}</div>
        <div class="detail-row"><span class="detail-label">注册时间</span>{{ currentUser.createdAt }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const search = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentUser = ref(null)
const users = ref([])

// 模拟用户数据
const mockUsers = () => {
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '陈一', '林二']
  const memberships = ['free', 'premium']
  return Array.from({ length: 48 }, (_, i) => ({
    id: i + 1,
    nickname: names[i % names.length] + (i > 9 ? Math.ceil(i / 10) : ''),
    phone: `138${String(10000000 + i).slice(0, 8)}`,
    membership: memberships[i % 3 === 0 ? 1 : 0], // 1/3 premium
    totalMinutes: Math.floor(Math.random() * 5000 + 100),
    totalQuestions: Math.floor(Math.random() * 800 + 20),
    targetScore: [90, 100, 105, 110, 115][i % 5],
    examDate: `2026-${String(6 + (i % 6)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    lastLogin: `2026-05-${String(10 + (i % 18)).padStart(2, '0')} 18:30:00`,
    createdAt: `2025-${String(9 + (i % 4)).padStart(2, '0')}-01`,
  }))
}

const filteredUsers = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return users.value
  return users.value.filter(u =>
    u.phone.includes(kw) || u.nickname.toLowerCase().includes(kw)
  )
})

const premiumCount = computed(() => users.value.filter(u => u.membership === 'premium').length)
const freeCount = computed(() => users.value.filter(u => u.membership === 'free').length)

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { currentPage.value = 1 }

const viewUser = (row) => {
  currentUser.value = row
  detailVisible.value = true
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    users.value = mockUsers()
    loading.value = false
  }, 400)
})
</script>

<style scoped>
.admin-page-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.admin-page-desc { color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; }
.search-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.user-stats { display: flex; gap: 8px; }
.user-detail { display: flex; flex-direction: column; gap: 12px; }
.detail-row { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.detail-label {
  display: inline-block; width: 80px; flex-shrink: 0;
  color: var(--text-secondary); font-size: 13px;
}
</style>
