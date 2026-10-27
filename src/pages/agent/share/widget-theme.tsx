import { useId, type ReactNode } from 'react'
import { ScopedTheme } from '@/themes'
import { normalizeWidgetSettings, type WidgetSettings } from './widget-settings'
import './widget-theme.css'

export function WidgetTheme({
  settings,
  theme,
  children,
}: {
  settings: WidgetSettings
  theme?: string
  children: ReactNode
}) {
  const colors = normalizeWidgetSettings(settings)
  const id = `widget-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  // Only validated hex colors enter this instance's scoped token stylesheet.
  const palette = `#${id} {
    --widget-accent: ${colors.widgetAccentColor};
    --widget-background: ${colors.widgetBackgroundColor};
    --widget-text: ${colors.widgetTextColor};
    --widget-header-text: ${colors.widgetHeaderTextColor};
    --widget-footer-text: ${colors.widgetFooterTextColor};
  }`
  return (
    <ScopedTheme theme={theme}>
      <div id={id} className="agent-widget-theme contents">
        <style>{palette}</style>
        {children}
      </div>
    </ScopedTheme>
  )
}
