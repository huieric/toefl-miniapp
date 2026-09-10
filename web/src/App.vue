<template>
  <div class="app-layout" :class="{ 'is-mobile': isMobile }">
    <!-- 离线状态提示 -->
    <div v-if="!isOnline" class="offline-banner">
      <span class="offline-icon">📡</span>
      <span>{{ t('common.offline') }}</span>
      <span class="offline-badge" :class="{ 'slow': isWeakConnection }">{{ connectionLabel }}</span>
    </div>

    <!-- PWA 安装提示 -->
    <div v-if="showInstallPrompt" class="install-banner" @click="handleInstall">
      <el-icon :size="16"><Upload /></el-icon>
      <span>{{ t('common.offline') }}</span>
      <el-button text size="small" type="primary" @click.stop="">{{ t('common.goBack') }}</el-button>
      <el-icon class="close-btn" :size="14" @click.stop="dismissInstall"><Close /></el-icon>
    </div>

    <!-- Desktop Sidebar -->
    <aside class="sidebar" v-if="!isMobile && !$route.meta.noLayout">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <el-icon :size="20"><Notebook /></el-icon>
        </div>
        <div class="logo-text">
          <span class="logo-name">托福备考助手</span>
          <span class="logo-tag">TOEFL Prep</span>
        </div>
      </div>

      <nav class="side-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="side-nav-item"
          :class="{ active: activeMenu === item.path }"
        >
          <span class="nav-icon"><el-icon :size="18"><component :is="item.icon" /></el-icon></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-theme-toggle">
        <span class="toggle-label">{{ t('profile.darkMode') }}</span>
        <el-icon
          :size="18"
          class="toggle-icon"
          @click="toggleTheme"
          :title="isDark ? t('profile.lightMode') : t('profile.darkMode')"
        >
          <component :is="isDark ? Moon : Sun" />
        </el-icon>
      </div>

      <div class="sidebar-lang-toggle">
        <span class="toggle-label">{{ t('common.language') }}</span>
        <el-select :model-value="locale" size="small" @change="changeLang" style="width: 110px;">
          <el-option label="中文" value="zh-CN" />
          <el-option label="English" value="en" />
        </el-select>
      </div>

      <div class="sidebar-foot">
        <router-link to="/membership" class="upgrade-box">
          <span class="upgrade-icon"><el-icon :size="16"><Trophy /></el-icon></span>
          <div class="upgrade-text">
            <span class="upgrade-title">{{ t('profile.member') }}</span>
            <span class="upgrade-desc">{{ t('profile.memberDesc') }}</span>
          </div>
        </router-link>
      </div>
    </aside>

    <div class="main-area" :class="{ 'no-sidebar': isMobile || $route.meta.noLayout }">
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar" v-if="!isMobile && !$route.meta.noLayout">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">{{ t('nav.home') }}</el-breadcrumb-item>
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
          <span>{{ t('nav.home') }}</span>
        </router-link>
        <router-link to="/reading" class="tab-item" :class="{ active: $route.path.startsWith('/reading') || $route.path.startsWith('/listening') || $route.path.startsWith('/speaking') || $route.path.startsWith('/writing') || $route.path.startsWith('/mock-exam') }">
          <el-icon :size="22"><Reading /></el-icon>
          <span>{{ t('nav.practice') }}</span>
        </router-link>
        <router-link to="/wrong-book" class="tab-item" :class="{ active: $route.path.startsWith('/wrong-book') }">
          <el-icon :size="22"><Collection /></el-icon>
          <span>{{ t('nav.wrongBook') }}</span>
        </router-link>
        <router-link to="/achievements" class="tab-item" :class="{ active: $route.path.startsWith('/achievements') }">
          <el-icon :size="22"><Medal /></el-icon>
          <span>成就</span>
        </router-link>
        <router-link to="/match-mode" class="tab-item" :class="{ active: $route.path.startsWith('/match-mode') }">
          <el-icon :size="22"><Monitor /></el-icon>
          <span>配对</span>
        </router-link>
        <router-link to="/daily-challenge" class="tab-item" :class="{ active: $route.path.startsWith('/daily-challenge') }">
          <el-icon :size="22"><Trophy /></el-icon>
          <span>闯关</span>
        </router-link>
        <router-link to="/weekly-report" class="tab-item" :class="{ active: $route.path.startsWith('/weekly-report') }">
          <el-icon :size="22"><DataBoard /></el-icon>
          <span>周报</span>
        </router-link>
        <router-link to="/focus-timer" class="tab-item" :class="{ active: $route.path.startsWith('/focus-timer') }">
          <el-icon :size="22"><Timer /></el-icon>
          <span>专注</span>
        </router-link>
        <router-link to="/vocab" class="tab-item" :class="{ active: $route.path.startsWith('/vocab') }">
          <el-icon :size="22"><Notebook /></el-icon>
          <span>{{ t('nav.vocab') }}</span>
        </router-link>
        <router-link to="/profile" class="tab-item" :class="{ active: $route.path.startsWith('/profile') }">
          <el-icon :size="22"><User /></el-icon>
          <span>{{ t('nav.profile') }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notebook, HomeFilled, Reading, Headset, Microphone, Edit, Trophy, Collection, ChatDotRound, Calendar, User, MagicStick, Upload, Close, Moon, Sunny, Medal, Monitor, Timer, Aim, DataBoard, EditPen, CollectionTag, Document, Share, List, Connection } from '@element-plus/icons-vue'
import { useOnlineStatus } from './composables/useOnlineStatus'

const route = useRoute()
const { t, locale } = useI18n()
const windowWidth = ref(window.innerWidth)

// PWA 在线状态
const { isOnline, isWeakConnection, connectionLabel } = useOnlineStatus()

const isMobile = computed(() => windowWidth.value < 768)

const navItems = computed(() => [
  { path: '/', label: t('nav.home'), icon: HomeFilled },
  { path: '/reading', label: t('nav.reading'), icon: Reading },
  { path: '/listening', label: t('nav.listening'), icon: Headset },
  { path: '/speaking', label: t('nav.speaking'), icon: Microphone },
  { path: '/writing', label: t('nav.writing'), icon: Edit },
  { path: '/wrong-book', label: t('nav.wrongBook'), icon: Collection },
  { path: '/vocab', label: t('nav.vocab'), icon: Notebook },
  { path: '/achievements', label: '成就徽章', icon: Medal },
  { path: '/match-mode', label: '配对游戏', icon: Monitor },
  { path: '/daily-challenge', label: '每日闯关', icon: Trophy },
  { path: '/weekly-report', label: '学习周报', icon: DataBoard },
  { path: '/focus-timer', label: '专注森林', icon: Timer },
  { path: '/skill-mastery', label: '技能掌握', icon: Monitor },
  { path: '/streak-freeze', label: '连续保护', icon: Trophy },
  { path: '/daily-goals', label: '每日目标', icon: Aim },
  { path: '/language-level', label: 'CEFR等级', icon: Medal },
  { path: '/quiz-reaction', label: '情感反馈', icon: MagicStick },
  { path: '/study-heatmap', label: '学习热力图', icon: DataBoard },
  { path: '/grammar-assistant', label: '语法助手', icon: EditPen },
  { path: '/focus-session', label: '专注时间线', icon: CollectionTag },
  { path: '/phoneme-coach', label: 'ELSA 音素', icon: Headset },
  { path: '/speed-reading', label: '速度阅读', icon: Monitor },
  { path: '/bookmarks', label: '题目收藏', icon: Collection },
  { path: '/league', label: '联赛系统', icon: Trophy },
  { path: '/srs-review', label: '间隔重复', icon: Reading },
  { path: '/score-predictor', label: '分数预测', icon: DataAnalysis },
  { path: '/mock-exam', label: '全真模考', icon: Document },
  { path: '/learning-path', label: '学习路径', icon: Share },
  { path: '/daily-micro', label: '每日碎片', icon: List },
  // Round 30
  { path: '/intensive-listening', label: '听力精听', icon: Headset },
  { path: '/vocab-graph', label: '词汇图谱', icon: Connection },
  { path: '/enhanced-achievements', label: '成就徽章', icon: Trophy },
  { path: '/profile', label: t('nav.profile'), icon: User },
])

const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/reading')) return '/reading'
  if (p.startsWith('/listening')) return '/listening'
  if (p.startsWith('/speaking')) return '/speaking'
  if (p.startsWith('/writing')) return '/writing'
  if (p.startsWith('/mock-exam')) return '/mock-exam'
  if (p.startsWith('/wrong-book')) return '/wrong-book'
  if (p === '/achievements') return '/achievements'
  if (p === '/match-mode') return '/match-mode'
  if (p === '/daily-challenge') return '/daily-challenge'
  if (p === '/weekly-report') return '/weekly-report'
  if (p === '/focus-timer') return '/focus-timer'
  if (p === '/skill-mastery') return '/skill-mastery'
  if (p === '/streak-freeze') return '/streak-freeze'
  if (p === '/daily-goals') return '/daily-goals'
  if (p === '/language-level') return '/language-level'
  if (p === '/quiz-reaction') return '/quiz-reaction'
  if (p === '/study-heatmap') return '/study-heatmap'
  if (p === '/grammar-assistant') return '/grammar-assistant'
  if (p === '/focus-session') return '/focus-session'
  if (p === '/phoneme-coach') return '/phoneme-coach'
  if (p === '/speed-reading') return '/speed-reading'
  if (p === '/bookmarks') return '/bookmarks'
  if (p === '/league') return '/league'
  if (p === '/srs-review') return '/srs-review'
  if (p === '/score-predictor') return '/score-predictor'
  if (p === '/mock-exam') return '/mock-exam'
  if (p === '/learning-path') return '/learning-path'
  if (p === '/daily-micro') return '/daily-micro'
  // Round 30
  if (p === '/intensive-listening') return '/intensive-listening'
  if (p === '/vocab-graph') return '/vocab-graph'
  if (p === '/enhanced-achievements') return '/enhanced-achievements'
  if (p.startsWith('/ai-talk')) return '/ai-talk'
  if (p.startsWith('/ai-tutor')) return '/ai-tutor'
  if (p.startsWith('/plan')) return '/plan'
  if (p.startsWith('/profile')) return '/profile'
  return p
})

const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// —— 深色模式 ——
const STORAGE_KEY = 'toefl-dark-mode'
const isDark = ref(localStorage.getItem(STORAGE_KEY) === 'true')

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem(STORAGE_KEY, String(isDark.value))
}

onMounted(() => {
  applyTheme()
})

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
}

// —— 语言切换 ——
function changeLang(newLang) {
  locale.value = newLang
  localStorage.setItem('toefl-lang', newLang)
}

// —— PWA 安装提示 ——
const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)

const dismissInstall = () => { showInstallPrompt.value = false }

const handleInstall = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    console.log('[PWA] 用户安装应用')
  }
  deferredPrompt.value = null
  showInstallPrompt.value = false
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  showInstallPrompt.value = true
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ---------- 侧边栏 ---------- */
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--card-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 18px 12px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px 20px;
}
.logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: var(--grad-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(66, 85, 255, 0.35);
  flex-shrink: 0;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.logo-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.01em;
}
.logo-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ---------- 导航 ---------- */
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.side-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s ease;
  position: relative;
}
.side-nav-item:hover {
  background: var(--primary-soft);
  color: var(--text);
}
.side-nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
}
.side-nav-item.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 22px;
  border-radius: 4px;
  background: var(--primary);
}
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---------- 主题切换 ---------- */
.sidebar-theme-toggle,
.sidebar-lang-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin: 8px 0;
  border-radius: 12px;
  background: var(--primary-soft);
  cursor: pointer;
  transition: all 0.18s ease;
}
.sidebar-theme-toggle:hover {
  background: var(--primary-soft-2);
}
.toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}
.toggle-icon {
  color: var(--primary);
  transition: transform 0.25s ease;
}
.toggle-icon:hover {
  transform: rotate(15deg) scale(1.1);
}

/* ---------- 侧边栏底部 ---------- */
.sidebar-foot {
  padding-top: 12px;
}
.upgrade-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--warning-soft) 0%, rgba(255,255,255,0.05) 100%);
  border: 1px solid var(--border);
  transition: all 0.18s ease;
}
.upgrade-box:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.upgrade-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--warning);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.upgrade-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.upgrade-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--warning);
}
.upgrade-desc {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ---------- 主区域 ---------- */
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
  padding: 14px 32px;
  background: var(--bg);
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

/* ---------- 移动端 Tab ---------- */
.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  flex-shrink: 0;
  box-shadow: 0 -4px 16px rgba(26, 29, 46, 0.05);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 11px;
  padding: 4px 0;
  min-width: 60px;
  text-decoration: none;
  transition: color 0.18s ease;
}
.tab-item.active {
  color: var(--primary);
  font-weight: 700;
}

/* —— PWA 安装提示 —— */
.install-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--primary-soft);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  z-index: 200;
}
.install-banner .el-icon {
  color: var(--primary);
  flex-shrink: 0;
}
.install-banner .close-btn {
  margin-left: auto;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}
.install-banner .close-btn:hover {
  color: var(--text);
}

/* —— 离线状态提示 —— */
.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFF3E0;
  border-bottom: 1px solid #FFE0B2;
  font-size: 13px;
  color: #E65100;
  z-index: 199;
}
.offline-banner .offline-icon {
  font-size: 16px;
}
.offline-banner .offline-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #FF9800;
  color: #fff;
}
.offline-banner .offline-badge.slow {
  background: #F44336;
}

/* PWA standalone 模式下的样式 */
:root {
  --app-padding: 16px;
}
@media (display-mode: standalone) {
  .app-layout {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .mobile-tab-bar {
    padding-bottom: calc(env(safe-area-inset-bottom, 8px) + 8px);
  }
}
</style>
