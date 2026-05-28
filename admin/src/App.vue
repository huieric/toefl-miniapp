<template>
  <div class="app-wrapper" :class="{ 'sidebar-open': sidebarVisible }">
    <!-- 移动端遮罩 -->
    <div class="sidebar-overlay" v-if="sidebarVisible" @click="sidebarVisible = false"></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarVisible }">
      <div class="sidebar-brand">
        <span class="brand-blue">TOEFL</span> Admin
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ active: activeMenu === '/dashboard' }" @click="closeSidebar">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </router-link>
        <router-link to="/users" class="nav-item" :class="{ active: activeMenu === '/users' }" @click="closeSidebar">
          <el-icon><User /></el-icon>
          <span>用户分析</span>
        </router-link>
        <router-link to="/usage" class="nav-item" :class="{ active: activeMenu === '/usage' }" @click="closeSidebar">
          <el-icon><TrendCharts /></el-icon>
          <span>使用趋势</span>
        </router-link>
        <router-link to="/questions" class="nav-item" :class="{ active: activeMenu === '/questions' }" @click="closeSidebar">
          <el-icon><Document /></el-icon>
          <span>题目审核</span>
        </router-link>
        <router-link to="/feedback" class="nav-item" :class="{ active: activeMenu === '/feedback' }" @click="closeSidebar">
          <el-icon><ChatLineSquare /></el-icon>
          <span>反馈管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <header class="topbar">
        <button class="hamburger" @click="sidebarVisible = !sidebarVisible">
          <span></span><span></span><span></span>
        </button>
        <span class="topbar-title">{{ pageTitle }}</span>
        <el-tag type="info" size="small">管理员</el-tag>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const sidebarVisible = ref(false);
const activeMenu = computed(() => route.path);

const titleMap = {
  '/dashboard': '数据总览',
  '/users': '用户分析',
  '/usage': '使用趋势',
  '/questions': '题目审核',
  '/feedback': '反馈管理',
};
const pageTitle = computed(() => titleMap[route.path] || '管理后台');

function closeSidebar() {
  sidebarVisible.value = false;
}
</script>

<style>
/* === 全局重置 === */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

/* === 布局 === */
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* === 侧边栏 === */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: transform 0.25s ease;
}
.sidebar-brand {
  padding: 20px 16px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.brand-blue { color: #4A90D9; }
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}
.nav-item:hover { color: #ddd; background: rgba(255,255,255,0.05); }
.nav-item.active {
  color: #4A90D9;
  background: rgba(74,144,217,0.1);
  border-left-color: #4A90D9;
}

/* === 主区域 === */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* === 顶栏 === */
.topbar {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  flex-shrink: 0;
}
.topbar-title {
  font-size: 15px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === 汉堡菜单 === */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
}
.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: #333;
  border-radius: 1px;
}

/* === 内容区 === */
.content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* === 遮罩 === */
.sidebar-overlay {
  display: none;
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .hamburger { display: flex; }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
  }
  .sidebar--open { transform: translateX(0); }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 99;
  }

  .topbar { padding: 0 12px; height: 48px; }
  .topbar-title { font-size: 14px; }
  .content { padding: 12px; }
}
</style>