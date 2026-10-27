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
import { DocGeneratorForm } from '..'
import { useBuildNodeOutputOptions } from '../../../hooks/use-build-options'

vi.mock('@/components/prompt-editor', () => ({
  PromptEditor: ({ value }: { value: string }) => (
    <textarea readOnly value={value} />
  ),
}))
vi.mock('../../../hooks/use-get-begin-query', () => ({
  useBuildPromptVariableOptions: () => [],
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

function toggle(labelText: string) {
  const label = [...container.querySelectorAll('label')].find(
    (label) => label.textContent === labelText,
  )!
  expect(label).toBeDefined()
  return document.getElementById(label.htmlFor)!
}
function VariableProbe() {
  const options = useBuildNodeOutputOptions('Message:next')
  return (
    <output data-testid="variables">
      {JSON.stringify(
        options.map((group) =>
          group.options.map(({ value, type }) => ({ value, type })),
        ),
      )}
    </output>
  )
}
async function mount(node: RAGFlowNodeType, key = 'initial') {
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <DocGeneratorForm key={key} node={node} />
        <VariableProbe />
      </I18nextProvider>,
    ),
  )
}

it('keeps the opt-in through save, DSL reload, editing another field and reopening', async () => {
  const node = buildGraphNode(Operator.DocGenerator, {
    id: 'DocGenerator:one',
    form: { content: 'Private report' },
  }) as RAGFlowNodeType
  const message = buildGraphNode(Operator.Message, {
    id: 'Message:next',
    form: {
      content: ['{DocGenerator:one@filename} ({DocGenerator:one@size})'],
    },
  }) as RAGFlowNodeType
  useGraphStore.setState({
    nodes: [node, message],
    edges: [{ id: 'doc-message', source: node.id, target: message.id }],
  })
  await mount(node)
  expect(
    container.querySelector('[data-testid="variables"]')!.textContent,
  ).toContain('DocGenerator:one@size')
  expect(
    container.querySelector('[data-testid="variables"]')!.textContent,
  ).toContain('number')
  expect(
    toggle('Include download info in message content').getAttribute(
      'aria-checked',
    ),
  ).toBe('false')
  await act(async () =>
    toggle('Include download info in message content').click(),
  )
  expect(useGraphStore.getState().nodes[0].data.form.outputs).toMatchObject({
    doc_id: { type: 'string' },
    filename: { type: 'string' },
    mime_type: { type: 'string' },
    size: { type: 'number', value: 0 },
    download: { type: 'string' },
  })
  expect(
    useGraphStore.getState().nodes[0].data.form
      .include_download_info_in_content,
  ).toBe(true)
  const dsl = serializeGraphToDsl({
    graph: {
      nodes: useGraphStore.getState().nodes,
      edges: useGraphStore.getState().edges,
    },
  })
  expect(dsl.components?.['DocGenerator:one'].obj.params.outputs).toMatchObject(
    {
      doc_id: { type: 'string' },
      filename: { type: 'string' },
      mime_type: { type: 'string' },
      size: { type: 'number' },
    },
  )
  expect(JSON.stringify(dsl.components?.['Message:next'].obj.params)).toContain(
    '{DocGenerator:one@filename}',
  )
  const { graph } = deserializeDslToGraph(dsl)
  const reloaded = graph.nodes.find(
    (node) => node.id === 'DocGenerator:one',
  )! as RAGFlowNodeType
  useGraphStore.setState({ nodes: graph.nodes, edges: graph.edges })
  await mount(reloaded, 'reopened')
  expect(
    toggle('Include download info in message content').getAttribute(
      'aria-checked',
    ),
  ).toBe('true')
  await act(async () => toggle('Add timestamp').click())
  expect(useGraphStore.getState().nodes[0].data.form.outputs).toHaveProperty(
    'size.type',
    'number',
  )
  expect(
    useGraphStore
      .getState()
      .nodes.find((node) => node.id === 'DocGenerator:one')!.data.form
      .include_download_info_in_content,
  ).toBe(true)
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(toggle('在消息内容中包含下载信息').getAttribute('aria-checked')).toBe(
    'true',
  )
  await act(async () => toggle('在消息内容中包含下载信息').click())
  expect(
    useGraphStore
      .getState()
      .nodes.find((node) => node.id === 'DocGenerator:one')!.data.form
      .include_download_info_in_content,
  ).toBe(false)
})
