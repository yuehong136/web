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

test('high-risk rebuilt operators serialize UI-only form state back to backend request shapes', () => {
  const parserNode = buildGraphNode(Operator.Parser, {
    id: 'parser-1',
    form: {
      setups: [
        {
          fileFormat: 'pdf',
          preprocess: ['title'],
        },
        {
          fileFormat: 'video',
          llm_id: 'vision-model@OpenAI',
          prompt: 'describe the clip',
        },
      ],
    },
  })
  const splitterNode = buildGraphNode(Operator.Splitter, {
    id: 'splitter-1',
    form: {
      delimiters: [{ value: '\n' }],
      enable_children: true,
      children_delimiters: [{ value: '##' }],
    },
  })
  const mergerNode = buildGraphNode(Operator.HierarchicalMerger, {
    id: 'merger-1',
    form: {
      levels: [
        { expressions: [{ expression: '^#[^#]' }] },
        { expressions: [{ expression: '^##[^#]' }] },
      ],
    },
  })
  const invokeNode = buildGraphNode(Operator.Invoke, {
    id: 'invoke-1',
    form: {
      url: 'https://api.example.com/{begin@user_id}',
      datatype: 'json',
      variables: [{ key: 'user_id', ref: '{begin@user_id}', value: '' }],
    },
  })
  const iterationNode = buildGraphNode(Operator.Iteration, {
    id: 'iteration-1',
    form: {
      items_ref: '{retrieval@json}',
      output_items: [
        { name: 'docs', ref: '{generate@text}', type: 'Array<string>' },
      ],
    },
  })
  const aggregatorNode = buildGraphNode(Operator.VariableAggregator, {
    id: 'aggregator-1',
    form: {
      groups: [
        {
          group_name: 'documents',
          variables: ['{retrieval@json}'],
        },
      ],
    },
  })
  const retrievalNode = buildGraphNode(Operator.Retrieval, {
    id: 'retrieval-1',
    form: {
      retrieval_from: 'memory',
      memory_ids: ['memory-1'],
      meta_data_filter: {
        method: 'semi_auto',
        logic: 'or',
        semi_auto: ['author'],
      },
    },
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [
        parserNode,
        splitterNode,
        mergerNode,
        invokeNode,
        iterationNode,
        aggregatorNode,
        retrievalNode,
      ],
      edges: [],
    },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
    },
  })

  const parserParams = (dsl.components['parser-1']?.obj.params || {}) as {
    setups?: Record<
      string,
      { preprocess?: string[]; suffix?: string[]; prompt?: string; llm_id?: string }
    >
  }
  const splitterParams = (dsl.components['splitter-1']?.obj.params || {}) as {
    delimiters?: string[]
    children_delimiters?: string[]
  }
  const mergerParams = (dsl.components['merger-1']?.obj.params || {}) as {
    levels?: string[][]
  }
  const invokeParams = (dsl.components['invoke-1']?.obj.params || {}) as {
    variables?: Array<{ ref?: string }>
  }
  const iterationParams = (dsl.components['iteration-1']?.obj.params || {}) as {
    outputs?: Record<string, { ref?: string; type?: string }>
  }
  const aggregatorParams = (dsl.components['aggregator-1']?.obj.params || {}) as {
    groups?: Array<{
      group_name: string
      type?: string
      variables?: Array<{ value?: string }>
    }>
  }
  const retrievalParams = (dsl.components['retrieval-1']?.obj.params || {}) as {
    meta_data_filter?: { method?: string }
  }

  assert.deepEqual(parserParams.setups?.pdf?.preprocess, [
    'main_content',
    'title',
  ])
  assert.deepEqual(parserParams.setups?.pdf?.suffix, ['pdf'])
  assert.deepEqual(parserParams.setups?.video?.suffix, ['mp4', 'avi', 'mkv'])
  assert.equal(parserParams.setups?.video?.llm_id, 'vision-model@OpenAI')
  assert.equal(parserParams.setups?.video?.prompt, 'describe the clip')
  assert.deepEqual(splitterParams.delimiters, ['\n'])
  assert.deepEqual(splitterParams.children_delimiters, [
    '##',
  ])
  assert.equal(
    'enable_children' in
      ((dsl.components['splitter-1']?.obj.params as Record<string, unknown>) || {}),
    false,
  )
  const splitterParamsFull = (dsl.components['splitter-1']?.obj.params ||
    {}) as Record<string, unknown>
  assert.equal('table_context_size' in splitterParamsFull, false)
  assert.equal('image_context_size' in splitterParamsFull, false)
  assert.equal(
    typeof splitterParamsFull.image_table_context_window,
    'number',
  )
  assert.deepEqual(
    mergerParams.levels?.slice(0, 2),
    [['^#[^#]'], ['^##[^#]']],
  )
  assert.equal(invokeParams.variables?.[0]?.ref, 'begin@user_id')
  assert.deepEqual(iterationParams.outputs, {
    docs: {
      ref: 'generate@text',
      type: 'Array<string>',
    },
  })
  assert.equal(
    'output_items' in
      ((dsl.components['iteration-1']?.obj.params as Record<string, unknown>) ||
        {}),
    false,
  )
  assert.deepEqual(aggregatorParams.groups, [
    {
      group_name: 'documents',
      type: undefined,
      variables: [{ value: 'retrieval@json' }],
    },
  ])
  assert.equal(retrievalParams.meta_data_filter?.method, 'semi_auto')
})
