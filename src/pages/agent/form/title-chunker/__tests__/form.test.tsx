import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import enFlow from '@/locales/en-US/flow'
import zhFlow from '@/locales/zh-CN/flow'
import { Operator } from '@/pages/agent/constant'
import { FormBindingContext } from '@/pages/agent/hooks/form-binding-context'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '@/pages/agent/operators/serializers'
import useGraphStore from '@/pages/agent/store'
import type { RAGFlowNodeType } from '@/pages/agent/types'
import { initialTitleChunkerValues } from '@/pages/agent/form/chunker-constants'
import { TitleChunkerForm } from '@/pages/agent/form/title-chunker'

const i18n = createInstance()
const nodeId = 'TitleChunker:one'
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

async function mount(node: RAGFlowNodeType, key = 'initial') {
  useGraphStore.setState({ nodes: [node], edges: [] })
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <TitleChunkerForm key={key} node={node} />
      </I18nextProvider>,
    ),
  )
}

function expressions() {
  return [...container.querySelectorAll<HTMLInputElement>('input')].filter(
    (element) => element.type === 'text',
  )
}

async function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(
    (element) => element.textContent === text,
  )!
  expect(button).toBeDefined()
  await act(async () => button.click())
}

async function input(index: number, value: string) {
  await act(async () => {
    const element = expressions()[index]
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function save() {
  return serializeGraphToDsl({
    graph: { nodes: useGraphStore.getState().nodes, edges: [] },
  })
}

it('keeps each mode and its exact rule count through edits, switching, saving and reload', async () => {
  const defaultsBefore = JSON.stringify(initialTitleChunkerValues)
  const node = buildGraphNode(Operator.TitleChunker, {
    id: nodeId,
    form: {
      method: 'hierarchy',
      hierarchyHierarchy: '2',
      hierarchyGroup: '0',
      hierarchyRules: [
        { levels: [{ expression: '^Part' }, { expression: '^Chapter' }] },
      ],
      groupRules: [{ levels: [{ expression: '^Topic' }] }],
    },
  }) as RAGFlowNodeType
  await mount(node)
  expect(expressions().map((element) => element.value)).toEqual([
    '^Part',
    '^Chapter',
  ])
  await input(0, '^PartEdited')
  await click('Group')
  expect(expressions().map((element) => element.value)).toEqual(['^Topic'])
  await input(0, '^TopicEdited')
  await click('Add regular expressions')
  await input(1, '^Subtopic')
  await click('Add rule')
  await input(2, '^Appendix')
  await click('Hierarchy')
  expect(expressions().map((element) => element.value)).toEqual([
    '^PartEdited',
    '^Chapter',
  ])
  let dsl = save()
  expect(dsl.components[nodeId].obj.params).toMatchObject({
    method: 'hierarchy',
    hierarchy: 2,
    levels: [['^PartEdited', '^Chapter']],
  })
  expect(dsl.components[nodeId].obj.params).not.toHaveProperty('groupRules')
  await mount(
    deserializeDslToGraph(dsl).graph.nodes[0] as RAGFlowNodeType,
    'reopen-hierarchy',
  )
  await click('Group')
  expect(expressions().map((element) => element.value)).toEqual([
    '^TopicEdited',
    '^Subtopic',
    '^Appendix',
  ])
  // Remove the first rule, including its nested levels, then serialize group mode.
  const removeRule = [...container.querySelectorAll('span')]
    .find((element) => element.textContent === 'Rule 1')!
    .parentElement!.querySelector('button')!
  await act(async () => removeRule.click())
  expect(expressions().map((element) => element.value)).toEqual(['^Appendix'])
  dsl = save()
  expect(dsl.components[nodeId].obj.params).toMatchObject({
    method: 'group',
    hierarchy: 0,
    levels: [['^Appendix']],
  })
  await mount(
    deserializeDslToGraph(dsl).graph.nodes[0] as RAGFlowNodeType,
    'reopen-group',
  )
  expect(expressions().map((element) => element.value)).toEqual(['^Appendix'])
  await act(async () => i18n.changeLanguage('zh-CN'))
  await click('层次结构')
  expect(expressions().map((element) => element.value)).toEqual([
    '^PartEdited',
    '^Chapter',
  ])
  expect(JSON.stringify(initialTitleChunkerValues)).toBe(defaultsBefore)
})

it.each([
  { method: 'hierarchy', hierarchy: 1, levels: [['^LegacyLevel']] },
  {
    method: 'group',
    hierarchy: 0,
    rules: [{ levels: [{ expression: '^LegacyRule' }] }],
  },
  { method: 'group', hierarchy: undefined, levels: [['^LegacyLevel']] },
])(
  'loads legacy $method params before defaults, then edits and saves the same rules',
  async (params) => {
    const { graph } = deserializeDslToGraph({
      components: {
        [nodeId]: {
          obj: { component_name: Operator.TitleChunker, params },
          upstream: [],
          downstream: [],
        },
      },
    })
    await mount(graph.nodes[0] as RAGFlowNodeType)
    expect(expressions().map((element) => element.value)).toEqual([
      params.rules ? '^LegacyRule' : '^LegacyLevel',
    ])
    await input(0, '^LegacyEdited')
    const dsl = save()
    expect(dsl.components[nodeId].obj.params).toMatchObject({
      method: params.method,
      hierarchy: params.hierarchy ?? 0,
      levels: [['^LegacyEdited']],
    })
    await mount(
      deserializeDslToGraph(dsl).graph.nodes[0] as RAGFlowNodeType,
      'reloaded-legacy',
    )
    expect(expressions().map((element) => element.value)).toEqual([
      '^LegacyEdited',
    ])
  },
)

it('uses a bound nested form without merging default rule tails or the outer node form', async () => {
  const node = buildGraphNode(Operator.TitleChunker, { id: nodeId })
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <FormBindingContext.Provider
          value={{
            nodeId,
            formData: { method: 'group', hierarchy: 0, levels: [['^Bound']] },
            path: ['nested'],
          }}
        >
          <TitleChunkerForm node={node as RAGFlowNodeType} />
        </FormBindingContext.Provider>
      </I18nextProvider>,
    ),
  )
  expect(expressions().map((element) => element.value)).toEqual(['^Bound'])
})
