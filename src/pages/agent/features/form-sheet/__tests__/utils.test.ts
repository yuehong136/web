import assert from 'node:assert/strict'
import test from 'node:test'
import type { MCPServer } from '@/types/mcp'
import { Operator } from '../../../constant'
import { buildGraphNode } from '../../../operators'
import { getOperatorDefinition } from '../../../operators/registry'
import {
  CodeExecDebugStatus,
  canShowSingleStepDebug,
  groupCodeExecDebugOutput,
  isFormSheetTitleEditable,
  MCP_FORM_RENDERER_KEY,
  normalizeCodeExecActualTypeForContract,
  parseCodeExecAttachmentLink,
  parseCodeExecContractMismatch,
  resolveFormSheetDescription,
  resolveFormSheetIconKey,
  resolveLegacyRendererKey,
  resolveSelectedToolContext,
  shouldUseCodeExecDebugLayout,
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
  assert.equal(resolveLegacyRendererKey(Operator.Agent, false), Operator.Agent)
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
  assert.equal(
    isFormSheetTitleEditable(getOperatorDefinition(Operator.Tool)),
    true,
  )
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

test('CodeExec debug layout is selected only for Code nodes', () => {
  assert.equal(shouldUseCodeExecDebugLayout(Operator.Code), true)
  assert.equal(shouldUseCodeExecDebugLayout(Operator.Agent), false)
})

test('groupCodeExecDebugOutput separates business value and system outputs', () => {
  const grouped = groupCodeExecDebugOutput(
    {
      answer: { ok: true },
      actual_type: 'object',
      raw_result: { ok: true },
      content: 'printed log',
      _ERROR: '',
      _ARTIFACTS: ['chart.png'],
      attachments: ['chart.png'],
      _ATTACHMENT_CONTENT: [{ name: 'chart.png' }],
      ignored: 'value',
    },
    {
      name: 'answer',
      type: 'object',
    },
  )

  assert.equal(grouped.businessOutputName, 'answer')
  assert.deepEqual(grouped.businessOutputValue, { ok: true })
  assert.equal(grouped.hasBusinessOutput, true)
  assert.equal(grouped.expectedType, 'object')
  assert.equal(grouped.actualType, 'object')
  assert.deepEqual(grouped.rawResult, { ok: true })
  assert.equal(grouped.content, 'printed log')
  assert.equal(grouped.status, CodeExecDebugStatus.Succeeded)
  assert.deepEqual(grouped.attachments, ['chart.png'])
  assert.deepEqual(grouped.systemOutputs, {
    _ERROR: '',
    _ARTIFACTS: ['chart.png'],
    actual_type: 'object',
    raw_result: { ok: true },
    content: 'printed log',
    attachments: ['chart.png'],
    _ATTACHMENT_CONTENT: [{ name: 'chart.png' }],
  })
})

test('groupCodeExecDebugOutput falls back to raw_result when business key is absent', () => {
  const grouped = groupCodeExecDebugOutput(
    {
      actual_type: 'array',
      raw_result: [1, 2, 3],
      content: '',
    },
    {
      name: 'result',
      type: 'array',
    },
  )

  assert.equal(grouped.businessOutputName, 'result')
  assert.equal(grouped.businessOutputValue, undefined)
  assert.equal(grouped.hasBusinessOutput, true)
  assert.deepEqual(grouped.rawResult, [1, 2, 3])
  assert.equal(grouped.status, CodeExecDebugStatus.Succeeded)
})

test('CodeExec debug output treats _ERROR as a failed run', () => {
  const grouped = groupCodeExecDebugOutput(
    {
      result: null,
      _ERROR: 'Exception executing code',
      actual_type: '',
      raw_result: null,
      attachments: [],
    },
    {
      name: 'result',
      type: 'string',
    },
  )

  assert.equal(grouped.status, CodeExecDebugStatus.ExecutionError)
  assert.equal(grouped.errorMessage, 'Exception executing code')
  assert.equal(grouped.suggestedType, undefined)
})

test('CodeExec execution errors do not suggest output type changes', () => {
  const grouped = groupCodeExecDebugOutput(
    {
      result: null,
      _ERROR: 'Exception executing code',
      actual_type: 'Object',
      raw_result: { partial: true },
    },
    {
      name: 'result',
      type: 'string',
    },
  )

  assert.equal(grouped.status, CodeExecDebugStatus.ExecutionError)
  assert.equal(grouped.actualType, 'Object')
  assert.equal(grouped.suggestedType, undefined)
})

test('CodeExec contract mismatch extracts expected and actual types', () => {
  const message =
    'CodeExec contract mismatch at value: expected type String, got Object'
  const mismatch = parseCodeExecContractMismatch(message)
  const grouped = groupCodeExecDebugOutput(
    {
      result: null,
      _ERROR: message,
      actual_type: 'Object',
      raw_result: { result: 'success' },
    },
    {
      name: 'result',
      type: 'string',
    },
  )

  assert.deepEqual(mismatch, {
    expectedType: 'String',
    actualType: 'Object',
  })
  assert.equal(grouped.status, CodeExecDebugStatus.ContractError)
  assert.deepEqual(grouped.contractMismatch, mismatch)
  assert.equal(grouped.suggestedType, 'object')
  assert.equal(normalizeCodeExecActualTypeForContract('Object'), 'object')
})

test('CodeExec attachment strings are normalized into safe links', () => {
  assert.deepEqual(
    parseCodeExecAttachmentLink(
      '[Download result.csv](/v1/document/artifact/a)',
    ),
    {
      label: 'Download result.csv',
      href: '/v1/document/artifact/a',
    },
  )
  assert.deepEqual(parseCodeExecAttachmentLink('javascript:alert(1)'), {
    label: 'javascript:alert(1)',
  })
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
    'UnknownOperator node is still using legacy form content.',
  )
  assert.equal(
    resolveFormSheetIconKey({
      operatorType: 'UnknownOperator' as Operator,
    }),
    'UnknownOperator',
  )
})
