export const memorySegmentMessages = {
  previewCoverageHint:
    '这里是本次显式预览时的覆盖；计划片段数和子任务进度使用不同单位。',
  liveCoverageHint:
    '这里从服务端读取此保存计划的当前有效覆盖；上方选源统计仍是冻结快照。',
  totalParts: '必要主片段数',
  analyzedParts: '有效分析的片段数',
  snapshotInputs:
    '快照输入：所选 {{selected}}，已纳入 {{included}}，已分析 {{analyzed}}，已延后 {{deferred}}。',

  enable: '将长来源分段分析',
  selectionHint:
    '将有界片段交给独立子任务分析。所有必要片段完成且实际工作结束后，才将整个来源版本计为已分析；候选审核和发布仍需显式操作。',
  unavailable: '当前后端未声明支持分段分析，请切回整条来源模式。',
  wholeMode: '整条来源',
  segmentedMode: '来源片段',
  mode: '分析单位',
  fragmentBudget: '每个片段的目标 token 上限',
  maxParts: '每条来源的片段数上限',
  fragmentBudgetHint:
    '服务端还会检查包含邻接正文、上下文和指令的完整子任务输入。',
  previewBoundary:
    '预览会读取来源正文以规划并检查片段，但不创建分析任务，也不调用模型。执行前，子任务快照仍会重新检查来源版本和预算。',
  createBoundary:
    '保存会绑定已预览的片段计划和固定子任务句柄，可能重读来源以核对版本；不会提交分析或调用模型。',
  fragment: '片段 {{number}}／{{total}}',
  core: '主正文字符范围',
  read: '包含邻接上下文的读取范围',
  range: '[{{start}}, {{end}})',
  offsetHint:
    '范围使用原始来源的 Unicode 码点位置。邻接读取上下文可以重叠，只有主正文范围计入来源覆盖。',
  provenance: '片段来源依据',
  identity: '片段指纹',
  wholeHash: '完整来源哈希',
  coreHash: '主正文范围哈希',
  readHash: '读取范围哈希',
  splitter: '分段器版本',
  reviewBoundary:
    '片段分析可能遗漏其他片段中的关系。分析覆盖不代表事实正确、跨来源关系已完整整理或已经发布。',
  sourceBoundary:
    '来源变更或撤回会使其旧片段覆盖失效；重复上下文不计为新的主正文覆盖。',
  selectedFragments: '计划主片段数',
  sourceCoverage: '来源版本分析覆盖',
  sourcesSelected: '所选来源版本数',
  sourcesCovered: '完整分析的来源版本数',
  sourcesPartial: '部分分析的来源版本数',
  sourcesBlocked: '受阻来源版本数',
  partialHint: '部分片段已分析，但整个来源版本尚不计为已分析。',
  blockedSources: '规划时延后的来源',
  reason: '延期原因',
  reasons: {
    segment_parts_limit: '所需片段数超过当前选择的单来源上限。',
    segment_plan_limit: '当前有界计划无法容纳全部必要片段。',
    segment_source_size_limit: '来源超过支持的规划大小。',
    segment_context_budget: '必要的邻接正文或条目上下文超过输入预算。',
    segment_no_fragment_fits: '当前输入预算无法容纳任何完整片段。',
    input_budget: '完整输入超过子任务 token 预算。',
    unknown: '此输入已延后，请读取原任务核对当前状态。',
  },
}
