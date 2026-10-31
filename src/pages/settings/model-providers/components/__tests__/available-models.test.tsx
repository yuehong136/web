import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AvailableModels } from '../available-models'
import {
  availableModelFilters,
  sortProviderTags,
} from '../available-model-filters'
import type { LLMFactoryInterface, MyLLMProvider } from '@/stores/model'
import i18n from '@/locales/i18n'

const mocks = vi.hoisted<{
  factories: LLMFactoryInterface[]
  myLLMs: MyLLMProvider
}>(() => ({ factories: [], myLLMs: {} }))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchFactories: () => ({ factories: mocks.factories }),
  useFetchMyLLMs: () => ({ myLLMs: mocks.myLLMs }),
}))
const factory = (name: string, tags: string): LLMFactoryInterface => ({
  name,
  tags,
  id: name,
  logo: '',
})
const factories = [
  factory('Alpha', 'LLM,LLM,TEXT EMBEDDING'),
  factory('Beta', 'LLM,TTS'),
  factory('Gamma', 'TEXT EMBEDDING'),
  factory('Configured', 'LLM,TTS'),
]
let root: Root, container: HTMLDivElement
const findButton = (text: string) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent?.replace(/\s+/g, ' ').trim() === text,
  )!
const click = async (element: HTMLElement) => act(async () => element.click())
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.factories = factories
  mocks.myLLMs = { Configured: { tags: 'LLM,TTS', llm: [] } }
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('counts provider sets once and intersects the current AND capability filter', () => {
  const duplicate = factory('Alpha', 'LLM, TTS')
  const result = availableModelFilters(
    [...factories, duplicate],
    ['Configured'],
    '',
    ['LLM'],
  )
  expect(result.searched.map((item) => item.name)).toEqual([
    'Alpha',
    'Beta',
    'Gamma',
  ])
  expect(result.filtered.map((item) => item.name)).toEqual(['Alpha', 'Beta'])
  expect(result.counts.get('LLM')).toBe(2)
  expect(result.counts.get('TEXT EMBEDDING')).toBe(1)
  expect(result.counts.get('TTS')).toBe(2)
  const both = availableModelFilters(factories, ['Configured'], '', [
    'LLM',
    'TEXT EMBEDDING',
  ])
  expect(both.filtered.map((item) => item.name)).toEqual(['Alpha'])
  expect(both.counts.get('TTS')).toBe(0)
})

it('shows zero counts for empty search results and never counts configured providers', () => {
  const empty = availableModelFilters(factories, ['Configured'], 'missing', [])
  expect(empty.searched).toEqual([])
  expect([...empty.counts.values()]).toEqual([0, 0, 0])
  const searched = availableModelFilters(factories, ['Configured'], 'BeTa', [])
  expect(searched.searched.map((item) => item.name)).toEqual(['Beta'])
  expect(searched.counts.get('LLM')).toBe(1)
  expect(searched.counts.get('TEXT EMBEDDING')).toBe(0)
})

it('orders canonical REST capabilities alongside legacy tags and keeps unknown tags last', () => {
  expect(
    sortProviderTags(
      'future,ocr,image2text,speech2text,tts,rerank,embedding,chat,ocr',
    ),
  ).toEqual([
    'chat',
    'embedding',
    'rerank',
    'tts',
    'speech2text',
    'image2text',
    'ocr',
    'future',
  ])
  expect(sortProviderTags('IMAGE2TEXT,ocr,LLM,TTS,SPEECH2TEXT')).toEqual([
    'LLM',
    'TTS',
    'SPEECH2TEXT',
    'IMAGE2TEXT',
    'ocr',
  ])
})

it('renders canonical image, speech and OCR filters in order with accessible AND counts', async () => {
  mocks.factories = [
    factory('Vision OCR', 'ocr,image2text,chat,ocr'),
    factory('Speech', 'speech2text'),
    factory('OCR only', 'ocr'),
    factory('Vision OCR', 'image2text'),
  ]
  mocks.myLLMs = {}
  await act(async () =>
    root.render(<AvailableModels handleAddModel={vi.fn()} />),
  )
  const filters = container.querySelector('fieldset')!
  const labels = [...filters.querySelectorAll('button')].map((button) =>
    button.textContent?.replace(/\s+/g, ' ').trim(),
  )
  expect(labels).toEqual([
    'All 3',
    'Chat 1',
    'Transcription 1',
    'Vision 1',
    'OCR 2',
  ])
  await click(findButton('OCR 2'))
  expect(findButton('OCR 2').getAttribute('aria-pressed')).toBe('true')
  expect(findButton('Transcription 0')).toBeDefined()
  await click(findButton('Vision 1'))
  expect(findButton('OCR 1')).toBeDefined()
  expect(container.textContent).toContain('Vision OCR')
  expect(container.textContent).not.toContain('OCR only')
  expect(container.querySelectorAll('h4')).toHaveLength(1)
})

it('renders accessible capability counts, updates AND intersections and resets with All', async () => {
  await act(async () =>
    root.render(<AvailableModels handleAddModel={vi.fn()} />),
  )
  expect(findButton('All 3').getAttribute('aria-pressed')).toBe('true')
  expect(findButton('Chat 2')).toBeDefined()
  expect(findButton('Embedding 2')).toBeDefined()
  await click(findButton('Chat 2'))
  expect(findButton('Embedding 1')).toBeDefined()
  await click(findButton('Embedding 1'))
  expect(findButton('Speech 0')).toBeDefined()
  expect(container.textContent).toContain('Alpha')
  expect(container.textContent).not.toContain('Gamma')
  expect(container.textContent).not.toContain('Beta')
  await click(findButton('All 3'))
  expect(container.textContent).toContain('Gamma')
  expect(findButton('Chat 2').getAttribute('aria-pressed')).toBe('false')
  const search =
    container.querySelector<HTMLInputElement>('input[type=search]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(search, 'missing')
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(findButton('All 0')).toBeDefined()
  expect(findButton('Chat 0')).toBeDefined()
  expect(container.textContent).toContain('No results')
})
