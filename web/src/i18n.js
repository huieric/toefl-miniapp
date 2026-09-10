import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.js'
import en from './locales/en.js'

// 从 localStorage 读取已保存的语言，否则根据浏览器语言默认
const savedLang = localStorage.getItem('toefl-lang')
const defaultLocale = savedLang || (navigator.language.startsWith('zh') ? 'zh-CN' : 'en')

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export default i18n
