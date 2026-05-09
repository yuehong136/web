import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  adaptAgentTraceItems,
  buildTraceRunViewModel,
} from '@/pages/agent/adapters/trace'
import { TraceEmptyState } from '../components/trace-empty-state'
import { TraceSpanTree } from '../components/trace-span-tree'
import {
  createTraceWorkbenchDebugBundle,
  resolveDefaultTraceSpanId,
} from '../hooks/use-trace-workbench'
import { formatTraceDuration, formatTracePayload } from '../utils'

test('trace workbench defaults to the first error span', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'slow_node',
        component_name: 'Agent',
        status: 'success',
        elapsed_time: 9,
      },
      {
        component_id: 'failed_node',
        component_name: 'Tool',
        status: 'failed',
        message: 'tool failed',
        elapsed_time: 1,
      },
    ]),
  })

  assert.equal(resolveDefaultTraceSpanId(viewModel), viewModel.spans[1]?.id)
})

test('trace workbench defaults to the slowest span when there is no error', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'fast_node',
        component_name: 'Begin',
        status: 'success',
        elapsed_time: 0.5,
      },
      {
        component_id: 'slow_node',
        component_name: 'Agent',
        status: 'success',
        elapsed_time: 6,
      },
    ]),
  })

  assert.equal(resolveDefaultTraceSpanId(viewModel), viewModel.spans[1]?.id)
})

test('trace empty state renders unavailable reason specific content', () => {
  const noMessageMarkup = renderToStaticMarkup(
    <TraceEmptyState reason="no-message-id" />,
  )
  const queryErrorMarkup = renderToStaticMarkup(
    <TraceEmptyState reason="query-error" />,
  )

  assert.match(noMessageMarkup, /缺少 message id/)
  assert.match(queryErrorMarkup, /Trace 查询失败/)
})

test('trace debug bundle masks sensitive fields', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'agent_0',
        component_name: 'Agent',
        status: 'success',
        inputs: {
          token: 'token-value',
          nested: { api_key: 'api-key-value' },
        },
        trace: [
          {
            tool_name: 'http_request',
            arguments: { authorization: 'Bearer secret-token' },
            result: { password: 'secret-password' },
          },
        ],
      },
    ]),
  })
  const bundle = createTraceWorkbenchDebugBundle(
    viewModel,
    viewModel.spans[0]?.id,
  )
  const serialized = JSON.stringify(bundle)

  assert.match(serialized, /\[MASKED\]/)
  assert.doesNotMatch(serialized, /token-value/)
  assert.doesNotMatch(serialized, /api-key-value/)
  assert.doesNotMatch(serialized, /secret-token/)
  assert.doesNotMatch(serialized, /secret-password/)
})

test('trace span tree renders tool child spans', () => {
  const viewModel = buildTraceRunViewModel({
    canvasId: 'canvas-1',
    messageId: 'message-1',
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'agent_0',
        component_name: 'Agent',
        status: 'success',
        trace: [
          {
            tool_name: 'tavily_search',
            arguments: { query: 'ragflow' },
            result: { ok: true },
          },
        ],
      },
    ]),
  })
  const markup = renderToStaticMarkup(
    <TraceSpanTree
      spans={viewModel.spans}
      selectedSpanId={viewModel.spans[0]?.children[0]?.id}
      onSelect={() => {}}
    />,
  )

  assert.match(markup, /Agent/)
  assert.match(markup, /tavily_search/)
})

test('trace workbench source does not parse raw trace field names', () => {
  const files = [
    'src/pages/agent/features/trace-workbench/index.tsx',
    'src/pages/agent/features/trace-workbench/hooks/use-trace-workbench.ts',
    'src/pages/agent/features/trace-workbench/components/trace-header.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-summary-strip.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-span-tree.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-span-row.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-span-detail.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-insight-panel.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-io-panel.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-json-viewer.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-raw-panel.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-error-panel.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-debug-actions.tsx',
    'src/pages/agent/features/trace-workbench/components/trace-empty-state.tsx',
  ]
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')

  assert.doesNotMatch(source, /tool_name|elapsed_time|component_id/)
})

test('trace workbench formats durations in seconds without rounding to zero', () => {
  assert.equal(formatTraceDuration(0), '未记录')
  assert.equal(formatTraceDuration(0.0004), '0.001s')
  assert.equal(formatTraceDuration(0.0012), '0.001s')
  assert.equal(formatTraceDuration(0.008), '0.008s')
  assert.equal(formatTraceDuration(1.606), '1.606s')
})

test('trace workbench dedupes identical input and output array entries for display', () => {
  const payload = formatTracePayload(
    [{ query: 'openclaw' }, { query: 'openclaw' }, { query: 'ragflow' }],
    'empty',
    { dedupeArrays: true },
  )

  assert.equal(
    payload.text,
    JSON.stringify([{ query: 'openclaw' }, { query: 'ragflow' }], null, 2),
  )
})
