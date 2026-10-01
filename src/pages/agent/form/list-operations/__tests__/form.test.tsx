import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import enFlow from '@/locales/en-US/flow'
import zhFlow from '@/locales/zh-CN/flow'
import { Operator } from '../../../constant'
import { buildGraphNode } from '../../../operators/serializers'
import useGraphStore from '../../../store'
import { FormBindingProvider } from '../../../hooks/form-binding'
import type { RAGFlowNodeType } from '../../../types'
import { ListOperationsForm } from '..'

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
async function mount(raw?: Record<string, unknown>, binding = false) {
  const node = buildGraphNode(Operator.ListOperations, {
    id: 'list',
    ...(raw === undefined ? {} : { form: raw }),
  }) as RAGFlowNodeType
  useGraphStore.setState({ nodes: [node], edges: [] })
  const element = <ListOperationsForm node={node} />
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        {binding ? (
          <FormBindingProvider value={{ nodeId: 'list', formData: raw }}>
            {element}
          </FormBindingProvider>
        ) : (
          element
        )}
      </I18nextProvider>,
    ),
  )
}
function saved() {
  return useGraphStore.getState().nodes[0].data.form
}
async function input(text: string) {
  const field = container.querySelector<HTMLInputElement>('input[name="n"]')!
  expect(field).not.toBeNull()
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it.each([false, true])(
  'switching v1/v2 nodes keeps their own form state (binding=%s)',
  async (binding) => {
    const a = buildGraphNode(Operator.ListOperations, {
      id: 'legacy',
      form: { operations: 'head', n: '2', strict: 'yes' },
    }) as RAGFlowNodeType
    const b = buildGraphNode(Operator.ListOperations, {
      id: 'current',
      form: { operations_version: 2, operations: 'nth', n: -1, strict: false },
    }) as RAGFlowNodeType
    useGraphStore.setState({ nodes: [a, b], edges: [] })
    const render = async (id: string) => {
      const node = useGraphStore
        .getState()
        .nodes.find((item) => item.id === id)!
      const fields = <ListOperationsForm node={node} />
      await act(async () =>
        root.render(
          <I18nextProvider i18n={i18n}>
            {binding ? (
              <FormBindingProvider
                value={{ nodeId: id, formData: node.data.form }}
              >
                {fields}
              </FormBindingProvider>
            ) : (
              fields
            )}
          </I18nextProvider>,
        ),
      )
    }
    await render('legacy')
    await render('current')
    expect(
      container.querySelector<HTMLInputElement>('input[name="n"]')?.value,
    ).toBe('-1')
    expect(
      useGraphStore.getState().nodes.find((node) => node.id === 'current')?.data
        .form,
    ).toMatchObject({
      operations_version: 2,
      operations: 'nth',
      n: -1,
      strict: false,
    })
    await input('-3')
    await render('legacy')
    expect(
      container.querySelector<HTMLInputElement>('input[name="n"]')?.value,
    ).toBe('2')
    expect(
      useGraphStore.getState().nodes.find((node) => node.id === 'legacy')?.data
        .form,
    ).toMatchObject({
      operations_version: 1,
      operations: 'head',
      n: '2',
      strict: 'yes',
    })
    expect(
      useGraphStore.getState().nodes.find((node) => node.id === 'current')?.data
        .form?.n,
    ).toBe(-3)
  },
)

it('actual form preserves zero and negative counts, persists strict and rejects fractions', async () => {
  await mount()
  expect(saved()?.operations_version).toBe(2)
  expect(saved()?.n).toBe(0)
  await input('-2')
  expect(saved()?.n).toBe(-2)
  await input('0')
  expect(saved()?.n).toBe(0)
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[role="switch"]')!.click(),
  )
  expect(saved()?.strict).toBe(true)
  expect(saved()?.n).toBe(0)
  await input('1.5')
  expect(saved()?.n).toBe(0)
  expect(container.textContent).toContain(
    enFlow.flow.listOperationsConfig.integerRequired,
  )
  await input('-1')
  expect(saved()?.n).toBe(-1)
  expect(container.textContent).not.toContain(
    enFlow.flow.listOperationsConfig.integerRequired,
  )
})

it.each([0, -2, '2', 2.75, true, null])(
  'legacy binding keeps raw n=%s and redundant strict on mount',
  async (n) => {
    await mount(
      { operations: 'head', query: '{env.items}', n, strict: 'YES' },
      true,
    )
    expect(saved()?.operations_version).toBe(1)
    expect(saved()?.n).toBe(n)
    expect(saved()?.strict).toBe('YES')
    expect(container.querySelector('[role="switch"]')).toBeNull()
    expect(container.textContent).toContain(
      enFlow.flow.ListOperationsLegacyOptions.head,
    )
  },
)

it('empty historical binding cannot acquire the new default version or n=1', async () => {
  await mount({}, true)
  expect(saved()?.operations_version).toBe(1)
  expect(saved()?.operations).toBe('topN')
  expect(saved()?.n).toBe(0)
})

it('new labels and exact lenient slice tips switch between English and Chinese', async () => {
  await mount({
    operations_version: 2,
    operations: 'head',
    n: 99,
    strict: false,
  })
  expect(container.textContent).toContain(
    enFlow.flow.ListOperationsOptions.head,
  )
  expect(container.textContent).toContain(
    enFlow.flow.listOperationsConfig.sliceTip,
  )
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(container.textContent).toContain(
    zhFlow.flow.ListOperationsOptions.head,
  )
  expect(container.textContent).toContain(
    zhFlow.flow.listOperationsConfig.sliceTip,
  )
  expect(saved()?.n).toBe(99)
})

it.each(['2', true, null, 7])(
  'invalid version %s is shown safely and retained',
  async (operations_version) => {
    await mount({ operations_version, operations: 'nth', n: -1 })
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      enFlow.flow.listOperationsConfig.invalidVersion,
    )
    expect(container.querySelector('input[name="n"]')).toBeNull()
    expect(saved()?.operations_version).toBe(operations_version)
  },
)
