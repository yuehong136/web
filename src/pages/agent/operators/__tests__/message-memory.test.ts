import assert from 'node:assert/strict'
import test from 'node:test'
import { runMemoryMessageConsumer } from '../../../../../scripts/consumers/memory-message'
import { initialMessageValues, Operator, BeginId } from '../../constant'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../serializers'
import type { AgentDsl } from '@/types/agent'
const messageId = 'Message:source'
function fixture(value?: boolean): AgentDsl {
  const form: Record<string, unknown> = {
    content: ['Owned response'],
    memory_ids: ['memory-old'],
    user_id: ' exact ',
  }
  if (value !== undefined) form.structured_memory = value
  return serializeGraphToDsl({
    graph: {
      nodes: [
        buildGraphNode(Operator.Begin, { id: BeginId }),
        buildGraphNode(Operator.Message, { id: messageId, form }),
      ],
      edges: [{ id: 'begin-message', source: BeginId, target: messageId }],
    },
  })
}
void test('legacy Message defaults off while true/false survive DSL component, graph, export/import and memory changes', () => {
  assert.equal(initialMessageValues.structured_memory, false)
  for (const enabled of [undefined, false, true]) {
    const dsl = fixture(enabled)
    if (enabled === undefined) {
      delete dsl.components[messageId]!.obj.params.structured_memory
      delete (
        dsl.graph!.nodes.find((n) => n.id === messageId)!.data.form as Record<
          string,
          unknown
        >
      ).structured_memory
    }
    const graph = deserializeDslToGraph(
      JSON.parse(JSON.stringify(dsl)) as AgentDsl,
    ).graph
    const form = graph.nodes.find((n) => n.id === messageId)!.data
      .form as Record<string, unknown>
    assert.equal(form.structured_memory, enabled === true)
    for (const ids of [['memory-other', 'memory-last'], []]) {
      form.memory_ids = ids
      const output = serializeGraphToDsl({ graph, baseDsl: dsl })
      assert.deepEqual(output.components[messageId]!.obj.params.memory_ids, ids)
      assert.equal(
        output.components[messageId]!.obj.params.structured_memory,
        enabled === true,
      )
      assert.deepEqual(output.components[messageId]!.obj.params.content, [
        'Owned response',
      ])
    }
  }
})
for (const enabled of [undefined, false, true])
  void test(`Message consumer saves, reloads and roundtrips the actual DSL (${enabled})`, async (t) => {
    let saved = fixture()
    const requests: {
      method: string
      path: string
      body?: Record<string, unknown>
    }[] = []
    t.mock.method(
      globalThis,
      'fetch',
      (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const path = new URL(url instanceof Request ? url.url : url.toString())
            .pathname,
          method = init?.method ?? 'GET'
        requests.push({
          method,
          path,
          body:
            typeof init?.body === 'string'
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : undefined,
        })
        assert.equal(
          new Headers(init?.headers).get('Authorization'),
          'Bearer owned-token',
        )
        if (method === 'PUT') {
          const body = requests.at(-1)!.body!
          assert.equal(typeof body.dsl, 'string')
          saved = JSON.parse(body.dsl as string) as AgentDsl
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              retcode: 0,
              data: {
                id: 'owned-agent',
                title: 'Owned',
                dsl: JSON.stringify(saved),
              },
            }),
            { headers: { 'Content-Type': 'application/json' } },
          ),
        )
      },
    )
    const result = await runMemoryMessageConsumer({
      baseURL: 'https://owned.invalid',
      token: 'Bearer owned-token',
      agentId: 'owned-agent',
      messageNodeId: messageId,
      memoryIds: ['memory-new'],
      structuredMemory: enabled,
      ownedScratchConfirmed: true,
    })
    assert.deepEqual(
      requests.map((r) => r.method),
      ['GET', 'PUT', 'GET'],
    )
    assert.ok(requests.every((r) => r.path === '/api/v1/agents/owned-agent'))
    assert.equal(result.structuredMemory, enabled === true)
    assert.deepEqual(result.memoryIds, ['memory-new'])
    assert.match(result.persistedDslSha256, /^[a-f0-9]{64}$/)
    assert.equal(result.exportImportPreserved, true)
    assert.ok(!JSON.stringify(result).includes('Owned response'))
  })
