import type { ReactNode } from 'react'
import { StyleProvider } from '@ant-design/cssinjs'
import { App as AntApp, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { useTranslation } from 'react-i18next'
import { buildAntdTheme } from '@/lib/antd-theme'
import { normalizeLocale } from '@/locales/locale-registry'
import {
  DEFAULT_APPEARANCE,
  type ResolvedAppearance,
} from '@/themes/appearance'

export function ApplicationStyleProvider({
  children,
  isDark,
  appearance,
}: {
  children: ReactNode
  isDark?: boolean
  appearance?: Readonly<ResolvedAppearance>
}) {
  const { i18n } = useTranslation()
  const english =
    normalizeLocale(i18n.resolvedLanguage ?? i18n.language) === 'en-US'
  const snapshot = appearance ?? {
    ...DEFAULT_APPEARANCE,
    resolvedMode: isDark ? ('dark' as const) : ('light' as const),
    reducedMotion: false,
  }
  return (
    // The root provider also contains AntApp's broad element reset rules.
    <StyleProvider layer>
      <ConfigProvider
        theme={buildAntdTheme(
          snapshot.resolvedMode === 'dark',
          snapshot.preset,
          snapshot,
        )}
        direction="ltr"
        locale={english ? enUS : zhCN}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
