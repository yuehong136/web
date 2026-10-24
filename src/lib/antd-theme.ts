import { theme as antdTheme, type ThemeConfig } from 'antd'
import { getTokenValue } from '@/lib/design-tokens'
import {
  getAppearance,
  type Appearance,
  type AppearancePreset,
} from '@/themes/appearance'

export function buildAntdTheme(
  isDark: boolean,
  preset: AppearancePreset = getAppearance().preset,
  appearance: Readonly<Appearance> & {
    readonly reducedMotion?: boolean
  } = getAppearance(),
): ThemeConfig {
  const mode = isDark ? 'dark' : 'light'
  const token = (name: Parameters<typeof getTokenValue>[0]) =>
    getTokenValue(name, mode, preset)
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
      colorPrimaryHover: token('components-button-primary-bg-hover'),
      colorPrimaryActive: token('components-button-primary-bg-active'),
      controlOutline: token('state-focus-10'),
      colorText: token('text-primary'),
      colorTextSecondary: token('text-secondary'),
      colorLink: token('text-accent'),
      colorLinkHover: token('text-primary'),
      colorLinkActive: token('text-primary'),
      colorBgContainer: token('background-surface'),
      colorBgElevated: token('components-dropdown-bg'),
      colorBorder: token('border-default'),
      borderRadius:
        preset === 'graphite'
          ? 6
          : preset === 'ocean'
            ? 12
            : preset === 'paper'
              ? 8
              : 10,
      fontSize: 14 * appearance.textScale,
      controlHeight:
        (appearance.density === 'compact' ? 32 : 40) * appearance.textScale,
      controlHeightSM:
        (appearance.density === 'compact' ? 28 : 32) * appearance.textScale,
      controlHeightLG:
        (appearance.density === 'compact' ? 40 : 48) * appearance.textScale,
      motion: appearance.motion !== 'reduced' && !appearance.reducedMotion,
    },
    components: {
      Checkbox: {
        colorPrimary: token('components-checkbox-bg-checked'),
        colorPrimaryHover: token('components-checkbox-bg-checked'),
        colorBgContainer: token('components-checkbox-bg'),
        colorBorder: token('components-checkbox-border'),
        colorWhite: token('components-checkbox-icon'),
      },
      Radio: {
        colorPrimary: token('components-radio-dot'),
        colorPrimaryHover: token('components-radio-border-checked'),
        colorPrimaryActive: token('components-radio-dot'),
        colorBgContainer: token('components-radio-bg'),
        colorBorder: token('components-radio-border'),
      },
      Slider: {
        railBg: token('components-slider-track'),
        railHoverBg: token('components-slider-track'),
        trackBg: token('components-slider-range'),
        trackHoverBg: token('components-slider-range'),
        handleColor: token('components-slider-thumb-border'),
        handleActiveColor: token('components-slider-thumb-border'),
        handleActiveOutlineColor: token('state-focus-10'),
        dotActiveBorderColor: token('components-slider-thumb-border'),
        colorBgElevated: token('components-slider-thumb'),
      },
      Select: {
        colorBgContainer: token('components-select-bg'),
        colorText: token('components-select-text'),
        colorTextPlaceholder: token('components-select-placeholder'),
        colorBorder: token('components-select-border'),
        activeBorderColor: token('components-select-border-focus'),
        activeOutlineColor: token('state-focus-10'),
        hoverBorderColor: token('components-input-border-hover'),
        optionSelectedBg: token('state-selected-bg'),
        optionActiveBg: token('components-sidebar-item-bg-hover'),
        optionSelectedColor: token('state-selected-text'),
      },
      Input: input,
      InputNumber: input,
      Tabs: {
        inkBarColor: token('state-selected'),
        itemSelectedColor: token('components-tabs-active-text'),
        itemHoverColor: token('text-primary'),
        itemColor: token('components-nav-item-text'),
      },
      Switch: {
        colorPrimary: token('components-switch-bg-checked'),
        colorPrimaryHover: token('components-switch-bg-checked'),
        handleBg: token('components-switch-thumb'),
        colorTextQuaternary: token('components-switch-bg'),
        colorTextTertiary: token('components-switch-bg'),
      },
    },
  }
}
