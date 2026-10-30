import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import { ProviderRegionField } from '../provider-region-field'
import { act, StrictMode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModelProvidersPage } from '../../index'
import { modelProvidersAPI } from '@/api/llm-providers'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiKeyModal } from '../api-key-modal'
import { PADDLEOCR_ALGORITHMS } from '../paddleocr-config'
import { setProductLanguage } from '@/locales/i18n'

vi.mock('../system-setting', () => ({ SystemSetting: () => null }))
vi.mock('../used-models', () => ({ UsedModels: () => null }))
vi.mock('../available-models', () => ({
  AvailableModels: ({
    handleAddModel,
  }: {
    handleAddModel: (provider: string) => void
  }) => (
    <button onClick={() => handleAddModel('PaddleOCR')}>Add fixture</button>
  ),
}))

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let native: ReturnType<typeof stubNativeDialog>
let root: Root
let container: HTMLDivElement
const save = vi.fn()
const verify = vi.fn()
const close = vi.fn()
const render = async (isOpen = true, providerName = 'PaddleOCR') => {
  await act(async () =>
    root.render(
      <StrictMode>
        <ApiKeyModal
          isOpen={isOpen}
          providerName={providerName}
          onSave={save}
          onVerify={verify}
          onClose={close}
        />
      </StrictMode>,
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
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  )
  expect(options.map((element) => element.textContent)).toEqual([
    ...PADDLEOCR_ALGORITHMS,
  ])
  await act(async () =>
    options.find((element) => element.textContent === algorithm)!.click(),
  )
}
beforeEach(async () => {
  native = stubNativeDialog()
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
  await setProductLanguage('en-US')
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  native.restore()
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

it('shows connection validation with its inference boundary and translates the dialog', async () => {
  await render()
  await change(field('Model name (required)'), 'model')
  await change(
    field('Inference URL (required)'),
    'https://service.example/layout-parsing',
  )
  await act(async () => button('Test connection').click())
  expect(verify).toHaveBeenCalledOnce()
  expect(save).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Connection verified')
  expect(document.body.textContent).toContain('sample inference')
  expect(document.body.textContent).not.toContain(
    'Sensitive upstream token detail',
  )
  await act(async () => setProductLanguage('zh-CN'))
  expect(document.body.textContent).toContain('连接验证通过')
  expect(document.body.textContent).toContain('此选择不会改变服务端部署')
  expect(field('AI Studio 访问令牌（可选）').type).toBe('password')
  expect(button('保存')).toBeTruthy()
})

it('reveals portal feedback in its scroll area and cancels queued work when dismissed', async () => {
  const frames = new Map<number, FrameRequestCallback>()
  let sequence = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback)
    return sequence
  })
  const cancel = vi.fn((id: number) => frames.delete(id))
  vi.stubGlobal('cancelAnimationFrame', cancel)
  await render()
  for (const [id, callback] of frames) {
    callback(0)
    frames.delete(id)
  }
  const area = document.querySelector('dialog fieldset') as HTMLFieldSetElement
  Object.defineProperty(area, 'scrollHeight', { value: 900 })
  await act(async () => button('Save').click())
  expect(frames.size).toBe(1)
  frames.get(sequence)!(0)
  frames.delete(sequence)
  expect(area.scrollTop).toBe(900)
  await change(field('Model name (required)'), 'model')
  await change(field('Inference URL (required)'), 'https://service.example/ocr')
  await change(field('AI Studio access token (optional)'), 'synthetic-draft')
  await act(async () => button('Test connection').click())
  expect(frames.size).toBe(1)
  expect(field('AI Studio access token (optional)').value).toBe(
    'synthetic-draft',
  )
  const frame = sequence
  await render(false)
  expect(cancel).toHaveBeenCalledWith(frame)
  expect(frames.has(frame)).toBe(false)
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
  await act(async () => setProductLanguage('zh-CN'))
  expect(document.body.textContent).toContain('自托管同步服务使用 /ocr')
  expect(document.body.textContent).toContain('官方云 Job API 使用')
  expect(document.body.textContent).toContain(
    '连接测试会对所选模型执行一次样例推理，保存时会再次测试。',
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

const deferred = () => {
  let resolve!: (value: any) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<any>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const readyDraft = async () => {
  await render()
  await change(field('Model name (required)'), 'draft')
  await change(
    field('Inference URL (required)'),
    'https://service.example/layout-parsing',
  )
}

for (const outcome of ['resolve', 'reject'] as const) {
  it(`ignores an old save ${outcome} after closing and reopening`, async () => {
    const pending = deferred()
    save.mockReturnValueOnce(pending.promise)
    await readyDraft()
    await act(async () => button('Save').click())
    await render(false)
    await readyDraft()
    await change(field('Model name (required)'), 'new-draft')
    await act(async () =>
      pending[outcome](
        outcome === 'resolve' ? undefined : new Error('private failure'),
      ),
    )
    expect(close).not.toHaveBeenCalled()
    expect(field('Model name (required)').value).toBe('new-draft')
    expect(document.body.textContent).not.toContain('Could not save the model.')
    expect(button('Save').disabled).toBe(false)
  })
}

it('invalidates verified configuration when the real algorithm Select changes', async () => {
  await readyDraft()
  await act(async () => button('Test connection').click())
  expect(document.body.textContent).toContain('Connection verified')
  expect(save).not.toHaveBeenCalled()
  await select('PP-OCRv5')
  expect(document.body.textContent).not.toContain('Connection verified')
})

it('ignores a late verification after replacing the provider form', async () => {
  const pending = deferred()
  verify.mockReturnValueOnce(pending.promise)
  await readyDraft()
  await act(async () => button('Test connection').click())
  await act(async () =>
    root.render(
      <ApiKeyModal
        isOpen
        providerName="Ollama"
        onSave={save}
        onVerify={verify}
        onClose={close}
      />,
    ),
  )
  await change(
    document.getElementById('local-model-name') as HTMLInputElement,
    'new-provider',
  )
  await act(async () => pending.resolve({ isValid: true, logs: 'private' }))
  expect(document.body.textContent).not.toContain('Connection verified')
  expect(
    (document.getElementById('local-model-name') as HTMLInputElement).value,
  ).toBe('new-provider')
  expect(save).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
})

it('lets the real page edit a new draft while an old save is pending', async () => {
  const pending = deferred()
  vi.spyOn(modelProvidersAPI, 'createInstance').mockReturnValueOnce(
    pending.promise,
  )
  const client = new QueryClient()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ModelProvidersPage />
      </QueryClientProvider>,
    ),
  )
  await act(async () => button('Add fixture').click())
  await change(
    document.getElementById('model-instance-name') as HTMLInputElement,
    'old-instance',
  )
  await change(field('Model name (required)'), 'old-model')
  await change(
    field('Inference URL (required)'),
    'https://service.example/layout-parsing',
  )
  await act(async () => button('Save').click())
  await act(async () => button('Close').click())
  await act(async () => button('Add fixture').click())
  const name = document.getElementById(
    'model-instance-name',
  ) as HTMLInputElement
  expect(name.disabled).toBe(false)
  await change(name, 'new-instance')
  await change(field('Model name (required)'), 'new-model')
  await act(async () => pending.resolve({ id: 'created' }))
  expect(document.getElementById('model-instance-name')).toBe(name)
  expect(name.value).toBe('new-instance')
  expect(field('Model name (required)').value).toBe('new-model')
  client.clear()
})

for (const provider of [
  'OpenAI',
  'Azure-OpenAI',
  'Bedrock',
  'Fish Audio',
  'Google Cloud',
  'MinerU',
  'Tencent Cloud',
  'OpenDataLoader',
  'PaddleOCR',
  'XunFei Spark',
  'VolcEngine',
]) {
  it(`resets all ${provider} input defaults through the unified unmount boundary`, async () => {
    await render(true, provider)
    const inputs = () =>
      Array.from(document.querySelectorAll<HTMLInputElement>('dialog input'))
    expect(inputs().length).toBeGreaterThan(0)
    const initial = inputs().map((input) => ({
      type: input.type,
      value: input.value,
    }))
    for (const input of inputs()) {
      if (
        !input.disabled &&
        ['text', 'password', 'number', 'url'].includes(input.type)
      )
        await change(input, input.type === 'number' ? '1234' : 'draft-field')
    }
    await render(false, provider)
    await render(true, provider)
    expect(
      inputs().map((input) => ({ type: input.type, value: input.value })),
    ).toEqual(initial)
    expect(save).not.toHaveBeenCalled()
    expect(verify).not.toHaveBeenCalled()
  })
}

it('invalidates verification through the external Tongyi region Select without losing credentials', async () => {
  function RegionalDraft() {
    const [region, setRegion] = useState('cn')
    return (
      <ApiKeyModal
        isOpen
        providerName="Tongyi-Qianwen"
        onSave={save}
        onVerify={verify}
        onClose={close}
      >
        {(invalidate) => (
          <ProviderRegionField
            provider="Tongyi-Qianwen"
            value={region}
            onChange={(value) => {
              invalidate()
              setRegion(value)
            }}
          />
        )}
      </ApiKeyModal>
    )
  }
  await act(async () => root.render(<RegionalDraft />))
  await change(field('API key'), 'synthetic-regional-key')
  await act(async () => button('Test connection').click())
  expect(document.body.textContent).toContain('Connection verified')
  await act(async () =>
    document.getElementById('model-instance-region')!.click(),
  )
  await act(async () =>
    [...document.querySelectorAll<HTMLElement>('[role=option]')]
      .find((option) => option.textContent === 'International')!
      .click(),
  )
  expect(document.body.textContent).not.toContain('Connection verified')
  expect(field('API key').value).toBe('synthetic-regional-key')
})
