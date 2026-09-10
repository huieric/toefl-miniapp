import { createApp } from 'vue'
import {
  ElAlert, ElAvatar, ElBreadcrumb, ElBreadcrumbItem, ElButton, ElCard, ElCheckbox, ElCol,
  ElCollapse, ElCollapseItem, ElDatePicker, ElDialog, ElDivider, ElEmpty, ElForm, ElFormItem,
  ElIcon, ElInput, ElLoading, ElMenu, ElMenuItem, ElOption, ElPagination, ElProgress,
  ElRadio, ElRadioButton, ElRadioGroup, ElResult, ElRow, ElSelect, ElSlider, ElStep, ElSteps,
  ElTable, ElTableColumn, ElTag,
} from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'

const app = createApp(App)

// 按需注册用到的 Element Plus 组件（替代全量 app.use(ElementPlus)，首屏 JS 大幅减小）
const components = [
  ElAlert, ElAvatar, ElBreadcrumb, ElBreadcrumbItem, ElButton, ElCard, ElCheckbox, ElCol,
  ElCollapse, ElCollapseItem, ElDatePicker, ElDialog, ElDivider, ElEmpty, ElForm, ElFormItem,
  ElIcon, ElInput, ElMenu, ElMenuItem, ElOption, ElPagination, ElProgress,
  ElRadio, ElRadioButton, ElRadioGroup, ElResult, ElRow, ElSelect, ElSlider, ElStep, ElSteps,
  ElTable, ElTableColumn, ElTag,
]
for (const c of components) {
  app.component(c.name, c)
}
// v-loading 指令（ElMessage / ElMessageBox 已在各页面显式 import，无需全局注册）
app.directive('loading', ElLoading.directive)

app.use(i18n)
app.use(router)

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/toefl-miniapp/web/sw.js')
      .then((reg) => {
        console.log('[SW] 注册成功', reg.scope)
        // 定期检查更新
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] 新版本可用，刷新以更新')
              }
            })
          }
        })
      })
      .catch((err) => console.log('[SW] 注册失败', err))
  })
}

app.mount('#app')
