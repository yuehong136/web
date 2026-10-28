import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { projectTenantModels } from '@/api/llm'
import type { TenantModel } from '@/api/llm-provider-types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { GenerationPresetType } from '@/constants/llm'
import { createInitialConfig } from '@/pages/studio/create-app/constants'
import {
  ModelConfig,
  type ModelConfigProps,
} from '@/pages/studio/create-app/components/model-config'

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
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
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
const render = () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <ModelConfig {...props} />
      </MemoryRouter>,
    ),
  )
describe('selected model presentation', () => {
  let models: TenantModel[]
  beforeEach(() => {
    models = [102, 103].map((id) => ({
      id,
      reference: String(id),
      name: 'gpt-test',
      provider_id: 'openai',
      provider_name: 'OpenAI',
      instance_id: `instance-${id}`,
      instance_name: id === 102 ? 'primary' : 'backup',
      model_types: ['chat'],
      status: 'active',
      effective_status: 'active',
      max_tokens: 8192,
      is_tools: false,
    }))
    props.models = projectTenantModels(models)
  })

  it('displays the model and instance label for a numeric ID and keeps IDs on selection', async () => {
    props.config.llm_id = '102'
    await render()
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-haspopup="dialog"]',
    )!
    expect(trigger.textContent).toBe('gpt-test · primary')
    await act(async () => trigger.click())
    const option = Array.from(
      document.querySelectorAll<HTMLElement>('[cmdk-item]'),
    ).find((item) => item.getAttribute('data-value') === '103')!
    await act(async () => option.click())
    expect(props.onChange).toHaveBeenCalledWith('llm_id', '103')
    props.config.llm_id = '103'
    await render()
    expect(trigger.textContent).toBe('gpt-test · backup')
  })

  it('resolves legacy names and marks their canonical option as selected', async () => {
    props.models = projectTenantModels([models[0]])
    props.config.llm_id = 'gpt-test@OpenAI'
    await render()
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-haspopup="dialog"]',
    )!
    expect(trigger.textContent).toBe('gpt-test')
    await act(async () => trigger.click())
    const option = document.querySelector<HTMLElement>(
      '[cmdk-item][data-value="102"]',
    )!
    expect(option.querySelector('svg.lucide-check')).not.toBeNull()
  })

  it('hides the default instance in both the trigger and menu when no usable alternative exists', async () => {
    models[0].instance_name = 'default'
    models[1].effective_status = 'inactive'
    props.models = projectTenantModels(models)
    props.config.llm_id = '102'
    await render()
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-haspopup="dialog"]',
    )!
    expect(trigger.textContent).toBe('gpt-test')
    await act(async () => trigger.click())
    expect(
      document.querySelector('[cmdk-item][data-value="102"]')?.textContent,
    ).toBe('gpt-testChat')
    expect(document.querySelector('[cmdk-item][data-value="103"]')).toBeNull()
    expect(props.onChange).not.toHaveBeenCalled()
  })

  it('retains an unavailable model reference without choosing a different model', async () => {
    props.config.llm_id = 'removed-model@OpenAI'
    await render()
    expect(
      container.querySelector('[aria-haspopup="dialog"]')?.textContent,
    ).toBe('removed-model · Unavailable')
    expect(props.onChange).not.toHaveBeenCalled()
  })
})
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
