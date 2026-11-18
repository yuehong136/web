import { act, type ContextType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { Operator } from '@/pages/agent/constant'
import { AgentInstanceContext } from '@/pages/agent/context'
import { getOperatorCategory } from '@/pages/agent/operator-icon.constants'
import NodeHeader from '../node-header'
import { NodeWrapper } from '../node-wrapper'
import { NoteNode } from '../note-node'

type InstanceContext = ContextType<typeof AgentInstanceContext>

let root: Root
let host: HTMLDivElement

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  await setProductLanguage('zh-CN')
})

async function renderNode(context: Partial<InstanceContext>, selected = false) {
  await act(async () =>
    root.render(
      <AgentInstanceContext.Provider value={context as InstanceContext}>
        <NodeWrapper id="node-1" selected={selected}>
          <NodeHeader id="node-1" name="Answer" label={Operator.Agent} />
        </NodeWrapper>
      </AgentInstanceContext.Provider>,
    ),
  )
  return host.querySelector<HTMLElement>('[data-status]')!
}

it('shows no status while a node is idle', async () => {
  const card = await renderNode({})
  expect(card.dataset.status).toBe('idle')
  expect(host.querySelector('[data-slot="node-status"]')).toBeNull()
})

it('wears the tide ring while running and names the state for screen readers', async () => {
  const card = await renderNode({
    currentSendLoading: true,
    startButNotFinishedNodeIds: ['node-1'],
  })
  expect(card.dataset.status).toBe('running')
  expect(card.className).toContain('ai-glow')
  expect(card.className).toContain('canvas-node-running')
  expect(host.querySelector('[data-slot="node-status"]')?.textContent).toBe(
    'Running',
  )
})

it('marks finished nodes with a status dot, label and elapsed time', async () => {
  let card = await renderNode({
    successNodeIds: ['node-1'],
    nodeElapsedMap: { 'node-1': 1.5 },
  })
  expect(card.dataset.status).toBe('success')
  expect(card.className).toContain('border-success-line')
  expect(host.querySelector('[data-slot="node-status"]')?.textContent).toBe(
    '1.50sSucceeded',
  )

  card = await renderNode({
    errorNodeIds: ['node-1'],
    nodeElapsedMap: { 'node-1': 0.25 },
  })
  expect(card.dataset.status).toBe('error')
  expect(host.querySelector('[data-slot="node-status"]')?.textContent).toBe(
    '250msFailed',
  )
})

it('keeps the selection outline instead of the finished border when selected', async () => {
  const card = await renderNode({ successNodeIds: ['node-1'] }, true)
  expect(card.className).toContain('outline-line-focus')
  expect(card.className).not.toContain('border-success-line')
})

it('puts the operator glyph on its family tile next to the node name', async () => {
  await renderNode({})
  const tile = host.querySelector<HTMLElement>('[data-slot="operator-tile"]')!
  expect(tile.dataset.category).toBe('ai')
  expect(tile.className).toContain('bg-avatar-7-bg')
  expect(tile.getAttribute('aria-hidden')).toBe('true')
  expect(host.querySelector('[title="Answer"]')?.textContent).toBe('Answer')
})

it('groups operators the way the add-node menu does', () => {
  expect(getOperatorCategory(Operator.Begin)).toBe('start')
  expect(getOperatorCategory(Operator.Retrieval)).toBe('knowledge')
  expect(getOperatorCategory(Operator.Switch)).toBe('flow')
  expect(getOperatorCategory(Operator.Code)).toBe('data')
  expect(getOperatorCategory(Operator.Message)).toBe('dialog')
  expect(getOperatorCategory(Operator.Parser)).toBe('ingestion')
  expect(getOperatorCategory(Operator.TavilySearch)).toBe('tool')
  expect(getOperatorCategory('UnknownOperator')).toBe('tool')
})

it('renders custom nodes in xyflow 13 with the forced colour scheme', async () => {
  // jsdom has no layout; xyflow only needs these to mount.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  const nodes: Node[] = [
    {
      id: 'note-1',
      type: 'noteNode',
      position: { x: 0, y: 0 },
      data: { name: 'Reminder', form: { text: 'Check the prompt' } },
    },
  ]
  const edges: Edge[] = []
  await act(async () =>
    root.render(
      <div style={{ width: 800, height: 600 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={{ noteNode: NoteNode }}
            forceColorMode="dark"
            elevateEdgesOnSelect={false}
          />
        </ReactFlowProvider>
      </div>,
    ),
  )
  const flow = host.querySelector('.react-flow')
  expect(flow?.classList.contains('dark')).toBe(true)
  expect(
    host.querySelector('.react-flow__node-noteNode')?.textContent,
  ).toContain('Check the prompt')
})
