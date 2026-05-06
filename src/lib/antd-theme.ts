import { theme as antdTheme, type ThemeConfig } from 'antd'

export function buildAntdTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#818cf8' : '#18181b',
      borderRadius: 8,
    },
    components: {
      Slider: {
        railBg: isDark ? 'rgba(255, 255, 255, 0.25)' : '#e5e7eb',
        railHoverBg: isDark ? 'rgba(255, 255, 255, 0.35)' : '#d1d5db',
        trackBg: isDark ? '#818cf8' : '#18181b',
        trackHoverBg: isDark ? '#6366f1' : '#27272a',
        handleColor: isDark ? '#818cf8' : '#18181b',
        handleActiveColor: isDark ? '#6366f1' : '#27272a',
      },
      Select: {
        optionSelectedBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        optionActiveBg: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
        optionSelectedColor: isDark ? '#ffffff' : '#1f2937',
      },
      Input: {
        colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
        colorText: isDark ? '#ffffff' : '#1f2937',
        colorTextPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
        colorBorder: isDark ? '#424242' : '#d9d9d9',
      },
      InputNumber: {
        colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
        colorText: isDark ? '#ffffff' : '#1f2937',
        colorTextPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
        colorBorder: isDark ? '#424242' : '#d9d9d9',
      },
      Tabs: {
        inkBarColor: isDark ? '#818cf8' : '#18181b',
        itemSelectedColor: isDark ? '#818cf8' : '#18181b',
        itemHoverColor: isDark ? '#a5b4fc' : '#3f3f46',
        itemColor: isDark ? '#9ca3af' : '#71717a',
      },
      Switch: {
        colorPrimary: isDark ? '#818cf8' : '#18181b',
        colorPrimaryHover: isDark ? '#6366f1' : '#27272a',
      },
    },
  }
}
