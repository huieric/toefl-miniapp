<template>
  <div class="admin-layout">
    <!-- Admin Top Nav -->
    <header class="admin-header">
      <div class="admin-logo">
        <el-icon :size="22"><Notebook /></el-icon>
        <span>托福备考 · 管理后台</span>
      </div>
      <div class="admin-nav">
        <el-menu mode="horizontal" :default-active="activeMenu" router background-color="#fff" text-color="#333">
          <el-menu-item index="/admin">数据总览</el-menu-item>
          <el-menu-item index="/admin/users">用户管理</el-menu-item>
          <el-menu-item index="/admin/questions">题目审核</el-menu-item>
          <el-menu-item index="/admin/feedback">反馈管理</el-menu-item>
        </el-menu>
      </div>
      <div class="admin-user">
        <el-avatar :size="28" icon="UserFilled" />
        <el-button text size="small" @click="goBack">返回前台</el-button>
      </div>
    </header>

    <!-- Page Content -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notebook, UserFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/admin/users')) return '/admin/users'
  if (p.startsWith('/admin/questions')) return '/admin/questions'
  if (p.startsWith('/admin/feedback')) return '/admin/feedback'
  return '/admin'
})

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.admin-layout { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; }
.admin-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-bottom: 1px solid var(--border);
  padding: 0 20px; height: 56px; flex-shrink: 0;
}
.admin-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); font-size: 15px; white-space: nowrap; }
.admin-nav { flex: 1; display: flex; justify-content: center; }
.admin-nav :deep(.el-menu--horizontal) { border-bottom: none; }
.admin-user { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.admin-main { flex: 1; padding: 20px; overflow-y: auto; }
@media (max-width: 768px) {
  .admin-header { padding: 0 10px; }
  .admin-nav { overflow-x: auto; }
  .admin-main { padding: 12px; }
}
</style>
