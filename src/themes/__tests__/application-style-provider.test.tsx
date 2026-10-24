import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'
import { Bubble } from '@ant-design/x'
import { Button, Checkbox, Input, Radio, Select, Slider, Switch } from 'antd'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ApplicationStyleProvider } from '@/themes/application-style-provider'
import { buildAntdTheme } from '@/lib/antd-theme'
import { getTokenValue } from '@/lib/design-tokens'
import { APPEARANCE_PRESETS, DEFAULT_APPEARANCE } from '../appearance'

for (const isDark of [false, true]) {
  test(`keeps vendor CSS in layers in dark mode ${isDark}`, () => {
    const cache = createCache()
    renderToString(
      <StyleProvider cache={cache}>
        <ApplicationStyleProvider isDark={isDark}>
          <a href="/settings">Settings</a>
          <Button type="primary">Create</Button>
          <Input />
          <Select options={[{ value: 'all', label: 'All' }]} />
          <Checkbox defaultChecked />
          <Radio defaultChecked />
          <Switch defaultChecked />
          <Slider defaultValue={50} />
          <Bubble content="Answer" />
        </ApplicationStyleProvider>
      </StyleProvider>,
    )
    const css = extractStyle(cache, { plain: true })
    assert.ok(css.includes('@layer antd{'))
    assert.ok(css.includes('@layer antdx{'))
    // AntApp's broad anchor rule is the original source of the blue navigation.
    assert.match(css, /@layer antd\{[\s\S]*? a\{/)
  })
}
for (const mode of ['light', 'dark'] as const) {
  test(`uses ${mode} product tokens for vendor controls`, () => {
    const theme = buildAntdTheme(mode === 'dark')
    assert.equal(theme.token?.colorText, getTokenValue('text-primary', mode))
    assert.equal(theme.token?.colorLink, getTokenValue('text-accent', mode))
    assert.equal(
      theme.components?.Input?.colorBgContainer,
      getTokenValue('components-input-bg', mode),
    )
    assert.equal(
      theme.components?.Select?.optionSelectedBg,
      getTokenValue('state-selected-bg', mode),
    )
  })

  test(`separates ${mode} vendor selection controls from primary actions`, () => {
    const theme = buildAntdTheme(mode === 'dark')
    const primaryAction = getTokenValue('components-button-primary-bg', mode)
    assert.equal(theme.token?.colorPrimary, primaryAction)

    const controls = [
      [
        theme.components?.Checkbox?.colorPrimary,
        'components-checkbox-bg-checked',
      ],
      [theme.components?.Radio?.colorPrimary, 'components-radio-dot'],
      [theme.components?.Switch?.colorPrimary, 'components-switch-bg-checked'],
      [theme.components?.Slider?.trackBg, 'components-slider-range'],
    ] as const
    for (const [color, token] of controls) {
      assert.equal(color, getTokenValue(token, mode))
      assert.notEqual(
        color,
        primaryAction,
        `${token} must remain a selection color`,
      )
    }
    assert.equal(
      theme.components?.Slider?.handleActiveColor,
      getTokenValue('components-slider-thumb-border', mode),
    )
    assert.equal(
      theme.components?.Tabs?.inkBarColor,
      getTokenValue('state-selected', mode),
    )
  })
}

for (const preset of APPEARANCE_PRESETS) {
  for (const mode of ['light', 'dark'] as const) {
    test(`adapts ${preset}/${mode} fonts and interactive states for vendor controls`, () => {
      const theme = buildAntdTheme(mode === 'dark', preset, {
        ...DEFAULT_APPEARANCE,
        preset,
        mode,
        density: 'compact',
        textScale: 1.25,
      })
      const token = (name: Parameters<typeof getTokenValue>[0]) =>
        getTokenValue(name, mode, preset)
      assert.equal(theme.token?.fontFamily, 'var(--font-interface)')
      assert.equal(theme.token?.fontFamilyCode, 'var(--font-code)')
      assert.equal(theme.token?.controlHeight, 40)
      assert.equal(theme.token?.fontSize, 17.5)
      assert.equal(theme.token?.colorError, token('status-error'))
      assert.equal(theme.token?.colorWarning, token('status-warning'))
      assert.equal(theme.token?.colorSuccess, token('status-success'))
      assert.equal(theme.token?.colorInfo, token('status-info'))
      assert.equal(theme.token?.colorTextDisabled, token('text-disabled'))
      assert.equal(
        theme.token?.colorBgContainerDisabled,
        token('components-input-bg-disabled'),
      )
      assert.equal(
        theme.components?.Input?.colorTextPlaceholder,
        token('components-input-text-placeholder'),
      )
      assert.equal(
        theme.components?.Input?.activeBorderColor,
        token('components-input-border-focus'),
      )
      assert.equal(
        theme.components?.Input?.hoverBorderColor,
        token('components-input-border-hover'),
      )
      assert.equal(
        theme.components?.Select?.optionSelectedBg,
        token('state-selected-bg'),
      )
    })
  }
}
