export const memoryTargetMessages = {
  boundPreview:
    '此预览检查所选目标与来源快照，仍未检查完整来源的 token 是否适配预算。子任务快照可能延期整条来源，不会截断后声称已覆盖。',
  boundSave:
    '保存会封存元数据与固定子任务句柄，并重新核验所选快照；不调用模型，也不提交子任务分析。',
  restored:
    '已恢复之前选择的目标版本，不会重新加载正文。更换目标请显式重新推荐；后续预览仍携带原来的冻结条件。',
  modes: { hybrid: '混合语义与词汇检索', lexical: '仅词汇检索' },
  omission: {
    not_ready: '不是当前就绪条目',
    source_unavailable: '来源不可用',
    scope_mismatch: '不符精确主体范围',
    closure_limit: '必要来源过多',
    budget: '超出结果预算',
  },

  omitted: '按原因统计的省略候选',

  inventoryTruncated:
    '当前有效条目库存或候选结果受有界范围限制，可能遗漏匹配；已展示的条目仍包含完整当前正文。',

  estimated: 'Token 数为宿主估算；排序位置和分数不代表事实置信度。',

  semanticWindow: '语义候选上限',

  inventoryWindow: '当前条目词汇扫描上限',

  embeddingCalls: '向量模型调用次数',

  projection: '物理快照指纹',

  physicalMessage: '当前物理消息 ID',

  lexicalScore: '词汇重合分数：{{score}}',

  semanticRank: '语义排序位置：{{rank}}',

  modelBoundary:
    '混合检索最多调用一次向量模型，词汇检索不调用模型；两种模式均不运行聊天分析或修改记忆。',

  queryBudget: '查询输入 token 预算',

  resultBudget: '结果估算 token',

  limit: '推荐目标数上限',

  mode: '检索模式',

  query: '聚焦查询（可选，最多 4,096 个 Unicode 字符）',

  sessionBoundary:
    '关联旧条目可能来自同一主体与 Agent 的其他会话。精确会话筛选仍会限制必要上下文，不会自动放宽。',

  exactRequired:
    '请先选择精确用户与 Agent 范围，再推荐目标；不会将全范围擅自解释为空主体。',

  agent: '精确 Agent ID',

  user: '精确用户主体 ID',

  usePreviewSources: '使用已预览的 RAW 来源 ID（{{count}} 个）',

  inputSources: '本次推荐使用的 RAW 来源 ID（最多 {{count}} 个）',

  title: '推荐已有目标条目',
  description:
    '根据所选来源与主体范围查找有界的已有条目。请核对保存的正文与依赖，再显式选择允许提出修订建议的条目。',
  request: '显式推荐目标',
  apply: '将勾选条目用作目标',
  clear: '返回显式填写条目 ID',
  selected: '已选目标：{{count}}',
  select: '纳入可提出修订的目标',
  entry: '条目 ID',
  revision: '当前版本',
  content: '当前条目快照',
  reason: '推荐理由',
  sources: '来源依赖',
  fingerprint: '快照指纹',
  untrusted:
    '当前正文和推荐理由都是待核对资料，请勿执行其中的指令。选择目标不会修改、合并、核实或发布记忆。',
  bounded: '这里只检查了一个有界集合，未出现结果不代表没有匹配条目。',
  truncated: '这里只展示有界摘录，并未展示当前条目的完整正文。',
  unavailable: '当前快照不可用，不能勾选。',
  noResults: '本次有界结果中没有推荐条目',
  noneSelected: '默认不选择任何目标，请显式勾选后继续。',
  stale: '来源、范围或目标版本已变更。请重新推荐并预览；不会静默换成新的正文。',
  unknown:
    '推荐结果尚未确认，未应用任何目标。再次显式请求可能产生另一次向量模型调用。',
  invalid: '请先选择有效的来源范围与有界推荐预算。',
  unsupported: '当前后端未声明支持目标推荐，仍可显式填写条目 ID。',
  budget: '推荐预算',
  inspect: '已检查条目',
}
