export const localeRegistry = {
  'zh-CN': {
    label: 'Simplified Chinese',
    nativeLabel: '简体中文',
    namespaces: {
      common: () => import('./zh-CN/common'),
      layout: () => import('./zh-CN/layout'),
      'route-errors': () => import('./zh-CN/route-errors'),
      auth: () => import('./zh-CN/auth'),
      desktop: () => import('./zh-CN/desktop'),
      home: () => import('./zh-CN/home'),
      chat: () => import('./zh-CN/chat'),
      agent: () => import('./zh-CN/agent'),
      agents: () => import('./zh-CN/agents'),
      flow: () => import('./zh-CN/flow'),
      knowledge: () => import('./zh-CN/knowledge'),
      'document-create': () => import('./zh-CN/document-create'),
      datasource: () => import('./zh-CN/datasource'),
      explore: () => import('./zh-CN/explore'),
      search: () => import('./zh-CN/search'),
      memory: () => import('./zh-CN/memory'),
      studio: () => import('./zh-CN/studio'),
      tools: () => import('./zh-CN/tools'),
      mcp: () => import('./zh-CN/mcp'),
      settings: () => import('./zh-CN/settings'),
      sandbox: () => import('./zh-CN/sandbox'),
      channel: () => import('./zh-CN/channel'),
      skills: () => import('./zh-CN/skills'),
      appearance: () => import('./zh-CN/appearance'),
      sources: () => import('./zh-CN/sources'),
    },
    matches: (value: string) =>
      value === 'zh' || value === 'zh-cn' || value.startsWith('zh-hans'),
  },
  'en-US': {
    label: 'English',
    nativeLabel: 'English',
    namespaces: {
      common: () => import('./en-US/common'),
      layout: () => import('./en-US/layout'),
      'route-errors': () => import('./en-US/route-errors'),
      auth: () => import('./en-US/auth'),
      desktop: () => import('./en-US/desktop'),
      home: () => import('./en-US/home'),
      chat: () => import('./en-US/chat'),
      agent: () => import('./en-US/agent'),
      agents: () => import('./en-US/agents'),
      flow: () => import('./en-US/flow'),
      knowledge: () => import('./en-US/knowledge'),
      'document-create': () => import('./en-US/document-create'),
      datasource: () => import('./en-US/datasource'),
      explore: () => import('./en-US/explore'),
      search: () => import('./en-US/search'),
      memory: () => import('./en-US/memory'),
      studio: () => import('./en-US/studio'),
      tools: () => import('./en-US/tools'),
      mcp: () => import('./en-US/mcp'),
      settings: () => import('./en-US/settings'),
      sandbox: () => import('./en-US/sandbox'),
      channel: () => import('./en-US/channel'),
      skills: () => import('./en-US/skills'),
      appearance: () => import('./en-US/appearance'),
      sources: () => import('./en-US/sources'),
    },
    matches: (value: string) =>
      value === 'en' || value === 'en-us' || value.startsWith('en-'),
  },
} as const

export type ProductLocale = keyof typeof localeRegistry

export interface SupportedLocale {
  code: ProductLocale
  label: string
  nativeLabel: string
}

export const DEFAULT_PRODUCT_LANGUAGE = 'zh-CN' satisfies ProductLocale
export const localeCodes = Object.keys(localeRegistry) as ProductLocale[]
export const supportedLocales: SupportedLocale[] = localeCodes.map((code) => ({
  code,
  label: localeRegistry[code].label,
  nativeLabel: localeRegistry[code].nativeLabel,
}))

export const normalizeLocale = (value: unknown): ProductLocale | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().replaceAll('_', '-').toLowerCase()
  if (!normalized) return undefined
  return localeCodes.find((code) => {
    const entry = localeRegistry[code]
    return normalized === code.toLowerCase() || entry.matches(normalized)
  })
}

export type LocaleNamespace =
  keyof (typeof localeRegistry)['zh-CN']['namespaces']
export const namespaceCodes = Object.keys(
  localeRegistry[DEFAULT_PRODUCT_LANGUAGE].namespaces,
) as LocaleNamespace[]
export type LocaleResource = Record<string, unknown>
export const BOOTSTRAP_NAMESPACES: readonly LocaleNamespace[] = [
  'common',
  'layout',
  'route-errors',
]

/** Imports a single language/domain; index.ts is deliberately outside this path. */
export const loadLocaleNamespace = async (
  locale: ProductLocale,
  namespace: LocaleNamespace,
): Promise<LocaleResource> => {
  const module = (await localeRegistry[locale].namespaces[
    namespace
  ]()) as Record<string, LocaleResource>
  return (module.default ?? module[`${namespace}Resource`]) as LocaleResource
}

export const loadLocaleResource = async (
  locale: ProductLocale,
  namespaces: readonly LocaleNamespace[] = namespaceCodes,
): Promise<LocaleResource> =>
  Object.assign(
    {},
    ...(await Promise.all(
      namespaces.map((namespace) => loadLocaleNamespace(locale, namespace)),
    )),
  )

/** Explicit full-catalog loading for tooling/tests; never called by app bootstrap. */
export const createI18nResources = async () =>
  Object.fromEntries(
    await Promise.all(
      localeCodes.map(async (locale) => [
        locale,
        {
          translation: await loadLocaleResource(locale),
        },
      ]),
    ),
  ) as Record<ProductLocale, { translation: typeof import('./en-US').default }>
