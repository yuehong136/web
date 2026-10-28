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
import { modelSelectOption } from '../model-select-options'
import {
  ProviderIcon,
  getProviderIconName,
  getProviderIconPath,
} from '@/components/ui/provider-icon'
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
it('resolves every mapped provider to an existing SVG or sprite symbol in both themes', () => {
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
it.each(['Astraflow', 'Astraflow-CN', 'FuturMix', 'Grok'])(
  'renders the upstream logo for %s',
  async (provider) => {
    await act(async () => root.render(<ProviderIcon provider={provider} />))
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(provider)
    expect(container.querySelector('svg.lucide-boxes')).toBeNull()
  },
)
it('uses the correct assets for provider aliases and theme variants', () => {
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
  expect(container.textContent).toContain('missing@DeepSeek')
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
