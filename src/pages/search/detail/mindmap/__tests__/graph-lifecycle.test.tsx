import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi, type Mock } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import IndentedTree, { type IndentedTreeRef } from '../indented-tree'

interface TestGraph {
  destroyed: boolean
  render: Mock<() => Promise<void>>
  fitView: Mock<() => Promise<void>>
  resize: Mock<() => void>
  destroy: Mock<() => void>
  getNodeData: Mock<() => { id: string }[]>
  collapseElement: Mock<(id: string) => Promise<void>>
  expandElement: Mock<(id: string) => Promise<void>>
}
const state = vi.hoisted(() => ({
  graphs: [] as TestGraph[],
  renderPlans: [] as (() => Promise<void>)[],
  appearance: { resolvedMode: 'light', preset: 'studio' },
  listeners: new Set<() => void>(),
  observers: [] as { fire: () => void; disconnected: boolean }[],
}))
vi.mock('@/themes', async () => {
  const { useSyncExternalStore } = await import('react')
  return {
    useResolvedAppearance: () =>
      useSyncExternalStore(
        (listener) => {
          state.listeners.add(listener)
          return () => {
            state.listeners.delete(listener)
          }
        },
        () => state.appearance,
      ),
  }
})
vi.mock('@antv/g', () => ({ Rect: class {} }))
vi.mock('@antv/g6', () => ({
  Graph: class {
    destroyed = false
    constructor() {
      state.graphs.push(this)
    }
    setData = vi.fn()
    render = vi.fn(async () => {
      await state.renderPlans.shift()?.()
      if (this.destroyed) throw new Error('G6 context.draw after destroy')
    })
    fitView = vi.fn(async () => {
      if (this.destroyed) throw new Error('Graph destroyed')
    })
    resize = vi.fn(() => {
      if (this.destroyed) throw new Error('Graph destroyed')
    })
    destroy = vi.fn(() => {
      this.destroyed = true
    })
    getNodeData = vi.fn(() => [
      { id: 'root' },
      { id: 'root-a' },
      { id: 'root-b' },
    ])
    collapseElement = vi.fn(async (_id: string) => {})
    expandElement = vi.fn(async (_id: string) => {})
  },
  BaseNode: class {},
  BaseBehavior: class {},
  Polyline: class {},
  Badge: class {},
  CommonEvent: {},
  NodeEvent: {},
  ExtensionCategory: {},
  register: vi.fn(),
  subStyleProps: vi.fn(),
  treeToGraphData: vi.fn((data) => data),
}))

const deferred = () => {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((accept, fail) => {
    resolve = accept
    reject = fail
  })
  return { promise, resolve, reject }
}
const data = { id: 'root', label: 'Question', children: [] }
let root: Root
let container: HTMLDivElement
let ref: ReturnType<typeof createRef<IndentedTreeRef>>
const render = async (visible = true) => {
  await act(async () =>
    root.render(<IndentedTree ref={ref} data={data} visible={visible} />),
  )
}
const changeAppearance = async (resolvedMode: string, preset: string) => {
  await act(async () => {
    state.appearance = { resolvedMode, preset }
    state.listeners.forEach((listener) => listener())
  })
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnected = false
      constructor(private callback: ResizeObserverCallback) {
        state.observers.push(this)
      }
      observe() {}
      disconnect() {
        this.disconnected = true
      }
      fire = () => this.callback([], this as unknown as ResizeObserver)
    },
  )
  await setProductLanguage('en-US')
  state.graphs = []
  state.renderPlans = []
  state.observers = []
  state.appearance = { resolvedMode: 'light', preset: 'studio' }
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  ref = createRef<IndentedTreeRef>()
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it.each(['resolve', 'reject'] as const)(
  'drains a delayed render before destroy when closing (%s)',
  async (settlement) => {
    const pending = deferred()
    state.renderPlans.push(() => pending.promise)
    await render()
    const graph = state.graphs[0]!
    expect(graph.render).toHaveBeenCalledOnce()
    await render(false)
    expect(graph.destroy).not.toHaveBeenCalled()
    expect(state.observers[0]!.disconnected).toBe(true)
    await act(async () => {
      ref.current!.fitView()
      await ref.current!.collapseAll()
      state.observers[0]!.fire()
      if (settlement === 'resolve') pending.resolve()
      else pending.reject(new Error('private stale draw failure'))
    })
    expect(graph.destroy).toHaveBeenCalledOnce()
    expect(graph.fitView).not.toHaveBeenCalled()
    expect(graph.resize).not.toHaveBeenCalled()
    expect(graph.getNodeData).not.toHaveBeenCalled()
    expect(container.querySelector('output')).toBeNull()
  },
)

it('serializes preset rebuilds and lets an existing resize observer target only the new graph', async () => {
  const pending = deferred()
  state.renderPlans.push(() => pending.promise)
  await render()
  const old = state.graphs[0]!
  await changeAppearance('dark', 'ocean')
  expect(state.graphs).toHaveLength(1)
  expect(old.destroy).not.toHaveBeenCalled()
  await act(async () => {
    pending.resolve()
  })
  expect(old.destroy).toHaveBeenCalledOnce()
  expect(old.fitView).not.toHaveBeenCalled()
  const current = state.graphs[1]!
  expect(current.render).toHaveBeenCalledOnce()
  await act(async () => {
    state.observers[0]!.fire()
  })
  expect(old.resize).not.toHaveBeenCalled()
  expect(current.resize).toHaveBeenCalledOnce()
  expect(current.fitView).toHaveBeenCalledTimes(2)
  await act(async () => {
    await ref.current!.expandAll()
  })
  expect(old.expandElement).not.toHaveBeenCalled()
  expect(current.expandElement).toHaveBeenCalledTimes(2)
})

it('drains an in-flight command but rejects later node commands on the retired graph', async () => {
  await render()
  const old = state.graphs[0]!
  const pending = deferred()
  old.collapseElement.mockImplementationOnce(() => pending.promise)
  let command!: Promise<void>
  await act(async () => {
    command = ref.current!.collapseAll()
  })
  expect(old.collapseElement).toHaveBeenCalledTimes(1)
  await changeAppearance('light', 'paper')
  expect(old.destroy).not.toHaveBeenCalled()
  await act(async () => {
    ref.current!.fitView()
    pending.resolve()
    await command
  })
  expect(old.collapseElement).toHaveBeenCalledTimes(1)
  expect(old.fitView).toHaveBeenCalledTimes(1)
  expect(old.destroy).toHaveBeenCalledOnce()
  expect(state.graphs).toHaveLength(2)
})

it('shows fixed local feedback for a current render failure and recreates the graph on retry', async () => {
  state.renderPlans.push(() =>
    Promise.reject(new Error('private active render failure')),
  )
  await render()
  expect(container.querySelector('output')?.textContent).toContain(
    'unexpected problem',
  )
  expect(container.textContent).not.toContain('private active render failure')
  const failed = state.graphs[0]!
  expect(failed.fitView).not.toHaveBeenCalled()
  await act(async () => {
    container.querySelector('button')!.click()
  })
  expect(failed.destroy).toHaveBeenCalledOnce()
  expect(state.graphs[1]!.render).toHaveBeenCalledOnce()
  expect(state.graphs[1]!.fitView).toHaveBeenCalledOnce()
  expect(container.querySelector('output')).toBeNull()
})

it('reports a current asynchronous command failure rather than swallowing it', async () => {
  await render()
  state.graphs[0]!.fitView.mockRejectedValueOnce(
    new Error('private viewport failure'),
  )
  await act(async () => {
    ref.current!.fitView()
  })
  expect(container.querySelector('output')?.textContent).toContain(
    'unexpected problem',
  )
  expect(container.textContent).not.toContain('private viewport failure')
})
