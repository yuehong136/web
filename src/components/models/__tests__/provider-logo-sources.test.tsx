import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  ProviderIcon,
  getLobeProviderIconKey,
  resolveProviderLogo,
} from '@/components/ui/provider-icon'
import deepSeekLogo from '@lobehub/icons-static-svg/icons/deepseek-color.svg?url&no-inline'
import kimiLogo from '@lobehub/icons-static-svg/icons/kimi.svg?url&no-inline'
import moonshotLogo from '@lobehub/icons-static-svg/icons/moonshot.svg?url&no-inline'
import siliconCloudLogo from '@lobehub/icons-static-svg/icons/siliconcloud-color.svg?url&no-inline'
import vertexAiLogo from '@lobehub/icons-static-svg/icons/vertexai-color.svg?url&no-inline'

let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('maps provider spellings to @lobehub icon keys', () => {
  expect(getLobeProviderIconKey('SiliconFlow')).toBe('siliconcloud')
  expect(getLobeProviderIconKey('SiliconCloud')).toBe('siliconcloud')
  expect(getLobeProviderIconKey('Moonshot AI')).toBe('kimi')
  expect(getLobeProviderIconKey('Kimi')).toBe('kimi')
  expect(getLobeProviderIconKey('Tongyi')).toBe('qwen')
  expect(getLobeProviderIconKey('Vertex AI')).toBe('vertexai')
  expect(getLobeProviderIconKey('Claude')).toBe('claude')
  expect(getLobeProviderIconKey('constructor')).toBeNull()
  expect(getLobeProviderIconKey('通义千问')).toBeNull()
  expect(getLobeProviderIconKey('Unknown Corp')).toBeNull()
})

it('keeps our own logos first and falls back to @lobehub marks', () => {
  // Our SVGs win for known providers, aliases or not; the providers the
  // retired sprite drew now reach their @lobehub successor.
  expect(resolveProviderLogo('BAAI')).toMatchObject({ kind: 'image' })
  expect((resolveProviderLogo('BAAI') as { url: string }).url).toContain(
    'baai.svg',
  )
  expect(resolveProviderLogo('SILICONFLOW')).toEqual({
    kind: 'image',
    url: siliconCloudLogo,
  })
  expect(resolveProviderLogo('Moonshot')).toEqual({
    kind: 'mask',
    url: moonshotLogo,
  })
  // Names we lack resolve through the alias before any substring guess.
  expect(resolveProviderLogo('SiliconCloud')).toEqual({
    kind: 'image',
    url: siliconCloudLogo,
  })
  expect(resolveProviderLogo('Kimi')).toEqual({ kind: 'mask', url: kimiLogo })
  expect(resolveProviderLogo('Vertex AI')).toEqual({
    kind: 'image',
    url: vertexAiLogo,
  })
  // Loose matching still covers variants of known providers.
  expect(resolveProviderLogo('deepseek-chat')).toEqual({
    kind: 'image',
    url: deepSeekLogo,
  })
  expect(resolveProviderLogo('Unknown Corp')).toBeNull()
})

it('renders single-color marks as a labelled mask in the text color', async () => {
  await act(async () => root.render(<ProviderIcon provider="Kimi" />))
  const logo = container.querySelector('[data-slot="provider-logo-mask"]')!
  expect(logo.getAttribute('role')).toBe('img')
  expect(logo.getAttribute('aria-label')).toBe('Kimi')
  const mark = logo.querySelector<HTMLElement>('[aria-hidden]')!
  expect(mark.className).toContain('bg-current')
  expect(mark.style.getPropertyValue('mask')).toContain(kimiLogo)
  await act(async () => root.render(<ProviderIcon provider="Claude" />))
  expect(container.querySelector('img')?.getAttribute('alt')).toBe('Claude')
  await act(async () => root.render(<ProviderIcon provider="Unknown Corp" />))
  expect(container.querySelector('svg.lucide-boxes')).not.toBeNull()
})
