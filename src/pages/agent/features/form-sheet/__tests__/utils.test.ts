import assert from 'node:assert/strict'
import test from 'node:test'
import type { MCPServer } from '@/types/mcp'
import { Operator } from '../../../constant'
import { buildGraphNode } from '../../../operators'
import { getOperatorDefinition } from '../../../operators/registry'
import {
  canShowSingleStepDebug,
  isFormSheetTitleEditable,
  MCP_FORM_RENDERER_KEY,
  resolveFormSheetDescription,
  resolveFormSheetIconKey,
  resolveLegacyRendererKey,
  resolveSelectedToolContext,
} from '../utils'

test('normal operator metadata resolves from registry defaults', () => {
  const operatorDefinition = getOperatorDefinition(Operator.Agent)

  assert.equal(
    resolveFormSheetDescription({
      operatorType: Operator.Agent,
      operatorDefinition,
    }),
    operatorDefinition?.description,
  )
  assert.equal(
    resolveFormSheetIconKey({
      operatorType: Operator.Agent,
      operatorDefinition,
    }),
    operatorDefinition?.iconKey,
  )
  assert.equal(
    resolveLegacyRendererKey(Operator.Agent, false),
    Operator.Agent,
  )
})

test('root nodes stay read-only while normal nodes remain editable', () => {
  assert.equal(
    isFormSheetTitleEditable(getOperatorDefinition(Operator.Begin)),
    false,
  )
  assert.equal(
    isFormSheetTitleEditable(getOperatorDefinition(Operator.File)),
    false,
  )
  assert.equal(isFormSheetTitleEditable(getOperatorDefinition(Operator.Tool)), true)
})

test('debug availability is driven by registry metadata', () => {
  assert.equal(
    canShowSingleStepDebug(getOperatorDefinition(Operator.Agent)),
    true,
  )
  assert.equal(
    canShowSingleStepDebug(getOperatorDefinition(Operator.Begin)),
    false,
  )
})

test('tool context resolves legacy tool metadata and MCP context separately', () => {
  const agentNode = buildGraphNode(Operator.Agent, {
    id: 'agent-1',
    form: {
      tools: [
        {
          id: 'wiki-tool',
          component_name: Operator.Wikipedia,
          name: 'Wiki Search',
          description: 'Search Wikipedia entries.',
          params: { top_n: 5 },
        },
      ],
      mcp: [
        {
          mcp_id: 'mcp-1',
          tools: {
            search_docs: {
              description: 'Search docs',
            },
          },
        },
      ],
    },
  })
  const toolNode = buildGraphNode(Operator.Tool, {
    id: 'tool-node-1',
  })
  const operatorDefinition = getOperatorDefinition(Operator.Tool)
  const toolContext = resolveSelectedToolContext({
    operatorType: Operator.Tool,
    clickedToolId: 'wiki-tool',
    currentNodeId: 'tool-node-1',
    nodes: [agentNode, toolNode],
    edges: [
      {
        id: 'agent-tool-edge',
        source: agentNode.id,
        target: toolNode.id,
      },
    ],
    mcpServers: [],
  })
  const mcpServer: MCPServer = {
    id: 'mcp-1',
    name: 'Docs MCP',
    url: 'https://example.com/mcp',
    server_type: 'http',
    description: 'Reusable MCP toolchain.',
  }
  const mcpContext = resolveSelectedToolContext({
    operatorType: Operator.Tool,
    clickedToolId: 'mcp-1',
    currentNodeId: 'tool-node-1',
    nodes: [agentNode, toolNode],
    edges: [
      {
        id: 'agent-tool-edge',
        source: agentNode.id,
        target: toolNode.id,
      },
    ],
    mcpServers: [mcpServer],
  })

  assert.equal(toolContext?.operator, Operator.Wikipedia)
  assert.equal(toolContext?.agentNodeId, agentNode.id)
  assert.equal(toolContext?.toolIndex, 0)
  assert.equal(
    resolveFormSheetDescription({
      operatorType: Operator.Tool,
      operatorDefinition,
      toolContext,
    }),
    'Search Wikipedia entries.',
  )
  assert.equal(
    resolveFormSheetIconKey({
      operatorType: Operator.Tool,
      operatorDefinition,
      toolContext,
    }),
    Operator.Wikipedia,
  )
  assert.equal(
    resolveLegacyRendererKey(Operator.Tool, Boolean(toolContext?.mcpServer)),
    Operator.Tool,
  )

  assert.equal(mcpContext?.mcpServer?.id, 'mcp-1')
  assert.equal(mcpContext?.agentNodeId, agentNode.id)
  assert.equal(mcpContext?.mcpIndex, 0)
  assert.equal(
    resolveFormSheetDescription({
      operatorType: Operator.Tool,
      operatorDefinition,
      toolContext: mcpContext,
    }),
    'Reusable MCP toolchain.',
  )
  assert.equal(
    resolveFormSheetIconKey({
      operatorType: Operator.Tool,
      operatorDefinition,
      toolContext: mcpContext,
    }),
    Operator.Tool,
  )
  assert.equal(
    resolveLegacyRendererKey(Operator.Tool, Boolean(mcpContext?.mcpServer)),
    MCP_FORM_RENDERER_KEY,
  )
})

test('unknown operators fall back safely when no renderer or registry metadata exists', () => {
  assert.equal(resolveLegacyRendererKey(undefined, false), undefined)
  assert.equal(
    resolveFormSheetDescription({
      operatorType: 'UnknownOperator' as Operator,
    }),
    'UnknownOperator 节点仍在复用旧表单内容层。',
  )
  assert.equal(
    resolveFormSheetIconKey({
      operatorType: 'UnknownOperator' as Operator,
    }),
    'UnknownOperator',
  )
})
