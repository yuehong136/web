import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { GenerationPresetType } from '@/constants/llm'
import { createInitialConfig } from '@/pages/studio/create-app/constants'
import {
  ModelConfig,
  type ModelConfigProps,
} from '@/pages/studio/create-app/components/model-config'

vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: () => <span>Model picker</span>,
}))
let root: Root
let container: HTMLDivElement
let props: ModelConfigProps
const fields = [
  'temperature',
  'top_p',
  'presence_penalty',
  'frequency_penalty',
  'max_tokens',
] as const
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  props = {
    config: createInitialConfig({}),
    models: {},
    loading: false,
    preset: GenerationPresetType.Balance,
    onChange: vi.fn(),
    onPresetChange: vi.fn(),
    onSettingChange: vi.fn(),
  }
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const render = () => act(async () => root.render(<ModelConfig {...props} />))
describe('generation defaults', () => {
  it('shows model defaults instead of claiming a preset is active without overrides', async () => {
    fields.forEach((field) => {
      props.config.llm_setting[`${field}_enabled`] = false
    })
    await render()
    expect(
      container
        .querySelector('[value="model-default"][role="radio"]')
        ?.getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      container
        .querySelector('[value="balance"][role="radio"]')
        ?.getAttribute('aria-checked'),
    ).toBe('false')
  })
  it('switches to defaults by disabling overrides without replacing their dormant values', async () => {
    fields.forEach((field) => {
      props.config.llm_setting[`${field}_enabled`] = true
    })
    const values = structuredClone(props.config.llm_setting)
    await render()
    await act(async () =>
      (
        container.querySelector(
          '[value="model-default"][role="radio"]',
        ) as HTMLButtonElement
      ).click(),
    )
    expect(props.onSettingChange).toHaveBeenCalledTimes(5)
    for (const field of fields)
      expect(props.onSettingChange).toHaveBeenCalledWith(
        `${field}_enabled`,
        false,
      )
    expect(props.config.llm_setting).toEqual(values)
    expect(props.onPresetChange).not.toHaveBeenCalled()
  })
})
