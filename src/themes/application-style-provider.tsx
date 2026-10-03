import type { ReactNode } from 'react'
import { StyleProvider } from '@ant-design/cssinjs'
import { XProvider } from '@ant-design/x'
import { App as AntApp } from 'antd'
import { buildAntdTheme } from '@/lib/antd-theme'

export function ApplicationStyleProvider({
  children,
  isDark,
}: {
  children: ReactNode
  isDark: boolean
}) {
  return (
    // The root provider also contains AntApp's broad element reset rules.
    <StyleProvider layer>
      <XProvider theme={buildAntdTheme(isDark)} direction="ltr">
        <AntApp>{children}</AntApp>
      </XProvider>
    </StyleProvider>
  )
}
