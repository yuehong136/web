export const traceWorkbenchMessages = {
  notRecorded: 'Not recorded',
  runStatus: {
    running: 'Running',
    success: 'Succeeded',
    error: 'Failed',
    partial: 'Partial',
    missing: 'Unavailable',
  },
  spanStatus: {
    running: 'Running',
    success: 'Succeeded',
    error: 'Failed',
    unknown: 'Unknown',
  },
  spanKind: {
    node: 'Node',
    llm: 'LLM',
    tool: 'Tool',
    retrieval: 'Retrieval',
    control: 'Control',
    data: 'Data',
    webhook: 'Webhook',
    system: 'System',
  },
  emptyState: {
    noMessageId: {
      title: 'Missing message id',
      description:
        'This session has no real message id to look up the Redis Trace.',
    },
    redisEvicted: {
      title: 'Trace unrecoverable',
      description:
        'Redis returned no Trace data. It may have expired or was never written at runtime.',
    },
    backendEmpty: {
      title: 'Backend returned an empty Trace',
      description:
        'The Trace request succeeded, but the backend returned an empty payload.',
    },
    queryError: {
      title: 'Trace query failed',
      description:
        'The Trace request failed. Refresh or check the backend trace endpoint.',
    },
    loading: {
      title: 'Loading Trace',
      description: 'Reading the session detail and the final Redis Trace.',
    },
  },
  header: {
    spanCount_one: '{{count}} span',
    spanCount_other: '{{count}} spans',
    toolCount_one: '{{count}} tool',
    toolCount_other: '{{count}} tools',
  },
  tabs: {
    payload: 'Payload',
    context: 'Prompt & Context',
    output: 'Output',
    raw: 'Raw JSON',
    errors: 'Errors',
  },
  spanTree: {
    title: 'Execution path',
    waterfall: 'Latency waterfall',
    latency: 'Latency',
  },
  spanRow: {
    view: 'View node {{name}}',
    durationShare: 'Share of total time {{percent}}%',
  },
  spanDetail: {
    empty: 'Select a node.',
    kind: 'Type {{kind}}',
    duration: 'Duration {{duration}}',
    id: 'ID',
    component: 'Component',
    parent: 'Parent node',
    message: 'Message',
  },
  errorPanel: {
    empty: 'No errors recorded for this node',
    emptyHint:
      'If the answer looks wrong but the Trace is clean, check Payload and Raw JSON.',
    spanError: 'Node error',
  },
  insight: {
    keyFields: 'Key fields',
    empty:
      'No Prompt, Query, or Context fields could be extracted from this node.',
    contextSource: 'Context source',
    contextEmpty: 'No context recorded',
  },
  io: {
    input: 'Input',
    inputEmpty: 'No input recorded',
    output: 'Output',
    outputEmpty: 'No output recorded',
  },
  raw: {
    currentSpan: 'Current node',
    run: 'This run',
  },
  jsonViewer: {
    notProvided: 'Not provided by the API',
    collapsedLines_one: '... {{count}} line collapsed ...',
    collapsedLines_other: '... {{count}} lines collapsed ...',
    expand: 'Expand {{title}}',
    collapse: 'Collapse {{title}}',
    copy: 'Copy {{title}}',
  },
  debug: {
    title: 'Redacted debug bundle',
    hint: 'For troubleshooting only. Sensitive fields are masked before copying.',
    copy: 'Copy debug bundle',
    copied: 'Debug bundle copied',
  },
}
