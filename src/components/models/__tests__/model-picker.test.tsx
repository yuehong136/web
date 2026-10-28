import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { projectTenantModels } from '@/api/llm'
import type { TenantModel } from '@/api/llm-provider-types'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { InstanceModelRow } from '@/pages/settings/model-providers/components/instance-model-row'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { modelOptions, modelSelectOption } from '../model-select-options'
import {
  ProviderIcon,
  getProviderIconName,
  getProviderIconPath,
  getProviderIcon,
} from '@/components/ui/provider-icon'
import { ModelSelect } from '../model-select'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { SkillModelSelect } from '@/pages/skills/skill-model-select'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvailableModels } from '@/pages/settings/model-providers/components/available-models'
import { llmKeys } from '@/hooks/use-llm-request'
import { IconMap } from '@/stores/model'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const tenantModel = (id: number, instance: string): TenantModel => ({
  id,
  reference: String(id),
  name: 'same-model',
  provider_id: 'p',
  provider_name: 'DeepSeek',
  instance_id: instance,
  instance_name: instance,
  model_types: ['chat', 'image2text'],
  status: 'active',
  effective_status: 'active',
  is_tools: true,
  max_tokens: 0,
})
let root: Root, container: HTMLDivElement
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
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('renders bundled provider logos when their symbols are absent from iconfont', async () => {
  await act(async () => root.render(<ProviderIcon provider="BAAI" />))
  const logo = container.querySelector<HTMLImageElement>('img[alt="BAAI"]')
  expect(logo?.getAttribute('src')).toContain('baai.svg')
  expect(container.querySelector('use')).toBeNull()
})
it('resolves every mapped provider to an existing image or sprite symbol in both themes', () => {
  const sprite = readFileSync(path.resolve('public/iconfont.js'), 'utf8')
  const symbols = new Set(
    [...sprite.matchAll(/<symbol\b[^>]*\bid=["']([^"']+)["']/g)].map(
      (match) => match[1],
    ),
  )
  for (const provider of Object.keys(IconMap)) {
    for (const dark of [false, true]) {
      const url = getProviderIconPath(provider, dark)
      if (url) {
        if (provider === 'OpenDataLoader') {
          const file = readFileSync('src/assets/images/opendataloader.webp')
          expect(file.subarray(0, 4).toString()).toBe('RIFF')
          expect(file.subarray(8, 12).toString()).toBe('WEBP')
          continue
        }
        const filename = `src/assets/svg/llm/${getProviderIconName(provider, dark)}.svg`
        expect(existsSync(path.resolve(filename)), `${provider} SVG`).toBe(true)
        const separator = url.indexOf(',')
        const source = url.startsWith('data:')
          ? url.slice(0, separator).endsWith(';base64')
            ? Buffer.from(url.slice(separator + 1), 'base64').toString('utf8')
            : decodeURIComponent(url.slice(separator + 1))
          : readFileSync(path.resolve(filename), 'utf8')
        const xml = new DOMParser().parseFromString(source, 'image/svg+xml')
        expect(
          xml.querySelector('parsererror'),
          `${provider} SVG syntax`,
        ).toBeNull()
      } else {
        expect(
          symbols.has(`icon-${getProviderIconName(provider, dark)}`),
          `${provider} sprite, dark=${dark}`,
        ).toBe(true)
      }
    }
  }
})
it.each(['Astraflow', 'Astraflow-CN', 'FuturMix', 'Grok', 'Jiekou.AI'])(
  'renders the upstream logo for %s',
  async (provider) => {
    await act(async () => root.render(<ProviderIcon provider={provider} />))
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(provider)
    expect(container.querySelector('svg.lucide-boxes')).toBeNull()
  },
)
it('uses the official OpenDataLoader image in both component entry points', async () => {
  const url = getProviderIconPath('OpenDataLoader')
  expect(url).toBeTruthy()
  expect(getProviderIconPath('OpenDataLoader', true)).toBe(url)
  for (const icon of [
    <ProviderIcon provider="OpenDataLoader" key="component" />,
    getProviderIcon('OpenDataLoader'),
  ]) {
    await act(async () => root.render(icon))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(url)
    expect(container.querySelector('svg.lucide-boxes, use')).toBeNull()
  }
})
it('uses the correct assets for provider aliases and theme variants', () => {
  expect(getProviderIconName('Jiekou.AI', false)).toBe('jiekouai-bright')
  expect(getProviderIconName('Jiekou.AI', true)).toBe('jiekouai-dark')
  expect(getProviderIconPath('Jiekou.AI', false)).not.toBe(
    getProviderIconPath('Jiekou.AI', true),
  )
  expect(getProviderIconPath('Astraflow-CN')).toBe(
    getProviderIconPath('Astraflow'),
  )
  expect(getProviderIconName('siliconflow_intl')).toBe('siliconflow')
  expect(getProviderIconName('MinerU.Net', false)).toBe('mineru-bright')
  expect(getProviderIconName('MinerU.Net', true)).toBe('mineru-dark')
  expect(getProviderIconPath('MinerU.Net', false)).toBe(
    getProviderIconPath('MinerU', false),
  )
  expect(getProviderIconPath('MinerU.Net', true)).not.toBe(
    getProviderIconPath('MinerU.Net', false),
  )
})
it('keeps an explicit fallback on image failure and recovers when the resource changes', async () => {
  await act(async () => root.render(<ProviderIcon provider="Astraflow" />))
  await act(async () =>
    container.querySelector('img')!.dispatchEvent(new Event('error')),
  )
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg.lucide-boxes')).not.toBeNull()
  await act(async () => root.render(<ProviderIcon provider="FuturMix" />))
  expect(container.querySelector('img')?.getAttribute('alt')).toBe('FuturMix')
})
async function renderPicker(
  value = '102',
  onSelect = vi.fn(),
  variant: 'default' | 'compact' | 'minimal' = 'compact',
) {
  const models = projectTenantModels([
    tenantModel(102, 'primary'),
    tenantModel(103, 'backup'),
  ])
  await act(async () =>
    root.render(
      <MemoryRouter>
        <ChatModelSelector
          models={models}
          selectedModelName={value}
          onSelect={onSelect}
          variant={variant}
        />
      </MemoryRouter>,
    ),
  )
  return { onSelect, models }
}
async function open() {
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
      .click(),
  )
}
async function search(query: string) {
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, query)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
it.each(['default', 'compact', 'minimal'] as const)(
  'keeps provider logos and readable model identities in the %s trigger and menu',
  async (variant) => {
    const { onSelect } = await renderPicker('102', vi.fn(), variant)
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-haspopup="dialog"]',
    )!
    expect(trigger.textContent).toBe('same-model · primary')
    expect(trigger.querySelector('svg use')).not.toBeNull()
    await open()
    const candidates = document.querySelectorAll('[cmdk-item]')
    expect(candidates).toHaveLength(2)
    expect(candidates[0].textContent).toContain('Vision')
    expect(candidates[0].textContent).toContain('Tool calling')
    expect(candidates[0].querySelector('svg use')).not.toBeNull()
    await act(async () => (candidates[1] as HTMLElement).click())
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('103')
  },
)
it('searches model names, providers and connection names without submitting presentation text', async () => {
  const { onSelect } = await renderPicker()
  await open()
  for (const query of ['same-model', 'DeepSeek']) {
    await search(query)
    expect(document.querySelectorAll('[cmdk-item]')).toHaveLength(2)
  }
  await search('backup')
  const candidates = document.querySelectorAll('[cmdk-item]')
  expect(candidates).toHaveLength(1)
  expect(candidates[0].getAttribute('data-value')).toBe('103')
  await act(async () => (candidates[0] as HTMLElement).click())
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('103')
})
it('keeps unavailable references visible and disabled without choosing a fallback', async () => {
  const { onSelect } = await renderPicker('missing@DeepSeek')
  expect(container.textContent).toContain('missing · Unavailable')
  await open()
  const missing = document.querySelector('[data-value="missing@DeepSeek"]')!
  expect(missing.getAttribute('data-disabled')).toBe('true')
  expect(onSelect).not.toHaveBeenCalled()
})
it('offers a keyboard-focusable clear action outside the model trigger', async () => {
  const rows = projectTenantModels([tenantModel(102, 'default')])
  const onChange = vi.fn()
  await act(async () =>
    root.render(
      <SelectWithSearch
        value="102"
        options={[
          {
            label: 'DeepSeek',
            options: [modelSelectOption(rows.DeepSeek.llm[0], 'DeepSeek')],
          },
        ]}
        onChange={onChange}
        allowClear
      />,
    ),
  )
  const clear = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Clear"]',
  )!
  expect(clear).not.toBeNull()
  expect(clear.closest('[role="combobox"]')).toBeNull()
  await act(async () => clear.click())
  expect(onChange).toHaveBeenCalledExactlyOnceWith('')
  expect(document.querySelector('[cmdk-root]')).toBeNull()
})
it('localizes capabilities, moves IDs into details and preserves toggle/removal callbacks', async () => {
  await setProductLanguage('zh-CN')
  const onToggle = vi.fn(),
    onRemove = vi.fn()
  await act(async () =>
    root.render(
      <ul>
        <InstanceModelRow
          model={tenantModel(42, 'default')}
          pending={false}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      </ul>,
    ),
  )
  expect(container.textContent).toContain('对话')
  expect(container.textContent).toContain('视觉理解')
  expect(container.textContent).toContain('工具调用')
  expect(container.textContent).not.toContain('#42')
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[role="switch"]')!.click(),
  )
  expect(onToggle).toHaveBeenCalledExactlyOnceWith(false)
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!
      .click(),
  )
  expect(document.body.textContent).toContain('模型 ID：42')
  const remove = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
  ).find((el) => el.textContent === '删除')!
  await act(async () => remove.click())
  expect(onRemove).toHaveBeenCalledOnce()
})

it('distinguishes loading, failed inventory and a confirmed missing numeric reference', async () => {
  const onChange = vi.fn(),
    retry = vi.fn()
  const props = { value: '56', options: [], onChange, onRetry: retry }
  await act(async () => root.render(<ModelSelect {...props} loading />))
  expect(
    container.querySelector('output[aria-live=polite]')?.textContent,
  ).toContain('Loading models')
  expect(container.textContent).not.toContain('56')
  expect(container.textContent).not.toContain('Unavailable')
  await act(async () => root.render(<ModelSelect {...props} error />))
  expect(container.querySelector('[role=alert]')?.textContent).toContain(
    'Availability could not be confirmed',
  )
  expect(container.textContent).not.toContain('Unavailable')
  expect(
    container.querySelector<HTMLButtonElement>('[role=combobox]')?.disabled,
  ).toBe(true)
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Retry')!
      .click(),
  )
  expect(retry).toHaveBeenCalledOnce()
  await act(async () => root.render(<ModelSelect {...props} />))
  expect(container.textContent).toContain('Saved model · Unavailable')
  expect(container.textContent).not.toContain('56')
  expect(onChange).not.toHaveBeenCalled()
})
it('keeps identity and the provider logo through failure, retry and successful recovery', async () => {
  const data = projectTenantModels([tenantModel(56, 'default')])
  const props = {
    ...modelOptions(data, ['chat']),
    value: '56',
    onChange: vi.fn(),
  }
  await act(async () => root.render(<ModelSelect {...props} error />))
  expect(container.querySelector('[role=combobox]')?.textContent).toBe(
    'same-model',
  )
  expect(container.querySelector('[role=combobox] use')).not.toBeNull()
  expect(container.textContent).not.toContain('Unavailable')
  await act(async () => root.render(<ModelSelect {...props} loading />))
  expect(container.querySelector('[role=combobox]')?.textContent).toBe(
    'same-model',
  )
  await act(async () => root.render(<ModelSelect {...props} />))
  expect(
    container.querySelector<HTMLButtonElement>('[role=combobox]')?.disabled,
  ).toBe(false)
  expect(props.onChange).not.toHaveBeenCalled()
})
it('shows disabled saved models by name and logo without enabling them', async () => {
  const data = projectTenantModels([
    { ...tenantModel(56, 'default'), effective_status: 'inactive' },
  ])
  const onChange = vi.fn()
  await act(async () =>
    root.render(
      <ModelSelect
        {...modelOptions(data, ['chat'])}
        value="56"
        onChange={onChange}
      />,
    ),
  )
  expect(container.textContent).toContain('same-model · Unavailable')
  expect(container.textContent).not.toContain('56')
  expect(container.querySelector('[role=combobox] use')).not.toBeNull()
  await open()
  expect(
    document.querySelector('[data-value="56"]')?.getAttribute('data-disabled'),
  ).toBe('true')
  expect(onChange).not.toHaveBeenCalled()
})
it('uses tenant IDs as rerank values while showing names and provider logos', async () => {
  const onSelect = vi.fn()
  await act(async () =>
    root.render(
      <RerankModelSelector
        models={[
          {
            id: '56',
            llm_name: 'rerank-v3',
            fid: 'DeepSeek',
            mdl_type: 'rerank',
            available: true,
          },
        ]}
        selectedModelId="56"
        onSelect={onSelect}
      />,
    ),
  )
  expect(container.querySelector('[role=combobox]')?.textContent).toBe(
    'rerank-v3',
  )
  expect(container.querySelector('[role=combobox] use')).not.toBeNull()
  expect(onSelect).not.toHaveBeenCalled()
})
it('does not mislabel failed Skill model inventory as unavailable and preserves its reference', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(
    llmKeys.myLLMs(),
    projectTenantModels([
      {
        ...tenantModel(56, 'default'),
        name: 'embedding-3',
        model_types: ['embedding'],
      },
    ]),
  )
  const retry = vi.fn(),
    onChange = vi.fn()
  const render = async (failed: boolean) =>
    act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <SkillModelSelect
            label="Embedding"
            value="56"
            type="embedding"
            query={{
              isError: failed,
              isPending: false,
              refetch: retry,
              data: failed
                ? undefined
                : {
                    models: [
                      {
                        id: '56',
                        name: 'embedding-3',
                        provider: 'DeepSeek',
                        type: 'embedding',
                        max_tokens: 0,
                        available: false,
                        reason: 'disabled',
                      },
                    ],
                  },
            }}
            onChange={onChange}
          />
        </QueryClientProvider>,
      ),
    )
  await render(true)
  expect(container.querySelector('[role=combobox]')?.textContent).toBe(
    'embedding-3',
  )
  expect(container.querySelector('[role=combobox] use')).not.toBeNull()
  expect(container.textContent).not.toContain('Unavailable')
  expect(container.textContent).not.toContain('#56')
  await render(false)
  expect(container.textContent).toContain('embedding-3 · Unavailable')
  expect(onChange).not.toHaveBeenCalled()
  await act(async () => root.render(null))
  client.clear()
})

it('combines provider capabilities, toggles each filter, and preserves search when clearing tags', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })
  const providers = [
    { id: 'a', name: 'OpenAI', tags: 'chat,image2text', logo: '' },
    { id: 'b', name: 'DeepSeek', tags: 'chat', logo: '' },
    { id: 'c', name: 'Vision provider', tags: 'image2text', logo: '' },
    { id: 'd', name: 'Embedding provider', tags: 'embedding', logo: '' },
  ]
  client.setQueryData(llmKeys.factories(), providers)
  client.setQueryData(llmKeys.myLLMs(), {})
  const onAdd = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <AvailableModels handleAddModel={onAdd} />
      </QueryClientProvider>,
    ),
  )
  const names = () =>
    [...container.querySelectorAll('h4')].map((el) => el.textContent)
  const filter = (name: string) =>
    [
      ...container.querySelectorAll<HTMLButtonElement>('[role=group] button'),
    ].find((el) => el.textContent?.trim() === name)!
  expect(names()).toEqual(providers.map((provider) => provider.name))
  await act(async () => filter('Chat').click())
  await act(async () => filter('Vision').click())
  expect(filter('Chat').getAttribute('aria-pressed')).toBe('true')
  expect(filter('Vision').getAttribute('aria-pressed')).toBe('true')
  expect(names()).toEqual(['OpenAI'])
  await act(async () => filter('Chat').click())
  expect(names()).toEqual(['OpenAI', 'Vision provider'])
  await act(async () => filter('Vision').click())
  expect(filter('All').getAttribute('aria-pressed')).toBe('true')
  expect(names()).toHaveLength(4)
  const search = container.querySelector<HTMLInputElement>(
    'input[aria-label="Search model providers"]',
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(search, 'deep')
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(names()).toEqual(['DeepSeek'])
  await act(async () => filter('Vision').click())
  expect(names()).toEqual([])
  await act(async () => filter('All').click())
  expect(names()).toEqual(['DeepSeek'])
  expect(search.value).toBe('deep')
  expect(onAdd).not.toHaveBeenCalled()
  await act(async () => root.render(null))
  client.clear()
})
