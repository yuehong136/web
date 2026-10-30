import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiKeyModal } from '../api-key-modal'
import { buildInstancePayload } from '../instance-payload'
import {
  buildLocalModelParams,
  getEditableModelName,
} from '../api-key-modal-utils'
import type { MyLLMModel } from '@/stores/model'
import i18n from '@/locales/i18n'
import { useAuthStore } from '@/stores/auth'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let native: ReturnType<typeof stubNativeDialog>
let root: Root
let container: HTMLDivElement
const save = vi.fn()
const close = vi.fn()
const render = async (initialValues?: MyLLMModel, isOpen = true) => {
  await act(async () =>
    root.render(
      <ApiKeyModal
        isOpen={isOpen}
        providerName="Ollama"
        onSave={save}
        onClose={close}
        initialValues={initialValues}
      />,
    ),
  )
}
const field = (id: string) => document.getElementById(id) as HTMLInputElement
const tools = () =>
  document.getElementById('local-model-tools') as HTMLButtonElement
const change = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const submit = async () => {
  const button = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button'),
  ).find((element) => element.textContent === i18n.t('common.save'))!
  await act(async () => button.click())
}
const existing: MyLLMModel = {
  name: 'fixture',
  type: 'chat',
  used_token: 0,
  api_base: 'http://fixture.invalid:11434',
  max_tokens: 4096,
  is_tools: true,
}

beforeEach(async () => {
  native = stubNativeDialog()
  vi.clearAllMocks()
  save.mockResolvedValue(undefined)
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }))
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {},
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await i18n.changeLanguage('en-US')
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  native.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('defaults Ollama to chat and sends explicit false for a new model', async () => {
  await render()
  expect(tools().getAttribute('aria-checked')).toBe('false')
  await change(field('local-model-name'), ' fixture ')
  await submit()
  expect(save.mock.calls[0][2]).toMatchObject({
    llm_factory: 'Ollama',
    llm_name: 'fixture',
    mdl_type: 'chat',
    is_tools: false,
  })
  expect(save.mock.calls[0][2]).not.toHaveProperty('api_key')
})

it('loads saved capability, lets it be disabled and omits a blank credential', async () => {
  await render(existing)
  expect(tools().getAttribute('aria-checked')).toBe('true')
  expect(field('local-model-key').value).toBe('')
  expect(field('local-model-name').disabled).toBe(true)
  await act(async () => tools().click())
  await submit()
  expect(save.mock.calls[0][2]).toEqual({
    llm_factory: 'Ollama',
    llm_name: 'fixture',
    mdl_type: 'chat',
    api_base: existing.api_base,
    max_tokens: 4096,
    is_tools: false,
  })
  await render(undefined, false)
  await render({ ...existing, is_tools: false })
  expect(tools().getAttribute('aria-checked')).toBe('false')
})

it('preserves omitted versus false when editing an untouched capability', async () => {
  expect(getEditableModelName('fixture___model', 'Ollama')).toBe(
    'fixture___model',
  )
  expect(getEditableModelName('fixture___model___VLLM', 'VLLM')).toBe(
    'fixture___model',
  )
  await render({ ...existing, is_tools: false })
  await submit()
  expect(save.mock.calls[0][2]).not.toHaveProperty('is_tools')
  expect(save.mock.calls[0][2]).not.toHaveProperty('api_key')
})

it('sends no tool flag for embedding, including after a previous chat selection', async () => {
  await render({ ...existing, type: 'embedding' })
  expect(tools()).toBeNull()
  await submit()
  expect(save.mock.calls[0][2]).toMatchObject({ mdl_type: 'embedding' })
  expect(save.mock.calls[0][2]).not.toHaveProperty('is_tools')
  const values = {
    providerName: 'Ollama',
    modelName: 'fixture',
    modelType: 'image2text',
    vision: false,
    apiKey: '',
    baseUrl: 'http://fixture.invalid',
    maxTokens: 8192,
    isTools: true,
    includeTools: true,
  }
  expect(buildLocalModelParams(values)).toHaveProperty('is_tools', true)
  expect(
    buildLocalModelParams({ ...values, modelType: 'embedding' }),
  ).not.toHaveProperty('is_tools')
})

it('translates the tool field and associates its label and description', async () => {
  await i18n.changeLanguage('zh-CN')
  await render(existing)
  const label = document.querySelector('label[for="local-model-tools"]')!
  expect(label.textContent).toBe('启用工具调用')
  expect(
    document.getElementById(tools().getAttribute('aria-describedby')!)
      ?.textContent,
  ).toContain('原生工具调用')
  await act(async () => i18n.changeLanguage('en-US'))
  expect(label.textContent).toBe('Enable tool calls')
})

it('keeps the changed capability when save fails', async () => {
  save.mockRejectedValueOnce(new Error('fixture failure'))
  await render(existing)
  await act(async () => tools().click())
  await submit()
  expect(tools().getAttribute('aria-checked')).toBe('false')
  expect(close).not.toHaveBeenCalled()
})

it('keeps credential envelopes, explicit empty catalogs and legal zero when creating an instance', () => {
  const result = buildInstancePayload(
    'VolcEngine',
    ' primary ',
    '',
    'https://fixture.invalid',
    {
      llm_name: 'custom',
      mdl_type: 'chat',
      max_tokens: 0,
      is_tools: false,
      endpoint_id: 'ep-fixture',
      ark_api_key: 'synthetic',
      custom_extension: [],
    },
    '',
  )
  expect(result.instance).toMatchObject({
    instance_name: 'primary',
    region: '',
    model_ids: [],
  })
  expect(JSON.parse(result.instance.api_key)).toMatchObject({
    endpoint_id: 'ep-fixture',
    ark_api_key: 'synthetic',
    custom_extension: [],
  })
  expect(result.instance.custom_model).toEqual({
    model_name: 'custom',
    model_types: ['chat'],
    max_tokens: 0,
    is_tools: false,
  })
  expect(
    buildInstancePayload('OpenAI', 'other', 'synthetic', undefined, {}, '')
      .instance,
  ).not.toHaveProperty('model_ids')
  for (const max_tokens of [-1, NaN, Infinity, '0'])
    expect(() =>
      buildInstancePayload(
        'Ollama',
        'a',
        '',
        undefined,
        { llm_name: 'x', max_tokens },
        '',
      ),
    ).toThrow()
})

it.each([
  ['en-US', 'Model ID', 'Enter a Model ID.'],
  ['zh-CN', '模型 ID', '请输入模型 ID。'],
])(
  'uses the localized VolcEngine Model ID and preserves endpoint_id payload in %s',
  async (language, label, required) => {
    await i18n.changeLanguage(language)
    await act(async () =>
      root.render(
        <ApiKeyModal
          isOpen
          providerName="VolcEngine"
          onSave={save}
          onClose={close}
        />,
      ),
    )
    const modelId = field('volc-model-id')
    expect(
      document.querySelector('label[for="volc-model-id"]')?.textContent,
    ).toContain(label)
    expect(modelId.placeholder).toBe(required)
    await change(
      document.querySelector<HTMLInputElement>('input[id$="-modelName"]')!,
      'owned-display-name',
    )
    await act(async () => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button'),
      ).find((element) => element.textContent === i18n.t('common.save'))!
      button.click()
    })
    expect(save).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(required)
    await change(modelId, 'provider-model-id')
    await change(
      document.querySelector<HTMLInputElement>('input[id$="-apiKey"]')!,
      'owned-ark-key',
    )
    await act(async () => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button'),
      ).find((element) => element.textContent === i18n.t('common.save'))!
      button.click()
    })
    expect(save.mock.calls[0][2]).toMatchObject({
      llm_factory: 'VolcEngine',
      llm_name: 'owned-display-name',
      endpoint_id: 'provider-model-id',
      api_key: 'owned-ark-key',
    })
    expect(save.mock.calls[0][2]).not.toHaveProperty('model_id')
  },
)

it('keeps both chat and vision when creating a local model and clears vision after switching type', async () => {
  await render()
  await change(field('local-model-name'), ' vision-fixture ')
  await act(async () => document.getElementById('local-model-vision')!.click())
  await submit()
  const fields = save.mock.calls[0][2]
  const payload = buildInstancePayload(
    'Ollama',
    'vision',
    '',
    undefined,
    fields,
    '',
  )
  expect(payload.instance.custom_model?.model_types).toEqual([
    'chat',
    'image2text',
  ])
  const values = {
    providerName: 'Ollama',
    modelName: 'fixture',
    modelType: 'chat',
    vision: true,
    apiKey: '',
    baseUrl: 'http://fixture.invalid',
    maxTokens: 0,
    isTools: false,
    includeTools: true,
  }
  for (const modelType of ['chat', ['chat'], ['chat', 'image2text', 'chat']]) {
    const result = buildLocalModelParams({ ...values, modelType })
    expect(
      buildInstancePayload('Ollama', 'vision', '', undefined, result, '')
        .instance.custom_model?.model_types,
    ).toEqual(['chat', 'image2text'])
  }
  expect(
    buildLocalModelParams({ ...values, modelType: 'embedding' }).mdl_type,
  ).toBe('embedding')
  expect(buildLocalModelParams({ ...values, vision: false }).mdl_type).toBe(
    'chat',
  )
})

it('keeps legal zero in the custom cloud-model form', async () => {
  await act(async () =>
    root.render(
      <ApiKeyModal
        isOpen
        providerName="Anthropic"
        onSave={save}
        onClose={close}
      />,
    ),
  )
  await change(
    document.querySelector<HTMLInputElement>('input[id$="-apiKey"]')!,
    'synthetic',
  )
  await change(document.querySelector('input[id$="-modelName"]')!, 'custom')
  await change(document.querySelector('input[type="number"]')!, '0')
  await act(async () =>
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent === i18n.t('common.save'))!
      .click(),
  )
  expect(save.mock.calls[0][2].max_tokens).toBe(0)
})

it('clears manual credentials when the authentication owner changes', async () => {
  const originalUser = useAuthStore.getState().user
  try {
    await render()
    await change(field('local-model-name'), 'private-model')
    await change(field('local-model-key'), 'private-key')
    await act(async () =>
      useAuthStore.setState({
        user: {
          id: 'new-owner',
          tenant_id: 'new-tenant',
          email: 'fixture@example.test',
          nickname: 'Fixture',
          username: 'fixture',
          is_active: true,
          created_at: '',
          updated_at: '',
          roles: [],
          permissions: [],
        },
      }),
    )
    expect(field('local-model-name').value).toBe('')
    expect(field('local-model-key').value).toBe('')
    expect(save).not.toHaveBeenCalled()
  } finally {
    await act(async () => useAuthStore.setState({ user: originalUser }))
  }
})

it('allows multiple manual capabilities and retains zero through the rendered form', async () => {
  await render()
  await change(field('local-model-name'), 'multi')
  const embedding = [
    ...document.querySelectorAll<HTMLButtonElement>('#local-model-type button'),
  ].find((button) => button.parentElement?.textContent === 'Embedding')!
  await act(async () => embedding.click())
  await change(field('local-model-tokens'), '0')
  await submit()
  expect(save.mock.calls[0][2]).toMatchObject({
    mdl_type: 'chat,embedding',
    max_tokens: 0,
  })
})
