export const memoryCompactionMessages = {
  retention: {
    title: '产物库存与清理',
    boundary:
      '额度只统计已登记的压缩产物。清理仅移除所选产物及其存储副本，保留原始 RAW、长期记忆和人工审核记录；不会自动清理。',
    retained_count: '占用额度的产物',
    available_slots: '可用额度',
    retired_count: '清理回执',
    unsettled_count: '尚未结算的操作',
    quota:
      '产物上限：{{count}}；在途或状态未知的写入：{{busy}}。统计仅代表当前快照。',
    full: '产物额度已满。请先预览可清理的已完成产物，再显式确认。',
    refreshInventory: '刷新产物库存',
    select: '从下方打开一项产物，查看其清理范围。',
    preview: '预览产物清理范围',
    previewFailed: '暂时无法确认清理范围，请重新读取预览；尚未清理任何内容。',
    impact: '来源绑定：{{count}}；释放产物额度：{{slots}}。',
    clearsPackage:
      '将清除该产物中的生成摘要、保留原文副本和来源绑定，现有消费引用将停止提供上下文。',
    noPackage: '当前已没有生成正文，预览列出此产物剩余的来源绑定。',
    audit: '保留原操作、身份与哈希审计回执。这不代表已认证备份中的数据被擦除。',
    confirmLabel:
      '我理解此产物无法通过原操作重新打开或再次生成，且原始 RAW 来源不会被删除。',
    confirm: '确认清理此产物',
    confirming: '正在确认此产物的清理结果…',
    retired:
      '产物正文已清除。原操作只保留只读回执，旧引用不能再提供上下文，也不会触发重新生成。',
    changed: '预览已不再是当前状态，尚未确认清理；请重新读取预览后再决定。',
    unknown:
      '清理结果尚未确认，请保留原操作并读取状态，不要以新生成请求恢复此次操作。',
    readFailed: '暂时无法读取原操作，请保留原句柄并再次读取；未发送生成请求。',
    recover: '读取原清理回执',
    blockers: {
      already_retired: '此产物已经清理。',
      not_creator: '只有原产物创建者可以确认清理。',
      memory_not_active: '此记忆库当前未启用。',
      generation_unsettled: '生成或最终结果尚未结算，不能清理。',
      writer_not_drained: '实际供应商请求尚未排空，清理不能替代停止请求。',
      metadata_unavailable: '服务端暂时无法确认清理前置条件，不能清理。',
    },
  },
  copyReference: '复制消费引用',
  referenceReading: '正在核对当前来源绑定…',
  referenceCopied: '已复制四字段引用，未复制或应用摘要及来源正文。',
  referenceUnavailable: '无法复制当前有效引用。原操作已保留，未重复生成。',
  referenceBoundary:
    '引用不代表应用、审核或事实核验。外部消费者仍须重新读取并校验原操作，为完整请求和输出预留计算预算；此处不核实生成或重复消费的费用。',
  title: '上下文压缩',
  newRequest: '显式生成请求',
  recent: '找回已有产物',
  metadataOnly:
    '列表只有已存储元数据，未检查来源当前是否有效。请打开原操作读取最新状态，列出记录不会生成产物。',
  storedState: '已存状态',
  open: '打开原操作',
  empty: '此有界分页未找到产物。',
  refreshList: '刷新元数据列表',
  previous: '上一页',
  next: '下一页',
  requiresManaged:
    '生成需要有效的受管记忆库和已登记的有效 RAW 来源。请先检查所选来源，仅通过现有明确确认动作启用受管模式。',
  description: '显式生成并审阅独立、绑定来源版本的上下文产物。',
  boundary:
    '生成会调用收费模型。它不会应用产物、替换原始来源、核实事实，也不会写入或发布长期记忆。',
  noAutomatic:
    '打开、刷新与轮询只读取原操作，不会再次生成、应用结果或发布记忆。',
  unsupported: '当前后端不支持显式上下文压缩。',
  sources: '按顺序选择根 RAW 来源 ID',
  orderBoundary:
    '按对话顺序选择本库最多 {{count}} 条根 RAW 来源，不会自动按 ID 排序。旧 RAW 视为不可拆分的整块，不猜测缺失的工具调用配对边界。',
  invalidSources:
    '请按预期顺序输入 1–{{count}} 条不重复的正 int64 十进制来源 ID，不可四舍五入。',
  generate: '生成压缩产物（模型费用）',
  inspect: '查看／登记所选来源',
  prefix: '压缩开头的来源条数',
  prefixBoundary:
    '压缩这些前缀整条来源，其余后缀按原文保留。无法确定安全配对边界时，压缩前缀中的工具声明将被拒绝。',
  inputBudget: '分析输入 token 预算',
  outputBudget: '模型输出 token 上限',
  packageBudget: '完整产物包 token 预算',
  invalidRequest: '请检查来源顺序、前缀条数及整数 token 预算，尚未发送请求。',
  artifact: '独立上下文产物',
  snapshot:
    '这是绑定来源版本的快照，不代表已应用到对话或事实已确认。使用前请重新读取原操作，核对当前有效性。',
  operation: '原压缩操作',
  recoveryLabel: '上下文产物操作，未应用',
  recoveryBoundary:
    '此操作只生成独立的上下文产物。索引就绪不代表发布或应用。请在压缩工作区查看当前绑定来源的产物，不支持通用写入对账。',
  refresh: '读取当前状态',
  unknown:
    '生成结果尚未确认。请保留原操作 ID 并查看状态，不可换新 ID 重复生成。',
  stale:
    '所选来源的版本已变更或无法再次确认，旧预览已清除。请重新检查来源后再显式发起新请求。',
  generated: '已生成，未应用',
  canceled: '已取消，未应用',
  failed: '生成失败',
  running: '正在生成',
  retained: '保留的原始块',
  lineage: '来源关系',
  budget: '完整产物包的估算预算',
  savings: '估算 token 差值',
  estimateBoundary:
    '估算按相同的完整产物 JSON 比较，包含保留原文和来源关系。管理回执、HTTP 信封及调用者追加提示不在其中，需另计预算。产物较小不等于回答质量更好，也不等于实际金额节省。',
  artifactId: '产物 ID',
  manifest: '来源快照绑定',
  model: '生成模型',
  modelConfig: '模型配置指纹',
  before: '未压缩输入估算',
  after: '完整产物估算／预算',
  notMeasured: '未知',
  billingUnknown: '此回执未核实供应商 token 用量及金额，费用未知不等于零费用。',
  summary: '生成摘要（不可信数据）',
  noSummary: '当前没有可用的摘要正文。',
  sourceBoundary:
    '来源顺序和版本保持绑定。角色标签只是声明，不证明发言者身份、工具执行或事实准确性。',
  exactEmpty: '空字符串（精确值）',
  readSource: '阅读绑定的原始来源',
  draining: '实际模型请求仍在排空。取消或结果已落库，不代表外部 IO 已结束。',
  operatorRequired: '此操作需要人工对账。请保留原句柄，不可换新请求重复生成。',
  cancelUnknown:
    '取消结果尚未确认，请读取同一操作。不能据此认为供应商已停止请求或产物已被应用。',
  readFailed:
    '无法确认当前状态，旧正文已清除。请保留原句柄再次读取，不会重发生成请求。',
  cancel: '取消本次生成',
  startNew: '准备新的显式请求',
  states: {
    running: '正在生成，未应用',
    generated: '已生成，未应用',
    failed: '生成失败，未应用',
    stale: '来源快照不可用或已变更，预览已清除',
    canceled: '已取消，未应用',
    persistence_unknown: '结果尚未确认，请保留原操作',
  },
}
