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
