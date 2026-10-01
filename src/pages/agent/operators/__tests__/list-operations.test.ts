import assert from 'node:assert/strict'
import test from 'node:test'
import { Operator, initialListOperationsValues } from '../../constant'
import { adaptAgentFlow } from '../../adapters/flow'
import {
  getOperatorDefaultForm,
  mergeOperatorFormWithDefaults,
} from '../defaults'
import { normalizeOperatorFormForStore } from '../normalizers'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../serializers'
import { agentOperatorRegistry } from '../registry'
import { duplicateNodeForm } from '../../utils'
import {
  getListOperation,
  getListOperationLabelKey,
  getListStrictValue,
  parseListCountInput,
} from '../../form/list-operations/utils'

const id = 'ListOperations:list'
const historical = [
  {},
  { operations: 'topN' },
  { operations: 'head' },
  { operations: 'tail' },
  { operations: 'head', n: 0 },
  { operations: 'tail', n: -1 },
  { operations: 'topN', n: 99, strict: true },
  { operations: 'head', n: '2' },
  { operations: 'tail', n: 2.75 },
  { operations: 'head', n: true },
  { operations: 'head', n: null },
  { operations: 'filter', filter: { operator: 'contains', value: 'x' } },
  { operations: 'sort', sort_method: 'desc' },
  { operations: 'drop_duplicates' },
]
const current = [
  {},
  { operations: 'nth', n: -2, strict: true },
  { operations: 'nth', n: 0 },
  { operations: 'head', n: 99, strict: false },
  { operations: 'tail', n: 0, strict: 'YES' },
  { operations: 'topN', n: '2', strict: 'off' },
  { operations: '', n: -1 },
  { operations: 'nth', n: false, strict: 'false' },
  { operations: 'filter', filter: { operator: '=', value: 'a' } },
  { operations: 'sort', sort_method: 'asc' },
  { operations: 'drop_duplicates' },
].map((form) => ({ ...form, operations_version: 2 }))

function dsl(form: Record<string, unknown>, graph: boolean) {
  return {
    components: {
      [id]: {
        obj: { component_name: Operator.ListOperations, params: form },
        upstream: [],
        downstream: [],
      },
    },
    ...(graph
      ? {
          graph: {
            nodes: [
              {
                id,
                position: { x: 0, y: 0 },
                data: { label: Operator.ListOperations, name: 'List', form },
              },
            ],
            edges: [],
          },
        }
      : {}),
  }
}

test('fresh construction and registry use explicit v2, nth, zero and lenient mode', () => {
  assert.ok(agentOperatorRegistry[Operator.ListOperations])
  for (const value of [
    initialListOperationsValues,
    getOperatorDefaultForm(Operator.ListOperations),
    buildGraphNode(Operator.ListOperations).data.form,
  ]) {
    const form = value as Record<string, unknown>
    assert.equal(form?.operations_version, 2)
    assert.equal(form?.operations, 'nth')
    assert.equal(form?.n, 0)
    assert.equal(form?.strict, false)
  }
  assert.equal(
    mergeOperatorFormWithDefaults(Operator.ListOperations, {})
      .operations_version,
    1,
  )
  assert.equal(
    normalizeOperatorFormForStore(Operator.ListOperations, {})
      .operations_version,
    1,
  )
})

for (const [index, raw] of [...historical, ...current].entries()) {
  test(`list configuration ${index} survives graph/component import, clone, save and adapter reload`, () => {
    const form: Record<string, unknown> = { query: '{env.items}', ...raw }
    const initial = JSON.stringify(form)
    for (const withGraph of [false, true]) {
      const original = dsl(form, withGraph)
      const baseline = JSON.stringify(original)
      const loaded = deserializeDslToGraph(original).graph
      const node = loaded.nodes.find((value) => value.id === id)!
      const duplicate = {
        ...node,
        id: id + ':copy',
        data: { ...duplicateNodeForm(node.data), name: node.data.name },
      }
      const saved = serializeGraphToDsl({
        graph: { nodes: [node, duplicate], edges: [] },
      })
      for (const key of [id, id + ':copy']) {
        const params = saved.components[key]!.obj.params
        assert.equal(params.operations_version, form.operations_version ?? 1)
        assert.equal(
          params.operations,
          form.operations ?? (form.operations_version === 2 ? 'nth' : 'topN'),
        )
        assert.equal(params.n, form.n === undefined ? 0 : form.n)
        assert.equal(
          params.strict,
          form.strict === undefined ? false : form.strict,
        )
        assert.deepEqual(
          params.filter,
          form.filter ?? initialListOperationsValues.filter,
        )
        if (form.sort_method !== undefined)
          assert.equal(params.sort_method, form.sort_method)
      }
      const reload = adaptAgentFlow({
        id: 'canvas',
        dsl: JSON.stringify(saved),
      })
      assert.deepEqual(reload.dsl.graph!.nodes[0]!.data.form, node.data.form)
      assert.equal(JSON.stringify(original), baseline)
    }
    assert.equal(JSON.stringify(form), initial)
  })
}

test('empty graph form and absent component params are historical before defaults', () => {
  const value = dsl({}, true)
  delete (value.graph!.nodes[0]!.data as { form?: unknown }).form
  const form = deserializeDslToGraph(value).graph.nodes[0]!.data.form as Record<
    string,
    unknown
  >
  assert.equal(form?.operations_version, 1)
  assert.equal(form?.operations, 'topN')
  assert.equal(form?.n, 0)
  const componentOnly = dsl({}, false)
  delete (componentOnly.components[id].obj as { params?: unknown }).params
  const componentForm = deserializeDslToGraph(componentOnly).graph.nodes[0]!
    .data.form as Record<string, unknown>
  assert.equal(componentForm?.operations_version, 1)
  assert.equal(componentForm?.operations, 'topN')
  assert.equal(componentForm?.n, 0)
})

for (const version of ['2', true, null, 0, 3]) {
  test(`invalid marker ${JSON.stringify(version)} remains invalid across save`, () => {
    const graph = deserializeDslToGraph(
      dsl({ operations_version: version, operations: 'head', n: 2 }, true),
    ).graph
    const saved = serializeGraphToDsl({ graph })
    assert.equal(saved.components[id]!.obj.params.operations_version, version)
    assert.equal(
      getListOperationLabelKey(graph.nodes[0]!.data.form || {}),
      'flow.listOperationsConfig.invalidVersion',
    )
  })
}

test('labels distinguish old single items from new slices and normalize aliases only for display', () => {
  assert.equal(
    getListOperationLabelKey({ operations: 'head' }),
    'flow.ListOperationsLegacyOptions.head',
  )
  assert.equal(
    getListOperationLabelKey({ operations: 'tail', operations_version: 1 }),
    'flow.ListOperationsLegacyOptions.tail',
  )
  assert.equal(
    getListOperationLabelKey({ operations: 'head', operations_version: 2 }),
    'flow.ListOperationsOptions.head',
  )
  assert.equal(
    getListOperation({ operations: ' TOPn ', operations_version: 2 }),
    'head',
  )
  assert.equal(getListOperation({ operations: ' TOPn ' }), 'topN')
})

test('new count input accepts explicit zero and negative integers while rejecting fractions and unsafe values', () => {
  assert.equal(parseListCountInput('0'), 0)
  assert.equal(parseListCountInput('-2'), -2)
  for (const text of ['', '-', '2.5', 'NaN', '9007199254740992'])
    assert.equal(parseListCountInput(text), undefined)
  for (const value of ['TRUE', '1', ' yes ', 'on', true, 1])
    assert.equal(getListStrictValue(value), true)
  for (const value of ['false', '0', 'no', 'off', '', false, 0])
    assert.equal(getListStrictValue(value), false)
})
