import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useForm, useWatch } from 'react-hook-form'
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Form } from '@/components/ui/form'
import { setProductLanguage } from '@/locales/i18n'
import { LayoutRecognizeFormField } from '../layout-recognize-form-field'
import { llmKeys } from '@/hooks/use-llm-request'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let container: HTMLDivElement
let client: QueryClient
let code: number
let hold: Promise<void> | undefined
let models: Record<string, unknown>
let catalog: Record<string, unknown>

function Harness({ value }: { value: string }) {
  const form = useForm({
    defaultValues: { parser_config: { layout_recognize: value } },
  })
  const current = useWatch({
    control: form.control,
    name: 'parser_config.layout_recognize',
  })
  return (
    <Form {...form}>
      <LayoutRecognizeFormField />
      <output>{current}</output>
    </Form>
  )
}

async function render(value = 'DeepDOC') {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness value={value} />
      </QueryClientProvider>,
    ),
  )
}
async function ready() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
  )
}
async function open() {
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="PDF parser"]')!
      .click(),
  )
}
async function choose(value: string) {
  await act(async () =>
    document
      .querySelector<HTMLElement>(`[cmdk-item][data-value="${value}"]`)!
      .click(),
  )
}

beforeEach(async () => {
  await setProductLanguage('en-US')
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
  code = 0
  hold = undefined
  models = {}
  catalog = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      await hold
      const path = new URL(String(input)).pathname
      expect(['/v1/llm/my_llms', '/v1/llm/list']).toContain(path)
      return new Response(
        JSON.stringify({
          code,
          message: 'Private provider failure',
          data: path.endsWith('my_llms') ? models : catalog,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      )
    }),
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  onlineManager.setOnline(true)
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
})

it('keeps paused offline inventory pending without calling it empty or marking a saved value unavailable', async () => {
  onlineManager.setOnline(false)
  await render('offline-model@Provider')
  expect(document.body.textContent).toContain('Checking configured models')
  expect(document.body.textContent).not.toContain(
    'No enabled OCR or vision models',
  )
  expect(document.body.textContent).not.toContain('saved parser is unavailable')
  expect(document.querySelector('output')?.textContent).toBe(
    'offline-model@Provider',
  )
  await act(async () => onlineManager.setOnline(true))
  await ready()
  expect(document.body.textContent).toContain('saved parser is unavailable')
})

it('withholds stale model choices after a failed refresh and retains the selected value', async () => {
  models = {
    LocalAI: {
      llm: [{ name: 'vision___LocalAI', type: 'image2text', status: '1' }],
    },
  }
  catalog = {
    LocalAI: [
      {
        llm_name: 'vision___LocalAI',
        fid: 'LocalAI',
        mdl_type: 'image2text',
        available: true,
      },
    ],
  }
  await render('vision___LocalAI@LocalAI')
  await ready()
  expect(document.body.textContent).toContain('LocalAI / vision___LocalAI')
  code = 102
  await act(async () => client.invalidateQueries({ queryKey: llmKeys.all }))
  await ready()
  expect(document.body.textContent).toContain(
    'Could not check model availability',
  )
  await open()
  expect(
    document
      .querySelector('[data-value="vision___LocalAI@LocalAI"]')
      ?.getAttribute('aria-disabled'),
  ).toBe('true')
  expect(document.body.textContent).not.toContain('Configured vision models')
  expect(document.querySelector('output')?.textContent).toBe(
    'vision___LocalAI@LocalAI',
  )
})

it('groups configured models and changes only the selected exact value, with translated search and configuration link', async () => {
  models = {
    PaddleOCR: {
      llm: ['scan@east', 'scan@west'].map((name) => ({
        name,
        type: 'ocr',
        status: '1',
      })),
    },
    LocalAI: {
      llm: [{ name: 'vision___LocalAI', type: 'image2text', status: '1' }],
    },
  }
  catalog = {
    PaddleOCR: ['scan@east', 'scan@west'].map((llm_name) => ({
      llm_name,
      fid: 'PaddleOCR',
      mdl_type: 'ocr',
      available: true,
    })),
    LocalAI: [
      {
        llm_name: 'vision___LocalAI',
        fid: 'LocalAI',
        mdl_type: 'image2text',
        available: true,
      },
    ],
  }
  await render()
  await ready()
  await open()
  expect(document.body.textContent).toContain('Configured OCR models')
  expect(document.body.textContent).toContain('Configured vision models')
  expect(
    document.querySelector('[placeholder="Search PDF parsers…"]'),
  ).not.toBeNull()
  await choose('scan@west@PaddleOCR@PaddleOCR')
  expect(document.querySelector('output')?.textContent).toBe(
    'scan@west@PaddleOCR@PaddleOCR',
  )
  expect(
    document.querySelector('[aria-label="PDF parser"] img[alt="PaddleOCR"]'),
  ).not.toBeNull()
  await open()
  await choose('vision___LocalAI@LocalAI')
  expect(document.querySelector('output')?.textContent).toBe(
    'vision___LocalAI@LocalAI',
  )
  expect(
    document.querySelector('[aria-label="PDF parser"] img[alt="LocalAI"]'),
  ).not.toBeNull()
  expect(document.body.textContent).toContain('charge for each page/image')
  const link = document.querySelector<HTMLAnchorElement>('a')!
  expect(link.getAttribute('href')).toBe('/settings/model-providers')
  expect(link.target).toBe('_blank')
  expect(link.rel).toContain('noopener')
  await act(async () => setProductLanguage('zh-CN'))
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="PDF解析器"]')!
      .click(),
  )
  expect(document.body.textContent).toContain('已配置的 OCR 模型')
  expect(
    document.querySelector('[placeholder="搜索 PDF 解析器…"]'),
  ).not.toBeNull()
  expect(document.querySelector('output')?.textContent).toBe(
    'vision___LocalAI@LocalAI',
  )
})

it('shows loading and then the empty state while core parsers remain usable', async () => {
  let release!: () => void
  hold = new Promise<void>((resolve) => {
    release = resolve
  })
  await render()
  expect(document.body.textContent).toContain('Checking configured models')
  await open()
  await choose('Plain Text')
  expect(document.querySelector('output')?.textContent).toBe('Plain Text')
  await act(async () => release())
  await ready()
  expect(document.body.textContent).toContain('No enabled OCR or vision models')
  expect(document.querySelector('output')?.textContent).toBe('Plain Text')
})

it('fails closed on HTTP 200 business errors, keeps a disabled saved value, and recovers by retry', async () => {
  code = 102
  await render('gone@PaddleOCR')
  await ready()
  expect(document.body.textContent).toContain(
    'Could not check model availability',
  )
  expect(document.body.textContent).toContain(
    'saved parser could not be checked',
  )
  expect(document.body.textContent).not.toContain('Private provider failure')
  expect(document.querySelector('output')?.textContent).toBe('gone@PaddleOCR')
  expect(
    document.querySelector('[aria-label="PDF parser"] img[alt="PaddleOCR"]'),
  ).not.toBeNull()
  await open()
  expect(
    document
      .querySelector('[data-value="gone@PaddleOCR"]')
      ?.getAttribute('aria-disabled'),
  ).toBe('true')
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  code = 0
  await act(async () =>
    [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === 'Retry')!
      .click(),
  )
  await ready()
  expect(document.body.textContent).toContain('No enabled OCR or vision models')
  expect(document.body.textContent).toContain('saved parser is unavailable')
  expect(document.querySelector('output')?.textContent).toBe('gone@PaddleOCR')
  await open()
  await choose('DeepDOC')
  expect(document.querySelector('output')?.textContent).toBe('DeepDOC')
  expect(document.body.textContent).not.toContain('saved parser is unavailable')
})
