import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiKeyModal } from '../api-key-modal'
import { ModelProvidersPage } from '../../index'
import {
  buildLocalModelParams,
  getEditableModelName,
} from '../api-key-modal-utils'
import type { MyLLMModel } from '@/stores/model'
import i18n from '@/locales/i18n'

const modelHooks = vi.hoisted(() => ({
  fetch: vi.fn(),
  add: vi.fn(),
  setKey: vi.fn(),
  enable: vi.fn(),
  deleteFactory: vi.fn(),
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: modelHooks.fetch,
  useAddLLM: () => ({ addLLM: modelHooks.add }),
  useSetApiKey: () => ({ setApiKey: modelHooks.setKey }),
  useEnableLLM: () => ({ enableLlm: modelHooks.enable }),
  useDeleteFactory: () => ({ deleteFactory: modelHooks.deleteFactory }),
}))
vi.mock('../system-setting', () => ({ SystemSetting: () => null }))
vi.mock('../available-models', () => ({ AvailableModels: () => null }))

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
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

it('opens the configured model through the page and saves the changed capability', async () => {
  modelHooks.fetch.mockReturnValue({
    myLLMs: { Ollama: { tags: 'LLM', llm: [existing] } },
    isLoading: false,
  })
  modelHooks.add.mockResolvedValue(undefined)
  await act(async () => root.render(<ModelProvidersPage />))
  expect(modelHooks.fetch).toHaveBeenCalledWith({ includeDetails: true })
  const provider = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button'),
  ).find((button) => button.textContent === 'Ollama')!
  await act(async () => provider.click())
  const edit = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Edit: fixture"]',
  )!
  expect(edit).not.toBeNull()
  await act(async () => edit.click())
  expect(tools().getAttribute('aria-checked')).toBe('true')
  expect(field('local-model-url').value).toBe(existing.api_base)
  await act(async () => tools().click())
  await submit()
  expect(modelHooks.add).toHaveBeenCalledOnce()
  const [payload, verify] = modelHooks.add.mock.calls[0]
  expect(verify).toBe(false)
  expect(payload).toMatchObject({
    llm_factory: 'Ollama',
    llm_name: 'fixture',
    is_tools: false,
  })
  expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty('api_key')
})
