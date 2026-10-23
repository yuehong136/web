import i18n, {
  ensureLocaleLoaded,
  namespaceCodes,
  setProductLanguage,
} from './i18n'

// Isolated test setup makes component tests explicit consumers of every domain.
// App bootstrap and route loading never import this file.
await Promise.all([
  ensureLocaleLoaded('en-US', namespaceCodes),
  ensureLocaleLoaded('zh-CN', namespaceCodes),
])
await setProductLanguage('zh-CN')

// Legacy component fixtures use the i18next method directly. Route this through
// the same preference transaction so formatters and UI labels stay consistent.
Object.assign(i18n, {
  changeLanguage: (language: string) =>
    setProductLanguage(language as 'en-US' | 'zh-CN').then(() => i18n.t),
})
