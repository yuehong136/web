import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import enFlow from '@/locales/en-US/flow'
import zhFlow from '@/locales/zh-CN/flow'
import { Operator } from '../../../constant'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../../../operators/serializers'
import useGraphStore from '../../../store'
import type { RAGFlowNodeType } from '../../../types'
import { BrowserForm } from '..'

vi.mock('../../../debug-content/uploader', () => ({
  FileUploadDirectUpload: ({
    onChange,
    buttonLabel,
  }: {
    onChange: (value: unknown) => void
    buttonLabel: string
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange([{ id: 'uploaded-via-agent', name: 'source.txt' }])
      }
    >
      {buttonLabel}
    </button>
  ),
}))
vi.mock('@/components/prompt-editor', () => ({
  PromptEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))
vi.mock('../../../hooks/use-get-begin-query', () => ({
  useBuildPromptVariableOptions: () => [],
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useLLMGroupedOptions: () => ({ options: [], isLoading: false }),
}))

const i18n = createInstance()
let container: HTMLDivElement
let root: Root
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await i18n.init({
    lng: 'en-US',
    fallbackLng: 'en-US',
    resources: {
      'en-US': { translation: enFlow },
      'zh-CN': { translation: zhFlow },
    },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  useGraphStore.setState({ nodes: [], edges: [] })
  vi.unstubAllGlobals()
})
function control(text: string) {
  const label = [...container.querySelectorAll('label')].find(
    (node) => node.textContent === text,
  )!
  expect(label).toBeDefined()
  return document.getElementById(label.htmlFor)!
}
async function mount(node: RAGFlowNodeType, key = 'initial') {
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <BrowserForm key={key} node={node} />
      </I18nextProvider>,
    ),
  )
}
async function input(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
      element,
      value,
    )
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
function currentForm() {
  return useGraphStore.getState().nodes[0].data.form
}

it('preserves zero, booleans and file references through editing, DSL reload and bilingual reopen', async () => {
  const node = buildGraphNode(Operator.Browser, {
    id: 'Browser:one',
    form: {
      llm_id: 'controlled@OpenAI',
      upload_sources: ['{sys.file_refs}', { id: 'runtime-file' }],
    },
  }) as RAGFlowNodeType
  useGraphStore.setState({ nodes: [node], edges: [] })
  await mount(node)
  expect((control('Temperature') as HTMLInputElement).value).toBe('0')
  await act(async () => control('Headless').click())
  await act(async () => control('Persist browser session').click())
  await input(control('Max steps') as HTMLInputElement, '12')
  expect(
    container.querySelector<HTMLInputElement>('input[readonly]')?.value,
  ).toBe('runtime-file')
  expect(currentForm().temperature).toBe(0)
  expect(currentForm().headless).toBe(false)
  expect(currentForm().persist_session).toBe(false)
  expect(currentForm().max_steps).toBe(12)
  expect(currentForm().upload_sources).toEqual([
    '{sys.file_refs}',
    { id: 'runtime-file' },
  ])
  const { graph } = deserializeDslToGraph(
    serializeGraphToDsl({
      graph: { nodes: useGraphStore.getState().nodes, edges: [] },
    }),
  )
  useGraphStore.setState({ nodes: graph.nodes, edges: graph.edges })
  await mount(graph.nodes[0] as RAGFlowNodeType, 'reopen')
  expect(control('Headless').getAttribute('aria-checked')).toBe('false')
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(control('持久化浏览器会话').getAttribute('aria-checked')).toBe('false')
  expect(container.textContent).toContain('添加上传来源')
  expect(container.textContent).toContain('downloaded_files')
})

it('adds, edits and removes upload source rows without converting the array to text', async () => {
  const node = buildGraphNode(Operator.Browser, {
    id: 'Browser:one',
  }) as RAGFlowNodeType
  useGraphStore.setState({ nodes: [node], edges: [] })
  await mount(node)
  const add = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Add upload source',
  )!
  await act(async () => add.click())
  await input(
    container.querySelector('textarea[placeholder]')!,
    '{sys.file_refs}',
  )
  expect(currentForm().upload_sources).toEqual(['{sys.file_refs}'])
  await act(async () => add.click())
  await input(
    container.querySelectorAll<HTMLTextAreaElement>('textarea[placeholder]')[1],
    'https://example.test/file.pdf',
  )
  expect(currentForm().upload_sources).toEqual([
    '{sys.file_refs}',
    'https://example.test/file.pdf',
  ])
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>(
        '[aria-label="Remove upload source 1"]',
      )!
      .click(),
  )
  expect(currentForm().upload_sources).toEqual([
    'https://example.test/file.pdf',
  ])
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>(
        '[aria-label="Remove upload source 1"]',
      )!
      .click(),
  )
  expect(currentForm().upload_sources).toEqual([])
})

it('shows localized validation for fractional steps instead of rounding to an accepted integer', async () => {
  const node = buildGraphNode(Operator.Browser, {
    id: 'Browser:one',
  }) as RAGFlowNodeType
  useGraphStore.setState({ nodes: [node], edges: [] })
  await mount(node)
  await input(control('Max steps') as HTMLInputElement, '1.5')
  expect(currentForm().max_steps).toBe(1.5)
  expect(container.textContent).toContain(
    'Enter a valid number in the allowed range.',
  )
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(container.textContent).toContain('请输入允许范围内的有效数字。')
})

it('appends upload route descriptors as objects while preserving existing variable sources', async () => {
  const node = buildGraphNode(Operator.Browser, {
    id: 'Browser:one',
    form: { upload_sources: ['{CodeExec:files@result}'] },
  }) as RAGFlowNodeType
  useGraphStore.setState({ nodes: [node], edges: [] })
  await mount(node)
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Upload files')!
      .click(),
  )
  expect(currentForm().upload_sources).toEqual([
    '{CodeExec:files@result}',
    { id: 'uploaded-via-agent', name: 'source.txt' },
  ])
  expect(
    container.querySelector<HTMLInputElement>('input[readonly]')?.value,
  ).toBe('source.txt')
})
