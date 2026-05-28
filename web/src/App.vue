<template>
  <div class="app-layout" :class="{ 'is-mobile': isMobile }">
    <!-- Desktop Sidebar -->
    <aside class="sidebar" v-if="!isMobile && !$route.meta.noLayout">
      <div class="sidebar-logo">
        <el-icon :size="28"><Notebook /></el-icon>
        <span>托福备考助手</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#ffffff"
        text-color="#333333"
        active-text-color="#4A90D9"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>学习仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/reading">
          <el-icon><Reading /></el-icon>
          <span>阅读练习</span>
        </el-menu-item>
        <el-menu-item index="/listening">
          <el-icon><Headset /></el-icon>
          <span>听力练习</span>
        </el-menu-item>
        <el-menu-item index="/speaking">
          <el-icon><Microphone /></el-icon>
          <span>口语练习</span>
        </el-menu-item>
        <el-menu-item index="/writing">
          <el-icon><Edit /></el-icon>
          <span>写作练习</span>
        </el-menu-item>
        <el-menu-item index="/mock-exam">
          <el-icon><Trophy /></el-icon>
          <span>模拟考试</span>
        </el-menu-item>
        <el-menu-item index="/wrong-book">
          <el-icon><Collection /></el-icon>
          <span>错题本</span>
        </el-menu-item>
        <el-menu-item index="/ai-talk">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI陪练</span>
        </el-menu-item>
        <el-menu-item index="/plan">
          <el-icon><Calendar /></el-icon>
          <span>学习计划</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="main-area" :class="{ 'no-sidebar': isMobile || $route.meta.noLayout }">
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar" v-if="!isMobile && !$route.meta.noLayout">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- Page Content -->
      <main class="main-content">
        <router-view />
      </main>

      <!-- Mobile Tab Bar -->
      <nav class="tab-bar" v-if="isMobile && !$route.meta.noLayout">
        <router-link to="/" class="tab-item" :class="{ active: $route.path === '/' }">
          <el-icon :size="22"><HomeFilled /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/reading" class="tab-item" :class="{ active: $route.path.startsWith('/reading') || $route.path.startsWith('/listening') || $route.path.startsWith('/speaking') || $route.path.startsWith('/writing') || $route.path.startsWith('/mock-exam') }">
          <el-icon :size="22"><Reading /></el-icon>
          <span>练习</span>
        </router-link>
        <router-link to="/ai-talk" class="tab-item" :class="{ active: $route.path.startsWith('/ai-talk') }">
          <el-icon :size="22"><ChatDotRound /></el-icon>
          <span>AI陪练</span>
        </router-link>
        <router-link to="/profile" class="tab-item" :class="{ active: $route.path.startsWith('/profile') }">
          <el-icon :size="22"><User /></el-icon>
          <span>我的</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)
const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/reading')) return '/reading'
  if (p.startsWith('/listening')) return '/listening'
  if (p.startsWith('/speaking')) return '/speaking'
  if (p.startsWith('/writing')) return '/writing'
  if (p.startsWith('/mock-exam')) return '/mock-exam'
  if (p.startsWith('/wrong-book')) return '/wrong-book'
  if (p.startsWith('/ai-talk')) return '/ai-talk'
  if (p.startsWith('/plan')) return '/plan'
  if (p.startsWith('/profile')) return '/profile'
  return p
})

const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--card-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  border-bottom: 1px solid var(--border);
}

.sidebar :deep(.el-menu) {
  border-right: none;
}
.sidebar :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  padding-left: 20px !important;
}
.sidebar :deep(.el-menu-item.is-active) {
  background-color: rgba(74, 144, 217, 0.08);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.main-area.no-sidebar {
  width: 100%;
}

.breadcrumb-bar {
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  padding: 6px 0 env(safe-area-inset-bottom, 6px);
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 11px;
  padding: 4px 0;
  min-width: 60px;
  text-decoration: none;
}
.tab-item.active {
  color: var(--primary);
}
</style>