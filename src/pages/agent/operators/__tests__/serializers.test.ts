import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasType } from '@/types/agent'
import { BeginId, Operator } from '../../constant'
import { agentOperatorRegistry } from '../registry'
import {
  buildGraphNode,
  buildInitialDsl,
  buildInitialGraph,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../serializers'

test('operator registry has unique keys and required root definitions', () => {
  const operators = Object.keys(agentOperatorRegistry)
  assert.equal(new Set(operators).size, operators.length)
  assert.equal(agentOperatorRegistry[Operator.Begin].isRootNode, true)
  assert.equal(agentOperatorRegistry[Operator.File].isRootNode, true)
})

test('buildInitialGraph creates the correct root node for agent and pipeline', () => {
  const agentGraph = buildInitialGraph(AgentCanvasType.AGENT)
  const pipelineGraph = buildInitialGraph(AgentCanvasType.PIPELINE)

  assert.equal(agentGraph.nodes[0]?.id, BeginId)
  assert.equal(agentGraph.nodes[0]?.data.label, Operator.Begin)
  assert.equal(pipelineGraph.nodes[0]?.data.label, Operator.File)
})

test('serializeGraphToDsl excludes non-dsl operators and preserves graph edges', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-1',
    form: { content: ['hello'] },
  })
  const toolNode = buildGraphNode(Operator.Tool, {
    id: 'tool-1',
    form: { ignored: true },
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [beginNode, messageNode, toolNode],
      edges: [
        { id: 'e1', source: BeginId, target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'tool-1' },
      ],
    },
    baseDsl: {
      history: ['kept'],
      messages: [{ type: 'existing' }],
      reference: [],
      globals: { sys: true },
      variables: {},
      retrieval: [],
    },
  })

  assert.deepEqual(Object.keys(dsl.components).sort(), [BeginId, 'message-1'])
  assert.equal(dsl.history[0], 'kept')
  assert.equal(dsl.graph?.edges.length, 1)
  assert.equal(dsl.graph?.edges[0]?.type, 'buttonEdge')
})

test('message nodes normalize editor object content back to persisted string arrays', () => {
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-object',
    form: {
      content: [{ value: 'hello' }],
    },
  })

  assert.deepEqual(
    (messageNode.data.form as Record<string, unknown> | undefined)?.content,
    ['hello'],
  )

  const dsl = serializeGraphToDsl({
    graph: { nodes: [messageNode], edges: [] },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
    },
  })

  assert.deepEqual(
    dsl.components['message-object']?.obj.params.content,
    ['hello'],
  )

  const reconstructed = deserializeDslToGraph(
    {
      components: {
        'message-reconstructed': {
          obj: {
            component_name: Operator.Message,
            params: {
              content: [{ value: 'world' }],
            },
          },
          downstream: [],
          upstream: [],
        },
      },
      history: [],
      messages: [],
      reference: [],
      globals: {},
      retrieval: [],
    },
    { canvasType: AgentCanvasType.AGENT },
  )

  assert.deepEqual(
    (reconstructed.graph.nodes[0]?.data.form as Record<string, unknown> | undefined)
      ?.content,
    ['world'],
  )
})

test('buildInitialDsl always includes path as an empty array', () => {
  const agentDsl = buildInitialDsl(AgentCanvasType.AGENT)
  const pipelineDsl = buildInitialDsl(AgentCanvasType.PIPELINE)

  assert.ok(Array.isArray(agentDsl.path), 'agent dsl.path should be an array')
  assert.deepEqual(agentDsl.path, [])
  assert.ok(Array.isArray(pipelineDsl.path), 'pipeline dsl.path should be an array')
  assert.deepEqual(pipelineDsl.path, [])
})

test('serializeGraphToDsl defaults path to [] when baseDsl omits it', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })

  const dsl = serializeGraphToDsl({
    graph: { nodes: [beginNode], edges: [] },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
    },
  })

  assert.ok(Array.isArray(dsl.path), 'dsl.path should be an array')
  assert.deepEqual(dsl.path, [])
})

test('deserializeDslToGraph rebuilds graph from components when graph is absent', () => {
  const dsl = buildInitialDsl(AgentCanvasType.AGENT)
  delete dsl.graph

  const reconstructed = deserializeDslToGraph(dsl, {
    canvasType: AgentCanvasType.AGENT,
  })

  assert.equal(reconstructed.isReconstructed, true)
  assert.equal(reconstructed.graph.nodes.length, 1)
  assert.equal(reconstructed.graph.nodes[0]?.data.label, Operator.Begin)
})
