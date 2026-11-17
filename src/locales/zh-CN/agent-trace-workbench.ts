export const traceWorkbenchMessages = {
  notRecorded: '未记录',
  runStatus: {
    running: '运行中',
    success: '成功',
    error: '失败',
    partial: '部分可用',
    missing: '不可用',
  },
  spanStatus: {
    running: '运行中',
    success: '成功',
    error: '失败',
    unknown: '未知',
  },
  spanKind: {
    node: '节点',
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
      title: '缺少 message id',
      description:
        '当前 session 没有可用于回查 Redis Trace 的真实 message id。',
    },
    redisEvicted: {
      title: 'Trace 不可恢复',
      description: 'Redis Trace 没有返回数据，可能已经过期或运行时未写入。',
    },
    backendEmpty: {
      title: '后端返回空 Trace',
      description: 'Trace 请求成功，但后端返回了空 payload。',
    },
    queryError: {
      title: 'Trace 查询失败',
      description: 'Trace 请求失败，请刷新或检查后端 trace 接口状态。',
    },
    loading: {
      title: '正在加载 Trace',
      description: '正在读取 session detail 与终态 Redis Trace。',
    },
  },
  header: {
    spanCount_one: '{{count}} spans',
    spanCount_other: '{{count}} spans',
    toolCount_one: '{{count}} tools',
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
    title: '执行链路',
    waterfall: '耗时瀑布',
    latency: 'Latency',
  },
  spanRow: {
    view: '查看节点 {{name}}',
    durationShare: '耗时占比 {{percent}}%',
  },
  spanDetail: {
    empty: '请选择一个节点。',
    kind: '类型 {{kind}}',
    duration: '耗时 {{duration}}',
    id: 'ID',
    component: '组件',
    parent: '父节点',
    message: '消息',
  },
  errorPanel: {
    empty: '当前节点未记录错误',
    emptyHint: '如果回答异常但 Trace 正常，请继续查看 Payload 与 Raw JSON。',
    spanError: '节点错误',
  },
  insight: {
    keyFields: '关键字段',
    empty: '当前节点没有可自动提取的 Prompt、Query 或 Context 字段。',
    contextSource: '上下文源码',
    contextEmpty: '未记录上下文',
  },
  io: {
    input: '输入',
    inputEmpty: '未记录输入',
    output: '输出',
    outputEmpty: '未记录输出',
  },
  raw: {
    currentSpan: '当前节点',
    run: '本次运行',
  },
  jsonViewer: {
    notProvided: '接口未提供',
    collapsedLines_one: '... 已折叠 {{count}} 行 ...',
    collapsedLines_other: '... 已折叠 {{count}} 行 ...',
    expand: '展开{{title}}',
    collapse: '折叠{{title}}',
    copy: '复制{{title}}',
  },
  debug: {
    title: '脱敏调试包',
    hint: '仅用于排查，敏感字段会在复制前脱敏。',
    copy: '复制调试包',
    copied: 'Debug bundle 已复制',
  },
}
