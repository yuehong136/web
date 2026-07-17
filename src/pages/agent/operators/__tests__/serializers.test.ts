import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasType } from '@/types/agent'
import {
  AgentGlobals,
  BeginId,
  FileId,
  NodeHandleId,
  Operator,
  RewriteQuestionHandleId,
  SwitchElseTo,
} from '../../constant'
import { agentOperatorRegistry } from '../registry'
import {
  buildGraphNode,
  buildInitialDsl,
  buildInitialGraph,
  deserializeDslToGraph,
  normalizeLegacyChunkerDsl,
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
  assert.deepEqual(
    pipelineGraph.nodes.map((node) => node.id),
    [FileId, 'Parser:initial'],
  )
  assert.deepEqual(
    pipelineGraph.nodes.map((node) => node.data.label),
    [Operator.File, Operator.Parser],
  )
  assert.deepEqual(pipelineGraph.edges, [
    {
      id: `${FileId}:${NodeHandleId.Start}:Parser:initial:${NodeHandleId.End}`,
      source: FileId,
      target: 'Parser:initial',
      sourceHandle: NodeHandleId.Start,
      targetHandle: NodeHandleId.End,
      type: 'buttonEdge',
    },
  ])
})

test('keyword extract falls back to ragNode while rewrite question keeps rewriteNode', () => {
  const keywordNode = buildGraphNode(Operator.KeywordExtract, {
    id: 'keyword-1',
  })
  const rewriteNode = buildGraphNode(Operator.RewriteQuestion, {
    id: 'rewrite-1',
  })

  assert.equal(keywordNode.type, 'ragNode')
  assert.equal(rewriteNode.type, 'rewriteNode')
})

test('serializeGraphToDsl excludes non-component operators but preserves persisted graph nodes', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-1',
    form: { content: ['hello'] },
  })
  const toolNode = buildGraphNode(Operator.Tool, {
    id: 'tool-1',
    form: { ignored: true },
  })
  const noteNode = buildGraphNode(Operator.Note, {
    id: 'note-1',
    form: { content: 'sticky' },
  })
  const placeholderNode = buildGraphNode(Operator.Placeholder, {
    id: 'placeholder-1',
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [beginNode, messageNode, toolNode, noteNode, placeholderNode],
      edges: [
        { id: 'e1', source: BeginId, target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'tool-1' },
        { id: 'e3', source: 'message-1', target: 'placeholder-1' },
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
  assert.deepEqual(dsl.graph?.nodes.map((node) => node.id).sort(), [
    BeginId,
    'message-1',
    'note-1',
    'tool-1',
  ])
  assert.equal(dsl.graph?.edges.length, 2)
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

  assert.deepEqual(dsl.components['message-object']?.obj.params.content, [
    'hello',
  ])

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
    (
      reconstructed.graph.nodes[0]?.data.form as
        | Record<string, unknown>
        | undefined
    )?.content,
    ['world'],
  )
})

test('buildInitialDsl seeds globals with all sys.* defaults', () => {
  const agentDsl = buildInitialDsl(AgentCanvasType.AGENT)
  const pipelineDsl = buildInitialDsl(AgentCanvasType.PIPELINE)

  for (const dsl of [agentDsl, pipelineDsl]) {
    assert.equal(dsl.globals?.[AgentGlobals.SysQuery], '')
    assert.equal(dsl.globals?.[AgentGlobals.SysUserId], '')
    assert.equal(dsl.globals?.[AgentGlobals.SysConversationTurns], 0)
    assert.deepEqual(dsl.globals?.[AgentGlobals.SysFiles], [])
    assert.deepEqual(dsl.globals?.[AgentGlobals.SysHistory], [])
    assert.equal(dsl.globals?.[AgentGlobals.SysDate], '')
  }
})

test('serializeGraphToDsl backfills missing sys.* globals while preserving caller-provided values', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })

  const dsl = serializeGraphToDsl({
    graph: { nodes: [beginNode], edges: [] },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: { [AgentGlobals.SysQuery]: 'kept-by-caller' },
      variables: {},
      retrieval: [],
    },
  })

  assert.equal(dsl.globals?.[AgentGlobals.SysQuery], 'kept-by-caller')
  assert.equal(dsl.globals?.[AgentGlobals.SysConversationTurns], 0)
  assert.deepEqual(dsl.globals?.[AgentGlobals.SysFiles], [])
})

test('serializeGraphToDsl writes conversation variables to variables and env globals', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })

  const dsl = serializeGraphToDsl({
    graph: { nodes: [beginNode], edges: [] },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {
        [AgentGlobals.SysQuery]: 'kept-query',
        [AgentGlobals.SysUserId]: 'user-1',
        'env.old': 'remove-me',
      },
      variables: {
        old: {
          name: 'old',
          type: 'string',
          value: 'remove-me',
        },
      },
      retrieval: [],
    },
    globalVariables: {
      city: {
        name: 'city',
        type: 'string',
        value: 'Shanghai',
        description: 'current city',
      },
      count: {
        name: 'count',
        type: 'number',
        value: 3,
      },
    },
  })

  assert.equal(dsl.globals?.[AgentGlobals.SysQuery], 'kept-query')
  assert.equal(dsl.globals?.[AgentGlobals.SysUserId], 'user-1')
  assert.equal(dsl.globals?.['env.city'], 'Shanghai')
  assert.equal(dsl.globals?.['env.count'], 3)
  assert.equal('env.old' in dsl.globals, false)
  assert.deepEqual(Object.keys(dsl.variables || {}).sort(), ['city', 'count'])
  assert.equal(dsl.variables?.city?.description, 'current city')
})

test('serializeGraphToDsl preserves existing variables when no global variable override is provided', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })

  const dsl = serializeGraphToDsl({
    graph: { nodes: [beginNode], edges: [] },
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {
        [AgentGlobals.SysQuery]: 'kept-query',
        'env.city': 'Shanghai',
      },
      variables: {
        city: {
          name: 'city',
          type: 'string',
          value: 'Shanghai',
        },
      },
      retrieval: [],
    },
  })

  assert.equal(dsl.globals?.['env.city'], 'Shanghai')
  assert.equal(dsl.variables?.city?.value, 'Shanghai')
})

test('buildInitialDsl always includes path as an empty array', () => {
  const agentDsl = buildInitialDsl(AgentCanvasType.AGENT)
  const pipelineDsl = buildInitialDsl(AgentCanvasType.PIPELINE)

  assert.ok(Array.isArray(agentDsl.path), 'agent dsl.path should be an array')
  assert.deepEqual(agentDsl.path, [])
  assert.ok(
    Array.isArray(pipelineDsl.path),
    'pipeline dsl.path should be an array',
  )
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

test('components-only reconstruction skips terminal operators without source handles', () => {
  const reconstructed = deserializeDslToGraph(
    {
      components: {
        [BeginId]: {
          obj: {
            component_name: Operator.Begin,
            params: {},
          },
          downstream: ['message-1', 'exit-loop-1'],
          upstream: [],
        },
        'parser-1': {
          obj: {
            component_name: Operator.Parser,
            params: {},
          },
          downstream: ['tokenizer-1'],
          upstream: [],
        },
        'tokenizer-1': {
          obj: {
            component_name: Operator.Tokenizer,
            params: {},
          },
          downstream: ['Splitter:legacy'],
          upstream: ['parser-1'],
        },
        'Splitter:legacy': {
          obj: {
            component_name: 'Splitter',
            params: {},
          },
          downstream: [],
          upstream: ['tokenizer-1'],
        },
        'message-1': {
          obj: {
            component_name: Operator.Message,
            params: { content: ['route onward'] },
          },
          downstream: ['switch-1'],
          upstream: [BeginId],
        },
        'exit-loop-1': {
          obj: {
            component_name: Operator.ExitLoop,
            params: {},
          },
          downstream: ['message-1'],
          upstream: [BeginId],
        },
        'switch-1': {
          obj: {
            component_name: Operator.Switch,
            params: { conditions: [] },
          },
          downstream: [],
          upstream: ['message-1'],
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

  const terminalSources = ['message-1', 'tokenizer-1', 'exit-loop-1']

  assert.ok(
    reconstructed.graph.edges.some(
      (item) => item.source === BeginId && item.target === 'message-1',
    ),
  )
  assert.equal(
    reconstructed.graph.edges.some(
      (item) => item.source === 'message-1' && item.target === 'switch-1',
    ),
    false,
  )
  assert.ok(
    reconstructed.graph.edges.some(
      (item) => item.source === 'parser-1' && item.target === 'tokenizer-1',
    ),
  )
  assert.deepEqual(
    reconstructed.graph.edges
      .filter((item) => terminalSources.includes(item.source))
      .map((item) => `${item.source}->${item.target}`),
    [],
  )
})

test('legacy chunker DSL is normalized before graph reconstruction', () => {
  const legacyDsl = {
    components: {
      'Splitter:old': {
        obj: {
          component_name: 'Splitter',
          params: {
            prompts: 'Use {Splitter:old@chunks}',
          },
        },
        downstream: ['HierarchicalMerger:old'],
        upstream: ['Parser:old'],
      },
      'HierarchicalMerger:old': {
        obj: {
          component_name: 'HierarchicalMerger',
          params: {
            levels: [['^#[^#]']],
          },
        },
        downstream: [],
        upstream: ['Splitter:old'],
      },
    },
    path: [['Splitter:old']],
    graph: {
      nodes: [
        {
          id: 'Splitter:old',
          type: 'splitterNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'Splitter',
            name: 'Splitter',
            form: {
              query: '{Splitter:old@chunks}',
            },
          },
        },
        {
          id: 'HierarchicalMerger:old',
          type: 'splitterNode',
          position: { x: 200, y: 0 },
          data: {
            label: 'HierarchicalMerger',
            name: 'HierarchicalMerger',
            form: {},
          },
        },
      ],
      edges: [
        {
          id: 'Splitter:old:start:HierarchicalMerger:old:end',
          source: 'Splitter:old',
          target: 'HierarchicalMerger:old',
        },
      ],
    },
    history: ['{Splitter:old@chunks}'],
    messages: [],
    reference: [],
    globals: {},
    retrieval: [],
  }

  const normalized = normalizeLegacyChunkerDsl(legacyDsl)
  assert.ok(normalized?.components?.['TokenChunker:old'])
  assert.ok(normalized?.components?.['TitleChunker:old'])
  assert.equal(
    normalized?.components?.['TokenChunker:old']?.obj.component_name,
    Operator.TokenChunker,
  )
  assert.equal(
    normalized?.components?.['TitleChunker:old']?.obj.component_name,
    Operator.TitleChunker,
  )
  assert.deepEqual(normalized?.path, [['TokenChunker:old']])
  assert.equal(normalized?.graph?.nodes?.[0]?.type, 'chunkerNode')
  assert.equal(
    (normalized?.graph?.nodes?.[0]?.data.form as { query?: string } | undefined)
      ?.query,
    '{TokenChunker:old@chunks}',
  )
  assert.equal(
    normalized?.graph?.edges?.[0]?.id,
    'TokenChunker:old:start:TitleChunker:old:end',
  )

  const reconstructed = deserializeDslToGraph(legacyDsl)
  assert.deepEqual(
    reconstructed.graph.nodes.map((node) => node.id),
    ['TokenChunker:old', 'TitleChunker:old'],
  )
  assert.deepEqual(
    reconstructed.graph.nodes.map((node) => node.data.label),
    [Operator.TokenChunker, Operator.TitleChunker],
  )
})

test('legacy PDFGenerator DSL is normalized to DocGenerator', () => {
  const legacyDsl = {
    components: {
      'PDFGenerator:report': {
        obj: {
          component_name: 'PDFGenerator',
          params: { outputs: { download: { type: 'string' } } },
        },
        downstream: ['Message:answer'],
        upstream: [],
      },
      'Message:answer': {
        obj: {
          component_name: 'Message',
          params: { content: ['{PDFGenerator:report@download}'] },
        },
        downstream: [],
        upstream: ['PDFGenerator:report'],
      },
    },
    path: [['PDFGenerator:report', 'Message:answer']],
    graph: {
      nodes: [
        {
          id: 'PDFGenerator:report',
          type: 'ragNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'PDFGenerator',
            name: 'PDFGenerator',
            form: {},
          },
        },
      ],
      edges: [],
    },
    history: [],
    messages: [],
    reference: [],
    globals: {},
    retrieval: [],
  }

  const normalized = normalizeLegacyChunkerDsl(legacyDsl)

  assert.ok(normalized?.components?.['DocGenerator:report'])
  assert.equal(
    normalized?.components?.['DocGenerator:report']?.obj.component_name,
    Operator.DocGenerator,
  )
  assert.deepEqual(normalized?.path, [
    ['DocGenerator:report', 'Message:answer'],
  ])
  const messageParams = normalized?.components?.['Message:answer']?.obj
    .params as { content?: string[] } | undefined
  assert.equal(messageParams?.content?.[0], '{DocGenerator:report@download}')
})

test('rewrite question keeps ragflow b/c handle ids when graph is authoritative', () => {
  const beginNode = buildGraphNode(Operator.Begin, { id: BeginId })
  const rewriteNode = buildGraphNode(Operator.RewriteQuestion, {
    id: 'rewrite-1',
    form: { llm_id: 'llm-1' },
  })
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-1',
    form: { content: ['done'] },
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [beginNode, rewriteNode, messageNode],
      edges: [
        {
          id: 'begin-to-rewrite',
          source: BeginId,
          target: 'rewrite-1',
          sourceHandle: NodeHandleId.Start,
          targetHandle: RewriteQuestionHandleId.Left,
        },
        {
          id: 'rewrite-to-message',
          source: 'rewrite-1',
          target: 'message-1',
          sourceHandle: RewriteQuestionHandleId.Right,
          targetHandle: NodeHandleId.End,
        },
      ],
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

  assert.equal(
    dsl.graph?.edges.find((edge) => edge.target === 'rewrite-1')?.targetHandle,
    RewriteQuestionHandleId.Left,
  )
  assert.equal(
    dsl.graph?.edges.find((edge) => edge.source === 'rewrite-1')?.sourceHandle,
    RewriteQuestionHandleId.Right,
  )

  const reconstructed = deserializeDslToGraph(dsl, {
    canvasType: AgentCanvasType.AGENT,
  })

  assert.equal(
    reconstructed.graph.nodes.find((node) => node.id === 'rewrite-1')?.type,
    'rewriteNode',
  )
  assert.equal(
    reconstructed.graph.edges.find((edge) => edge.target === 'rewrite-1')
      ?.targetHandle,
    RewriteQuestionHandleId.Left,
  )
  assert.equal(
    reconstructed.graph.edges.find((edge) => edge.source === 'rewrite-1')
      ?.sourceHandle,
    RewriteQuestionHandleId.Right,
  )
})

test('components-only rewrite question reconstructs ragflow b/c handles', () => {
  const reconstructed = deserializeDslToGraph(
    {
      components: {
        [BeginId]: {
          obj: {
            component_name: Operator.Begin,
            params: {},
          },
          downstream: ['rewrite-1'],
          upstream: [],
        },
        'rewrite-1': {
          obj: {
            component_name: Operator.RewriteQuestion,
            params: { llm_id: 'llm-1' },
          },
          downstream: ['message-1'],
          upstream: [BeginId],
        },
        'message-1': {
          obj: {
            component_name: Operator.Message,
            params: { content: ['done'] },
          },
          downstream: [],
          upstream: ['rewrite-1'],
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

  assert.equal(
    reconstructed.graph.nodes.find((node) => node.id === 'rewrite-1')?.type,
    'rewriteNode',
  )
  assert.equal(
    reconstructed.graph.edges.find((edge) => edge.target === 'rewrite-1')
      ?.targetHandle,
    RewriteQuestionHandleId.Left,
  )
  assert.equal(
    reconstructed.graph.edges.find((edge) => edge.source === 'rewrite-1')
      ?.sourceHandle,
    RewriteQuestionHandleId.Right,
  )
})

test('deserializeDslToGraph fixes iteration child layout metadata', () => {
  const reconstructed = deserializeDslToGraph(
    {
      components: {
        'iteration-1': {
          obj: {
            component_name: Operator.Iteration,
            params: {},
          },
          downstream: [],
          upstream: [],
        },
        'iteration-start-1': {
          obj: {
            component_name: Operator.IterationStart,
            params: {},
          },
          downstream: [],
          upstream: [],
          parent_id: 'iteration-1',
        },
        'agent-1': {
          obj: {
            component_name: Operator.Agent,
            params: {},
          },
          downstream: [],
          upstream: [],
          parent_id: 'iteration-1',
        },
      },
      history: [],
      messages: [],
      reference: [],
      globals: {},
      retrieval: [],
      graph: {
        nodes: [
          {
            id: 'iteration-1',
            type: 'iterationNode',
            position: { x: 120, y: 120 },
            data: { label: Operator.Iteration, name: 'Iteration_1', form: {} },
          },
          {
            id: 'iteration-start-1',
            type: 'iterationStartNode',
            parentId: 'iteration-1',
            position: { x: 420, y: 32 },
            draggable: false,
            data: {
              label: Operator.IterationStart,
              name: 'Iteration Item',
              form: {},
            },
          },
          {
            id: 'agent-1',
            type: 'agentNode',
            parentId: 'iteration-1',
            position: { x: 12, y: 8 },
            expandParent: true,
            data: { label: Operator.Agent, name: 'Agent_1', form: {} },
          },
        ],
        edges: [],
      },
    },
    { canvasType: AgentCanvasType.AGENT },
  )

  const startNode = reconstructed.graph.nodes.find(
    (node) => node.id === 'iteration-start-1',
  )
  const agentNode = reconstructed.graph.nodes.find(
    (node) => node.id === 'agent-1',
  )

  assert.deepEqual(startNode?.position, { x: 24, y: 108 })
  assert.equal(startNode?.expandParent, false)
  assert.deepEqual(agentNode?.position, { x: 116, y: 24 })
  assert.equal(agentNode?.expandParent, false)
})

test('high-risk rebuilt operators serialize UI-only form state back to backend request shapes', () => {
  const parserNode = buildGraphNode(Operator.Parser, {
    id: 'parser-1',
    form: {
      setups: [
        {
          fileFormat: 'pdf',
          preprocess: ['title'],
          flatten_media_to_text: true,
        },
        {
          fileFormat: 'video',
          llm_id: 'vision-model@OpenAI',
          prompt: 'describe the clip',
        },
      ],
    },
  })
  const tokenChunkerNode = buildGraphNode(Operator.TokenChunker, {
    id: 'TokenChunker:token-1',
    form: {
      delimiter_mode: 'delimiter',
      delimiters: [{ value: '\n' }],
      enable_children: true,
      children_delimiters: [{ value: '##' }],
      image_table_context_window: 3,
    },
  })
  const titleChunkerNode = buildGraphNode(Operator.TitleChunker, {
    id: 'TitleChunker:title-1',
    form: {
      hierarchyRules: [
        { levels: [{ expression: '^#[^#]' }] },
        { levels: [{ expression: '^##[^#]' }] },
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
        tokenChunkerNode,
        titleChunkerNode,
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
      {
        preprocess?: string[]
        suffix?: string[]
        flatten_media_to_text?: boolean
        prompt?: string
        llm_id?: string
      }
    >
  }
  const tokenChunkerParams = (dsl.components['TokenChunker:token-1']?.obj
    .params || {}) as {
    delimiters?: string[]
    children_delimiters?: string[]
  }
  const titleChunkerParams = (dsl.components['TitleChunker:title-1']?.obj
    .params || {}) as {
    levels?: string[][]
  }
  const invokeParams = (dsl.components['invoke-1']?.obj.params || {}) as {
    variables?: Array<{ ref?: string }>
  }
  const iterationParams = (dsl.components['iteration-1']?.obj.params || {}) as {
    outputs?: Record<string, { ref?: string; type?: string }>
  }
  const aggregatorParams = (dsl.components['aggregator-1']?.obj.params ||
    {}) as {
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
  assert.equal(parserParams.setups?.pdf?.flatten_media_to_text, true)
  assert.deepEqual(parserParams.setups?.video?.suffix, ['mp4', 'avi', 'mkv'])
  assert.equal(parserParams.setups?.video?.llm_id, 'vision-model@OpenAI')
  assert.equal(parserParams.setups?.video?.prompt, 'describe the clip')
  assert.equal(
    dsl.components['TokenChunker:token-1']?.obj.component_name,
    Operator.TokenChunker,
  )
  assert.equal(
    dsl.components['TitleChunker:title-1']?.obj.component_name,
    Operator.TitleChunker,
  )
  assert.deepEqual(tokenChunkerParams.delimiters, ['\n'])
  assert.deepEqual(tokenChunkerParams.children_delimiters, ['##'])
  assert.equal(
    'enable_children' in
      ((dsl.components['TokenChunker:token-1']?.obj.params as Record<
        string,
        unknown
      >) || {}),
    false,
  )
  const tokenChunkerParamsFull = (dsl.components['TokenChunker:token-1']?.obj
    .params || {}) as Record<string, unknown>
  assert.equal('image_table_context_window' in tokenChunkerParamsFull, false)
  assert.equal(tokenChunkerParamsFull.table_context_size, 3)
  assert.equal(tokenChunkerParamsFull.image_context_size, 3)
  assert.equal(typeof tokenChunkerParamsFull.overlapped_percent, 'number')
  assert.deepEqual(titleChunkerParams.levels?.slice(0, 2), [
    ['^#[^#]'],
    ['^##[^#]'],
  ])
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

test('serializeGraphToDsl folds agent sub-agents and exception edges into ragflow agent params', () => {
  const parentAgent = buildGraphNode(Operator.Agent, {
    id: 'agent-parent',
    form: {
      tools: [
        {
          component_name: Operator.Google,
          id: 'google-tool',
          name: 'Google',
          params: { query: 'search' },
        },
      ],
      mcp: [{ mcp_id: 'mcp-1', tools: {} }],
      exception_method: 'goto',
    },
  })
  const childAgent = buildGraphNode(Operator.Agent, {
    id: 'agent-child',
    form: {
      description: 'child agent',
    },
  })
  const toolNode = buildGraphNode(Operator.Tool, {
    id: 'Tool:agent-parent',
  })
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-1',
    form: { content: ['done'] },
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [parentAgent, childAgent, toolNode, messageNode],
      edges: [
        {
          id: 'edge-main',
          source: 'agent-parent',
          target: 'message-1',
          sourceHandle: NodeHandleId.Start,
          targetHandle: NodeHandleId.End,
        },
        {
          id: 'edge-tool',
          source: 'agent-parent',
          target: 'Tool:agent-parent',
          sourceHandle: NodeHandleId.Tool,
          targetHandle: NodeHandleId.End,
        },
        {
          id: 'edge-child',
          source: 'agent-parent',
          target: 'agent-child',
          sourceHandle: NodeHandleId.AgentBottom,
          targetHandle: NodeHandleId.AgentTop,
        },
        {
          id: 'edge-exception',
          source: 'agent-parent',
          target: 'message-1',
          sourceHandle: NodeHandleId.AgentException,
          targetHandle: NodeHandleId.End,
        },
      ],
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

  assert.deepEqual(Object.keys(dsl.components).sort(), [
    'agent-parent',
    'message-1',
  ])
  assert.deepEqual(dsl.components['agent-parent']?.downstream, ['message-1'])

  const agentParams = (dsl.components['agent-parent']?.obj.params ||
    {}) as Record<string, unknown>
  const tools = Array.isArray(agentParams.tools)
    ? (agentParams.tools as Array<Record<string, unknown>>)
    : []

  assert.deepEqual(agentParams.exception_goto, ['message-1'])
  assert.deepEqual(
    tools.map((tool) => tool.component_name),
    [Operator.Google, Operator.Agent],
  )
  assert.equal(tools[1]?.id, 'agent-child')
  assert.equal(tools[1]?.name, 'Agent')
})

test('serializeGraphToDsl writes categorize handle targets back into category_description', () => {
  const categorizeNode = buildGraphNode(Operator.Categorize, {
    id: 'categorize-1',
    form: {
      items: [
        {
          name: 'Approved',
          uuid: 'cat-approved',
          index: 0,
          examples: [{ value: 'ok' }],
        },
      ],
    },
  })
  const messageNode = buildGraphNode(Operator.Message, {
    id: 'message-1',
    form: { content: ['done'] },
  })

  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [categorizeNode, messageNode],
      edges: [
        {
          id: 'edge-category',
          source: 'categorize-1',
          target: 'message-1',
          sourceHandle: 'cat-approved',
          targetHandle: NodeHandleId.End,
        },
      ],
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

  const params = (dsl.components['categorize-1']?.obj.params || {}) as Record<
    string,
    unknown
  >
  const categoryDescription = (params.category_description || {}) as Record<
    string,
    Record<string, unknown>
  >

  assert.equal('items' in params, false)
  assert.deepEqual(categoryDescription.Approved?.to, ['message-1'])
  assert.deepEqual(categoryDescription.Approved?.examples, ['ok'])
})

test('deserializeDslToGraph keeps graph form authoritative when graph and components both exist', () => {
  const reconstructed = deserializeDslToGraph(
    {
      components: {
        'message-1': {
          obj: {
            component_name: Operator.Message,
            params: {
              content: ['component-value'],
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
      graph: {
        nodes: [
          {
            id: 'message-1',
            type: 'messageNode',
            position: { x: 120, y: 120 },
            data: {
              label: Operator.Message,
              name: 'Message',
              form: {
                content: ['graph-value'],
              },
            },
          },
        ],
        edges: [],
      },
    },
    { canvasType: AgentCanvasType.AGENT },
  )

  assert.deepEqual(
    (reconstructed.graph.nodes[0]?.data.form as Record<string, unknown>)
      ?.content,
    ['graph-value'],
  )
})

test('deserializeDslToGraph reconstructs handle-driven edges from components-only dsl', () => {
  const reconstructed = deserializeDslToGraph(
    {
      components: {
        'agent-parent': {
          obj: {
            component_name: Operator.Agent,
            params: {
              tools: [
                {
                  component_name: Operator.Google,
                  id: 'google-tool',
                  name: 'Google',
                  params: {},
                },
                {
                  component_name: Operator.Agent,
                  id: 'agent-child',
                  name: 'Child Agent',
                  params: {
                    tools: [],
                    exception_goto: ['message-1'],
                  },
                },
              ],
              mcp: [{ mcp_id: 'mcp-1', tools: {} }],
              exception_goto: ['message-1'],
            },
          },
          downstream: ['message-1'],
          upstream: [],
        },
        'categorize-1': {
          obj: {
            component_name: Operator.Categorize,
            params: {
              category_description: {
                Approved: {
                  index: 0,
                  uuid: 'cat-approved',
                  examples: ['ok'],
                  to: ['message-1'],
                },
              },
            },
          },
          downstream: ['message-1'],
          upstream: [],
        },
        'switch-1': {
          obj: {
            component_name: Operator.Switch,
            params: {
              conditions: [
                {
                  logical_operator: 'and',
                  items: [{ operator: '=' }],
                  to: ['message-1'],
                },
              ],
              [SwitchElseTo]: ['message-2'],
            },
          },
          downstream: ['message-1', 'message-2'],
          upstream: [],
        },
        'message-1': {
          obj: {
            component_name: Operator.Message,
            params: { content: ['done'] },
          },
          downstream: [],
          upstream: ['agent-parent', 'categorize-1', 'switch-1'],
        },
        'message-2': {
          obj: {
            component_name: Operator.Message,
            params: { content: ['fallback'] },
          },
          downstream: [],
          upstream: ['switch-1'],
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

  const graph = reconstructed.graph
  const agentNode = graph.nodes.find((node) => node.id === 'agent-parent')
  const toolNode = graph.nodes.find((node) => node.id === 'Tool:agent-parent')
  const agentForm = (agentNode?.data.form || {}) as Record<string, unknown>

  assert.ok(toolNode)
  assert.ok(graph.nodes.find((node) => node.id === 'agent-child'))
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'agent-parent' &&
        edge.target === 'agent-child' &&
        edge.sourceHandle === NodeHandleId.AgentBottom &&
        edge.targetHandle === NodeHandleId.AgentTop,
    ),
  )
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'agent-parent' &&
        edge.target === 'Tool:agent-parent' &&
        edge.sourceHandle === NodeHandleId.Tool,
    ),
  )
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'agent-parent' &&
        edge.target === 'message-1' &&
        edge.sourceHandle === NodeHandleId.AgentException,
    ),
  )
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'categorize-1' &&
        edge.target === 'message-1' &&
        edge.sourceHandle === 'cat-approved',
    ),
  )
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'switch-1' &&
        edge.target === 'message-1' &&
        edge.sourceHandle === 'Case 1',
    ),
  )
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.source === 'switch-1' &&
        edge.target === 'message-2' &&
        edge.sourceHandle === SwitchElseTo,
    ),
  )

  const tools = Array.isArray(agentForm.tools)
    ? (agentForm.tools as Array<Record<string, unknown>>)
    : []
  assert.deepEqual(
    tools.map((tool) => tool.component_name),
    [Operator.Google],
  )
})
