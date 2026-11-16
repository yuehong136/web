import { theme as antdTheme, type ThemeConfig } from 'antd'
import { getTokenValue } from '@/lib/design-tokens'
import {
  getAppearance,
  type Appearance,
  type AppearancePreset,
} from '@/themes/appearance'

/** `--radius` per preset in themes/appearance.css (radius-lg). */
const PRESET_RADIUS: Record<AppearancePreset, number> = {
  mist: 8,
  studio: 10,
  paper: 8,
  graphite: 6,
  ocean: 12,
}

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
    colorTextDisabled: token('components-input-text-disabled'),
    colorBgContainerDisabled: token('components-input-bg-disabled'),
    colorTextPlaceholder: token('components-input-text-placeholder'),
    colorError: token('components-input-border-error'),
    colorBorder: token('components-input-border'),
    activeBorderColor: token('components-input-border-focus'),
    hoverBorderColor: token('components-input-border-hover'),
  }

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      fontFamily: 'var(--font-interface)',
      fontFamilyCode: 'var(--font-code)',
      colorPrimary: token('components-button-primary-bg'),
      colorPrimaryHover: token('components-button-primary-bg-hover'),
      colorPrimaryActive: token('components-button-primary-bg-active'),
      controlOutline: token('state-focus-10'),
      colorText: token('text-primary'),
      colorTextSecondary: token('text-secondary'),
      colorTextDisabled: token('text-disabled'),
      colorError: token('status-error'),
      colorWarning: token('status-warning'),
      colorSuccess: token('status-success'),
      colorInfo: token('status-info'),
      colorLink: token('text-accent'),
      colorLinkHover: token('text-primary'),
      colorLinkActive: token('text-primary'),
      colorBgContainer: token('background-surface'),
      colorBgContainerDisabled: token('components-input-bg-disabled'),
      colorBgElevated: token('components-dropdown-bg'),
      colorBgLayout: token('components-app-shell-bg'),
      colorBorder: token('border-default'),
      colorBorderSecondary: token('border-default'),
      controlItemBgHover: token('state-hover'),
      controlItemBgActive: token('state-selected-bg'),
      borderRadius:
        preset === 'graphite' || preset === 'mist'
          ? 6
          : preset === 'ocean'
            ? 12
            : preset === 'paper'
              ? 8
              : 10,
      // radius-sm for chips and radius-xl for popups, panels and dialogs.
      borderRadiusSM: Math.max(2, PRESET_RADIUS[preset] - 4),
      borderRadiusLG: PRESET_RADIUS[preset] + 4,
      // Same levels as shadow-elevation-*: overlays medium, dialogs high.
      boxShadow: 'var(--elevation-high)',
      boxShadowSecondary: 'var(--elevation-medium)',
      boxShadowTertiary: 'var(--elevation-low)',
      fontSize: 14 * appearance.textScale,
      // Matches --control-height* in appearance.css (Mist is one step smaller).
      ...(() => {
        const [sm, md, lg] =
          preset === 'mist'
            ? appearance.density === 'compact'
              ? [24, 28, 32]
              : [28, 32, 40]
            : appearance.density === 'compact'
              ? [28, 32, 40]
              : [32, 40, 48]
        return {
          controlHeight: md * appearance.textScale,
          controlHeightSM: sm * appearance.textScale,
          controlHeightLG: lg * appearance.textScale,
        }
      })(),
      motion: appearance.motion !== 'reduced' && !appearance.reducedMotion,
    },
    components: {
      // DreamJira rows: 36px header, 44px body rows.
      Table: {
        headerBg: token('background-surface'),
        headerColor: token('text-tertiary'),
        headerSplitColor: 'transparent',
        borderColor: token('border-default'),
        rowHoverBg: token('state-hover'),
        rowSelectedBg: token('state-selected-bg'),
        rowSelectedHoverBg: token('state-selected-bg'),
        cellPaddingBlock: 10,
        cellPaddingInline: 12,
        cellPaddingBlockSM: 6,
      },
      // A surface tooltip like ui/tooltip, not an inverted bubble.
      Tooltip: {
        colorBgSpotlight: token('components-popover-bg'),
        colorTextLightSolid: token('text-primary'),
      },
      Modal: {
        contentBg: token('components-dialog-bg'),
        headerBg: token('components-dialog-bg'),
        footerBg: token('components-dialog-bg'),
      },
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
