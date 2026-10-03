import { theme as antdTheme, type ThemeConfig } from 'antd'
import { getTokenValue } from '@/lib/design-tokens'

export function buildAntdTheme(isDark: boolean): ThemeConfig {
  const mode = isDark ? 'dark' : 'light'
  const token = (name: Parameters<typeof getTokenValue>[0]) =>
    getTokenValue(name, mode)
  const input = {
    colorBgContainer: token('components-input-bg'),
    colorText: token('components-input-text'),
    colorTextPlaceholder: token('components-input-text-placeholder'),
    colorBorder: token('components-input-border'),
    activeBorderColor: token('components-input-border-focus'),
    hoverBorderColor: token('components-input-border-hover'),
  }

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: token('components-button-primary-bg'),
      colorText: token('text-primary'),
      colorTextSecondary: token('text-secondary'),
      colorLink: token('text-accent'),
      colorLinkHover: token('text-primary'),
      colorLinkActive: token('text-primary'),
      colorBgContainer: token('background-surface'),
      colorBgElevated: token('components-dropdown-bg'),
      colorBorder: token('border-default'),
      borderRadius: 8,
    },
    components: {
      Slider: {
        railBg: token('border-strong'),
        railHoverBg: token('components-input-border-hover'),
        trackBg: token('components-button-primary-bg'),
        trackHoverBg: token('components-button-primary-bg-hover'),
        handleColor: token('components-button-primary-bg'),
        handleActiveColor: token('components-button-primary-bg-hover'),
      },
      Select: {
        optionSelectedBg: token('components-sidebar-item-bg-active'),
        optionActiveBg: token('components-sidebar-item-bg-hover'),
        optionSelectedColor: token('text-primary'),
      },
      Input: input,
      InputNumber: input,
      Tabs: {
        inkBarColor: token('components-button-primary-bg'),
        itemSelectedColor: token('text-primary'),
        itemHoverColor: token('text-primary'),
        itemColor: token('components-nav-item-text'),
      },
      Switch: {
        colorPrimary: token('components-button-primary-bg'),
        colorPrimaryHover: token('components-button-primary-bg-hover'),
      },
    },
  }
}
