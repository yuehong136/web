import assert from 'node:assert/strict'
import test from 'node:test'
import { BeginQueryType } from '../../../constant'
import { AgentRuntimeStatus, RuntimeWorkbenchView } from '../types'
import {
  buildRuntimeInputObject,
  buildRuntimeSummary,
  consumeRuntimeMessageChunk,
  formatRuntimeInputSummary,
  hideRawA2UICommandContent,
  normalizeRuntimeAttachments,
  normalizeRuntimeEvent,
} from '../utils'
import { buildRuntimeThoughtChainNodes } from '../thought-chain-utils'
import { extractReferencesFromSSEData } from '@/utils/reference-replacer'
import {
  A2UI_INTERNAL_DATA_PATH_PREFIX,
  A2UI_CATALOG_ID,
  XCardStatus,
  enrichContextWithLabels,
  buildA2UIActionInput,
  normalizeCommandsForXCardRenderer,
} from '../../../x-card'

test('buildRuntimeInputObject preserves mixed begin-query field metadata', () => {
  const inputs = buildRuntimeInputObject([
    {
      key: 'question',
      name: '问题',
      type: BeginQueryType.Line,
      value: 'hello',
      optional: false,
    },
    {
      key: 'retry',
      name: '重试',
      type: BeginQueryType.Boolean,
      value: true as unknown as string,
      optional: true,
    },
    {
      key: 'limit',
      name: '数量',
      type: BeginQueryType.Integer,
      value: 3 as unknown as string,
      optional: false,
    },
    {
      key: 'attachment',
      name: '附件',
      type: BeginQueryType.File,
      value: [
        {
          id: 'file-1',
          name: 'report.pdf',
          type: 'pdf',
        },
      ] as unknown as string,
      optional: true,
    },
    {
      key: 'mode',
      name: '模式',
      type: BeginQueryType.Options,
      value: 'fast',
      optional: false,
      options: ['fast', 'safe'],
    },
  ])

  assert.deepEqual(Object.keys(inputs), [
    'question',
    'retry',
    'limit',
    'attachment',
    'mode',
  ])
  assert.equal(inputs.question?.value, 'hello')
  assert.equal(inputs.question?.order, 0)
  assert.equal(inputs.retry?.value, true)
  assert.equal(inputs.limit?.value, 3)
  assert.deepEqual(inputs.mode?.options, ['fast', 'safe'])
  assert.equal(
    (inputs.attachment?.value as unknown as Array<{ id: string }>)[0]?.id,
    'file-1',
  )
})

test('formatRuntimeInputSummary renders readable labels and values', () => {
  const summary = formatRuntimeInputSummary([
    {
      key: 'question',
      name: '问题',
      type: BeginQueryType.Line,
      value: 'hello',
      optional: false,
    },
    {
      key: 'attachment',
      name: '附件',
      type: BeginQueryType.File,
      value: [{ id: 'file-1', name: 'report.pdf' }] as unknown as string,
      optional: true,
    },
  ])

  assert.equal(summary, '问题: hello\n附件: report.pdf')
})

test('normalizeRuntimeAttachments handles upload payloads and scalar values', () => {
  const attachments = normalizeRuntimeAttachments([
    {
      id: 'file-1',
      name: 'report.pdf',
      extension: 'pdf',
      mime_type: 'application/pdf',
      preview_url: '/preview/report.pdf',
      size: 1024,
    },
    {
      filename: 'image.png',
      type: 'png',
      url: '/preview/image.png',
    },
    {
      doc_id: 'doc-1',
      file_name: 'ragflow-report.docx',
      format: 'docx',
    },
  ])

  assert.deepEqual(attachments, [
    {
      id: 'file-1',
      name: 'report.pdf',
      extension: 'pdf',
      mime_type: 'application/pdf',
      preview_url: '/preview/report.pdf',
      size: 1024,
      type: 'pdf',
      mimeType: 'application/pdf',
      url: '/preview/report.pdf',
    },
    {
      filename: 'image.png',
      type: 'png',
      url: '/preview/image.png',
      name: 'image.png',
      mimeType: undefined,
      size: undefined,
    },
    {
      doc_id: 'doc-1',
      file_name: 'ragflow-report.docx',
      format: 'docx',
      name: 'ragflow-report.docx',
      type: 'docx',
      mimeType: undefined,
      size: undefined,
      url: undefined,
    },
  ])
})

test('normalizeRuntimeEvent merges document downloads into workflow attachments', () => {
  const event = normalizeRuntimeEvent({
    event: 'workflow_finished',
    data: {
      outputs: {
        attachment: {
          doc_id: 'attachment-1',
          file_name: 'answer.md',
          format: 'markdown',
        },
        downloads: [
          {
            doc_id: 'document-1',
            filename: 'report.pdf',
            mime_type: 'application/pdf',
            size: 2048,
          },
        ],
      },
    },
  })
  const data = event.data as {
    outputs?: { attachment?: unknown }
  }

  assert.deepEqual(normalizeRuntimeAttachments(data.outputs?.attachment), [
    {
      doc_id: 'attachment-1',
      file_name: 'answer.md',
      format: 'markdown',
      name: 'answer.md',
      type: 'markdown',
      mimeType: undefined,
      size: undefined,
      url: undefined,
    },
    {
      doc_id: 'document-1',
      filename: 'report.pdf',
      mime_type: 'application/pdf',
      size: 2048,
      name: 'report.pdf',
      type: undefined,
      mimeType: 'application/pdf',
      url: undefined,
    },
  ])
})

test('normalizeRuntimeEvent extracts ids, log events, and runtime errors', () => {
  const logEvent = normalizeRuntimeEvent({
    event: 'node_finished',
    message_id: 'message-1',
    task_id: 'task-1',
    session_id: 'session-1',
    data: {
      component_id: 'generate_0',
      outputs: { answer: 'done' },
    },
    retcode: 0,
  })

  assert.equal(logEvent.event, 'node_finished')
  assert.equal(logEvent.messageId, 'message-1')
  assert.equal(logEvent.taskId, 'task-1')
  assert.equal(logEvent.sessionId, 'session-1')
  assert.equal(logEvent.outputContent, 'done')
  assert.deepEqual(logEvent.logEvent, {
    event: 'node_finished',
    message_id: 'message-1',
    task_id: 'task-1',
    data: {
      component_id: 'generate_0',
      outputs: { answer: 'done' },
    },
  })

  const errorEvent = normalizeRuntimeEvent({
    event: 'workflow_finished',
    message_id: 'message-1',
    code: 500,
    retmsg: 'runtime failed',
    data: {},
  })

  assert.equal(errorEvent.errorMessage, 'runtime failed')

  const wrappedEvent = normalizeRuntimeEvent({
    event: 'node_finished',
    message_id: 'message-2',
    data: {
      data: {
        component_id: 'agent_1',
        outputs: { content: 'fallback answer' },
      },
    },
  })

  assert.equal(wrappedEvent.outputContent, 'fallback answer')
  assert.deepEqual(wrappedEvent.logEvent?.data, {
    component_id: 'agent_1',
    outputs: { content: 'fallback answer' },
  })
})

test('normalizeRuntimeEvent extracts A2UI v0.9 commands incrementally', () => {
  const normalized = normalizeRuntimeEvent({
    event: 'a2ui_command',
    data: {
      surface_id: 'message-card',
      commands: [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'message-card',
            catalogId: A2UI_CATALOG_ID,
          },
        },
        {
          version: 'v0.8',
          surfaceUpdate: {
            surfaceId: 'legacy',
            components: [],
          },
        },
      ],
    },
  })

  assert.equal(normalized.event, 'a2ui_command')
  assert.equal(normalized.xCardStatus, XCardStatus.READY)
  assert.deepEqual(normalized.xCardSurfaceIds, ['message-card'])
  assert.equal(normalized.xCardCommands?.length, 1)
  const command = normalized.xCardCommands?.[0] as
    | { createSurface?: { surfaceId?: string } }
    | undefined
  assert.equal(command?.createSurface?.surfaceId, 'message-card')
})

test('normalizeRuntimeEvent preserves raw A2UI JSON from node output fallback', () => {
  const content =
    '[{"version":"v0.9","createSurface":{"surfaceId":"message-card","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}]'
  const normalized = normalizeRuntimeEvent({
    event: 'node_finished',
    message_id: 'message-1',
    data: {
      component_id: 'agent_1',
      outputs: {
        content,
      },
    },
  })

  assert.equal(normalized.outputContent, content)
})

test('hideRawA2UICommandContent hides only raw A2UI command payloads', () => {
  assert.equal(
    hideRawA2UICommandContent(
      'before [{"version":"v0.9","createSurface":{"surfaceId":"message-card","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}] after',
    ),
    'before [{"version":"v0.9","createSurface":{"surfaceId":"message-card","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}] after',
  )
  assert.equal(
    hideRawA2UICommandContent(
      '[{"version":"v0.9","createSurface":{"surfaceId":"message-card","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}]',
    ),
    '',
  )
  assert.equal(
    hideRawA2UICommandContent(
      '{"version":"v0.9","updateDataModel":{"surfaceId":"message-card","path":"/name","value":"Alice"}}\n{"version":"v0.9","deleteSurface":{"surfaceId":"message-card"}}',
    ),
    '',
  )
})

test('buildA2UIActionInput builds standard A2UI action request metadata', () => {
  const input = buildA2UIActionInput({
    name: 'submit',
    surfaceId: 'message-card',
    sourceComponentId: 'submit-button',
    timestamp: '2026-04-29T09:00:00.000Z',
    context: { name: 'Alice' },
  })

  assert.equal(
    input.query,
    [
      '用户触发了卡片操作：submit',
      '',
      'A2UI action:',
      '- surfaceId: message-card',
      '- sourceComponentId: submit-button',
      '',
      '表单数据(JSON):',
      '{\n  "name": "Alice"\n}',
    ].join('\n'),
  )
  assert.deepEqual(input.a2ui, [
    {
      version: 'v0.9',
      action: {
        name: 'submit',
        surfaceId: 'message-card',
        sourceComponentId: 'submit-button',
        timestamp: '2026-04-29T09:00:00.000Z',
        context: { name: 'Alice' },
      },
    },
  ])
  assert.deepEqual(input.metadata, {
    a2uiClientCapabilities: {
      'v0.9': {
        supportedCatalogIds: [A2UI_CATALOG_ID],
        inlineCatalogs: [],
      },
    },
    a2uiClientContext: {
      version: 'v0.9',
      surfaces: {
        'message-card': { name: 'Alice' },
      },
    },
  })
  assert.equal('inputs' in input, false)
})

test('enrichContextWithLabels pairs ChoicePicker values with their visible labels', () => {
  const commands = normalizeCommandsForXCardRenderer([
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'sports-registration',
        components: [
          {
            id: 'grade',
            component: 'ChoicePicker',
            value: { path: '/grade' },
            options: [
              { value: 'grade-1', label: '高一' },
              { value: 'grade-2', label: '高二' },
            ],
          },
          {
            id: 'submit-button',
            component: 'Button',
            child: 'submit-label',
            action: {
              event: {
                name: 'submitSportsRegistration',
                context: {
                  grade: { path: '/grade' },
                  studentId: { path: '/studentId' },
                },
              },
            },
          },
        ],
      },
    },
  ])

  const enriched = enrichContextWithLabels(commands, {
    name: 'submitSportsRegistration',
    surfaceId: 'sports-registration',
    sourceComponentId: 'submit-button',
    timestamp: '2026-04-29T09:00:00.000Z',
    context: {
      grade: ['grade-1'],
      studentId: '2006',
    },
  })

  assert.deepEqual(enriched, {
    grade: [{ value: 'grade-1', label: '高一' }],
    studentId: '2006',
  })
})

test('normalizeCommandsForXCardRenderer derives internal writable dataPath strings', () => {
  const commands = normalizeCommandsForXCardRenderer([
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'message-card',
        components: [
          {
            id: 'query',
            component: 'TextField',
            value: { path: '/sqlQuery' },
          },
        ],
      },
    },
  ])

  const command = commands[0] as
    | {
        updateComponents?: {
          components?: Array<{ dataPath?: string }>
        }
      }
    | undefined

  assert.equal(
    command?.updateComponents?.components?.[0]?.dataPath,
    `${A2UI_INTERNAL_DATA_PATH_PREFIX}/sqlQuery`,
  )
})

test('normalizeCommandsForXCardRenderer infers Basic Catalog writable paths', () => {
  const commands = normalizeCommandsForXCardRenderer([
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'message-card',
        components: [
          {
            id: 'email',
            component: 'TextField',
            value: { path: '/form/email' },
          },
          {
            id: 'plan',
            component: 'ChoicePicker',
            value: { path: '/form/plan' },
          },
        ],
      },
    },
  ])

  const command = commands[0] as
    | {
        updateComponents?: {
          components?: Array<{ dataPath?: string }>
        }
      }
    | undefined

  assert.equal(
    command?.updateComponents?.components?.[0]?.dataPath,
    `${A2UI_INTERNAL_DATA_PATH_PREFIX}/form/email`,
  )
  assert.equal(
    command?.updateComponents?.components?.[1]?.dataPath,
    `${A2UI_INTERNAL_DATA_PATH_PREFIX}/form/plan`,
  )
})

test('normalizeCommandsForXCardRenderer adapts Basic Catalog List and Tabs shapes', () => {
  const commands = normalizeCommandsForXCardRenderer([
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'message-card',
        components: [
          {
            id: 'record-list',
            component: 'List',
            children: {
              path: '/records',
              componentId: 'record-item',
            } as unknown as string[],
          },
          {
            id: 'tabs',
            component: 'Tabs',
            tabs: [
              { title: '今日', child: 'today' },
              { title: '本周', child: 'week' },
            ],
          },
        ],
      },
    },
  ])

  const command = commands[0] as
    | {
        updateComponents?: {
          components?: Array<{
            children?: unknown
            items?: unknown
            itemsPath?: string
            tabTitles?: string[]
          }>
        }
      }
    | undefined

  assert.equal(command?.updateComponents?.components?.[0]?.children, undefined)
  assert.deepEqual(command?.updateComponents?.components?.[0]?.items, {
    path: '/records',
  })
  assert.equal(
    command?.updateComponents?.components?.[0]?.itemsPath,
    '/records',
  )
  assert.deepEqual(command?.updateComponents?.components?.[1]?.children, [
    'today',
    'week',
  ])
  assert.deepEqual(command?.updateComponents?.components?.[1]?.tabTitles, [
    '今日',
    '本周',
  ])
})

test('normalizeCommandsForXCardRenderer preserves canonical component payloads without legacy props flattening', () => {
  const commands = normalizeCommandsForXCardRenderer([
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'message-card',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['title-card', 'name'],
          },
          {
            id: 'title-card',
            component: 'Card',
            props: { title: '考勤', children: ['name'] },
          },
          {
            id: 'name',
            component: 'Text',
            props: {
              text: { value: { path: '/user/name' } },
            },
          },
          {
            id: 'confirm',
            component: 'CheckBox',
            props: {
              checked: { value: { path: '/form/confirmed' } },
            },
          },
          {
            id: 'submit',
            component: 'Button',
            props: { text: '提交' },
            actions: [{ event: { name: 'submit' } }],
          },
        ],
      },
    },
  ])

  const command = commands[0] as
    | {
        updateComponents?: {
          components?: Array<{
            action?: unknown
            checked?: unknown
            children?: unknown
            props?: unknown
            text?: unknown
            value?: unknown
          }>
        }
      }
    | undefined
  const components = command?.updateComponents?.components || []

  assert.deepEqual(components[0]?.children, ['title-card', 'name'])
  assert.deepEqual(components[1]?.props, { title: '考勤', children: ['name'] })
  assert.deepEqual(components[2]?.props, {
    text: { value: { path: '/user/name' } },
  })
  assert.deepEqual(components[3]?.props, {
    checked: { value: { path: '/form/confirmed' } },
  })
  assert.equal(components[3]?.value, undefined)
  assert.equal(components[4]?.action, undefined)
})

test('consumeRuntimeMessageChunk keeps main content and thinking content separate', () => {
  const first = consumeRuntimeMessageChunk(undefined, {
    content: 'Answer: ',
  })
  const second = consumeRuntimeMessageChunk(first.nextState, {
    start_to_think: true,
    content: 'reason about tools',
  })
  const third = consumeRuntimeMessageChunk(second.nextState, {
    end_to_think: true,
  })
  const fourth = consumeRuntimeMessageChunk(third.nextState, {
    content: 'done',
    final: true,
  })

  assert.equal(first.nextState.content, 'Answer: ')
  assert.equal(second.nextState.content, 'Answer:')
  assert.equal(second.nextState.thinking, 'reason about tools')
  assert.equal(fourth.nextState.content, 'Answer: done')
  assert.equal(fourth.nextState.thinking, 'reason about tools')
  assert.equal(fourth.isFinal, true)
})

test('consumeRuntimeMessageChunk preserves raw A2UI command JSON in message state', () => {
  const content =
    '[{"version":"v0.9","createSurface":{"surfaceId":"message-card","catalogId":"https://a2ui.org/specification/v0_9/basic_catalog.json"}}]'
  const chunk = consumeRuntimeMessageChunk(undefined, {
    content,
    final: true,
  })

  assert.equal(chunk.nextState.content, content)
})

test('buildRuntimeThoughtChainNodes maps SSE node events to chain status', () => {
  const runningNodes = buildRuntimeThoughtChainNodes(
    [
      {
        event: 'node_started',
        data: {
          component_id: 'begin',
          component_name: 'Begin',
          component_type: 'Begin',
          inputs: { query: 'hello' },
        },
      },
      {
        event: 'node_finished',
        data: {
          component_id: 'begin',
          component_name: 'Begin',
          component_type: 'Begin',
          elapsed_time: 0.12,
          outputs: { query: 'hello' },
        },
      },
      {
        event: 'node_started',
        data: {
          component_id: 'generate_1',
          component_name: 'Generate',
          component_type: 'Generate',
          inputs: { prompt: 'hello' },
        },
      },
    ],
    true,
  )

  assert.equal(runningNodes.length, 2)
  assert.equal(runningNodes[0]?.status, 'success')
  assert.equal(runningNodes[0]?.elapsedTime, 0.12)
  assert.deepEqual(runningNodes[0]?.outputs, { query: 'hello' })
  assert.equal(runningNodes[1]?.status, 'loading')
  assert.equal(runningNodes[1]?.blink, true)
  assert.equal(runningNodes[1]?.actionKind, 'action')
  assert.equal(runningNodes[1]?.actionLabel, 'Agent Action')

  const toolNodes = buildRuntimeThoughtChainNodes([
    {
      event: 'node_finished',
      data: {
        component_id: 'retrieval_1',
        component_name: 'Knowledge Query',
        component_type: 'Retrieval',
        outputs: { chunks: ['doc-a'] },
      },
    },
  ])

  assert.equal(toolNodes[0]?.actionKind, 'tool')
  assert.equal(toolNodes[0]?.actionLabel, 'Tool Call')

  const failedNodes = buildRuntimeThoughtChainNodes(
    [
      {
        event: 'node_finished',
        data: {
          component_id: 'generate_1',
          component_name: 'Generate',
          component_type: 'Generate',
          outputs: { _ERROR: 'model unavailable' },
        },
      },
    ],
    false,
  )

  assert.equal(failedNodes[0]?.status, 'error')
  assert.equal(failedNodes[0]?.error, 'model unavailable')
})

test('extractReferencesFromSSEData preserves object chunk reference ids', () => {
  const references = extractReferencesFromSSEData({
    reference: {
      chunks: {
        '290': {
          id: 'chunk-290',
          content: 'OpenClaw summary',
          document_id: 'doc-1',
          document_name: 'lesson.docx',
          dataset_id: 'dataset-1',
        },
        '2': {
          id: 'chunk-2',
          content: 'Xiaomi agent',
          document_id: 'doc-1',
          document_name: 'lesson.docx',
          dataset_id: 'dataset-1',
        },
      },
    },
  })

  assert.deepEqual(
    references.map((chunk) => chunk.reference_index),
    [2, 290],
  )
  assert.equal(references[0]?.id, 'chunk-2')
  assert.equal(references[1]?.id, 'chunk-290')
})

test('buildRuntimeSummary keeps the public runtime rail shape stable', () => {
  const summary = buildRuntimeSummary({
    status: AgentRuntimeStatus.SUCCESS,
    currentView: RuntimeWorkbenchView.LOG,
    messageCount: 3,
    hasLogs: true,
    lastRunAt: 123,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
  })

  assert.deepEqual(summary, {
    status: AgentRuntimeStatus.SUCCESS,
    currentView: RuntimeWorkbenchView.LOG,
    messageCount: 3,
    hasLogs: true,
    lastRunAt: 123,
    lastMessageId: 'message-1',
    lastTaskId: 'task-1',
    lastError: undefined,
  })
})
