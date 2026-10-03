import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiKeyModal } from '../api-key-modal'
import { PADDLEOCR_ALGORITHMS } from '../paddleocr-config'
import i18n from '@/locales/i18n'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let container: HTMLDivElement
const save = vi.fn()
const verify = vi.fn()
const close = vi.fn()
const render = async (isOpen = true) => {
  await act(async () =>
    root.render(
      <ApiKeyModal
        isOpen={isOpen}
        providerName="PaddleOCR"
        onSave={save}
        onVerify={verify}
        onClose={close}
      />,
    ),
  )
}
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === text,
  )!
const field = (label: string) => {
  const element = Array.from(document.querySelectorAll('label')).find(
    (element) => element.textContent === label,
  )!
  return document.getElementById(element.htmlFor) as HTMLInputElement
}
const change = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const algorithmTrigger = () =>
  document.querySelector<HTMLButtonElement>('[id$="-algorithm"]')!
const select = async (algorithm: string) => {
  await act(async () => algorithmTrigger().click())
  const options = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button'),
  ).filter(
    (element) =>
      element !== algorithmTrigger() &&
      PADDLEOCR_ALGORITHMS.some((value) => value === element.textContent),
  )
  expect(options.map((element) => element.textContent)).toEqual([
    ...PADDLEOCR_ALGORITHMS,
  ])
  await act(async () =>
    options.find((element) => element.textContent === algorithm)!.click(),
  )
}
beforeEach(async () => {
  vi.clearAllMocks()
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }))
  save.mockResolvedValue(undefined)
  verify.mockResolvedValue({
    isValid: true,
    logs: 'Sensitive upstream token detail',
  })
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

for (const algorithm of PADDLEOCR_ALGORITHMS) {
  it(`submits ${algorithm} from the real model dialog`, async () => {
    await render()
    expect(algorithmTrigger().textContent).toContain('PaddleOCR-VL')
    await change(field('Model name (required)'), ' model ')
    await select(algorithm)
    const endpoint = algorithm === 'PP-OCRv5' ? '/ocr' : '/layout-parsing'
    expect(field('Inference URL (required)').placeholder).toMatch(
      new RegExp(`${endpoint}$`),
    )
    await change(
      field('Inference URL (required)'),
      ` https://service.example${endpoint} `,
    )
    const token = field('AI Studio access token (optional)')
    expect(token.type).toBe('password')
    await change(token, ' test-token ')
    await act(async () => button('Save').click())
    expect(save).toHaveBeenCalledExactlyOnceWith('', undefined, {
      llm_factory: 'PaddleOCR',
      llm_name: 'model',
      mdl_type: 'ocr',
      max_tokens: 0,
      api_base: '',
      api_key: {
        paddleocr_api_url: `https://service.example${endpoint}`,
        paddleocr_access_token: 'test-token',
        paddleocr_algorithm: algorithm,
      },
    })
    expect(close).toHaveBeenCalledOnce()
  })
}

it('validates fields, keeps a failed draft, and resets on reopening', async () => {
  await render()
  await act(async () => button('Save').click())
  expect(save).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Enter a model name.')
  await change(field('Model name (required)'), 'draft')
  await act(async () => button('Save').click())
  expect(save).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain(
    'Enter the complete PaddleOCR inference URL.',
  )
  await change(field('Inference URL (required)'), 'not-a-url')
  await act(async () => button('Save').click())
  expect(save).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain(
    'Enter a complete HTTP or HTTPS inference URL.',
  )
  await change(field('Inference URL (required)'), 'https://service.example/ocr')
  await select('PP-OCRv5')
  save.mockRejectedValueOnce(new Error('Sensitive token failure'))
  await act(async () => button('Save').click())
  expect(close).not.toHaveBeenCalled()
  expect(field('Model name (required)').value).toBe('draft')
  expect(document.body.textContent).toContain('Could not save the model.')
  expect(document.body.textContent).not.toContain('Sensitive token failure')
  await render(false)
  await render()
  expect(field('Model name (required)').value).toBe('')
  expect(algorithmTrigger().textContent).toBe('PaddleOCR-VL')
})

it('shows configuration validation with its inference boundary and translates the dialog', async () => {
  await render()
  await change(field('Model name (required)'), 'model')
  await change(
    field('Inference URL (required)'),
    'https://service.example/layout-parsing',
  )
  await act(async () => button('Validate configuration').click())
  expect(verify).toHaveBeenCalledOnce()
  expect(save).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Configuration is valid')
  expect(document.body.textContent).toContain(
    'It does not verify service connectivity',
  )
  expect(document.body.textContent).not.toContain(
    'Sensitive upstream token detail',
  )
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(document.body.textContent).toContain('配置校验通过')
  expect(document.body.textContent).toContain('此选择不会改变服务端部署')
  expect(field('AI Studio 访问令牌（可选）').type).toBe('password')
  expect(button('保存')).toBeTruthy()
})

it('explains both service protocols and keeps a cloud URL when switching algorithms', async () => {
  await render()
  const apiUrl = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs'
  expect(document.body.textContent).toContain(
    '/layout-parsing for a self-hosted synchronous service',
  )
  expect(document.body.textContent).toContain(apiUrl)
  await change(field('Model name (required)'), 'cloud-model')
  await change(field('Inference URL (required)'), apiUrl)
  expect(
    field('AI Studio access token (required)').getAttribute('aria-required'),
  ).toBe('true')
  expect(field('AI Studio access token (required)').type).toBe('password')
  await act(async () => button('Save').click())
  expect(save).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain(
    'Enter an access token for the cloud Job API.',
  )
  await change(field('AI Studio access token (required)'), ' fixture-token ')
  await select('PP-OCRv5')
  expect(field('Inference URL (required)').value).toBe(apiUrl)
  expect(document.body.textContent).toContain(
    '/ocr for a self-hosted synchronous service',
  )
  expect(document.body.textContent).toContain(
    'The cloud service requires an AI Studio access token.',
  )
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(document.body.textContent).toContain('自托管同步服务使用 /ocr')
  expect(document.body.textContent).toContain('官方云 Job API 使用')
  expect(document.body.textContent).toContain(
    '校验仅检查配置，不验证服务连通性、访问令牌或推理结果。',
  )
  await act(async () => button('保存').click())
  expect(save).toHaveBeenCalledExactlyOnceWith('', undefined, {
    llm_factory: 'PaddleOCR',
    llm_name: 'cloud-model',
    mdl_type: 'ocr',
    max_tokens: 0,
    api_base: '',
    api_key: {
      paddleocr_api_url: apiUrl,
      paddleocr_algorithm: 'PP-OCRv5',
      paddleocr_access_token: 'fixture-token',
    },
  })
})
