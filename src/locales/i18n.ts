/**
 * i18n 国际化配置
 * 
 * 安装依赖：
 * npm install i18next react-i18next i18next-browser-languagedetector
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译文件
import zhCN from './zh-CN'
import enUS from './en-US'

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
}

i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources,
    fallbackLng: 'zh-CN', // 默认语言
    debug: import.meta.env.DEV, // 开发环境开启调试

    interpolation: {
      escapeValue: false, // React 已经处理 XSS
    },

    detection: {
      // 语言检测配置
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_language',
    },
  })

export default i18n

/**
 * 切换语言
 */
export const changeLanguage = (lang: 'zh-CN' | 'en-US') => {
  i18n.changeLanguage(lang)
  localStorage.setItem('i18n_language', lang)
}

/**
 * 获取当前语言
 */
export const getCurrentLanguage = () => {
  return i18n.language as 'zh-CN' | 'en-US'
}
