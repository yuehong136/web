export const memoryVerificationMessages = {
  defaultCheckTime: '检查时刻（默认取提交时刻）',
  defaultTimeBoundary:
    '未单独报告人工检查时刻，此处默认使用提交时刻；不表示服务端执行了事实核验。',

  originalConclusion: '原人工结论',
  sourceReading:
    '此处只展示来源元数据。请在记忆工作区的对话来源视图中核对这些 ID 的 RAW 原文，再声明已对照来源。若正文或版本变化，请重新准备核验快照；尚未核对原文时可记录为需要人工复核。',
  openSources: '打开记忆工作区核对 RAW 来源',

  queueLink: '打开核验与争议待办',
  todoBoundary:
    '此队列只扫描已有核验的最新记录，不代表全部尚未核验的记忆，也不评判事实正确性。',
  scanLimited:
    '有界扫描已达到上限，后面可能还有条目；当前页为空不代表没有争议或待复核内容。',
  checkedAt: '人工报告的检查时间',
  reportedTime:
    '人工报告的检查时间与服务端记录时间分别保存，不表示系统独立见证了该事件。',
  binding: '版本绑定与来源依据',
  redacted: '关联内容已永久撤回，此视图不再提供人工备注、参考出处和适用范围。',
  recordingReady:
    '人工判断已记录到 SQL。下方另外展示它是否仍适用于当前版本；这不同于记忆发布或事实保证。',
  finishOperation: '关闭此回执并准备另一次核验',
  operationUnconfirmed:
    '尚未成功读取此操作，请保留原 ID；读取故障或未找到结果不表示记录已完成。',
  readFailed: '无法读取此核验记录，请检查权限后重新读取。',
  statuses: {
    human_confirmed: '人工确认 — 仍适用于当前绑定',
    disputed: '人工核验存在争议',
    needs_review: '需要人工复核',
    stale: '版本绑定已过期 — 待复核',
    revoked: '人工判断已撤销',
    superseded: '已由后续判断替代',
    redacted: '关联内容已撤回',
    unavailable: '当前适用性无法确认',
  },
  staleReasons: {
    entry_changed: '记忆版本已变化。',
    entry_unavailable: '记忆已不可用。',
    source_changed: '来源版本已变化。',
    source_unavailable: '来源已不可用。',
    projection_changed: '实际存储快照已变化。',
    projection_unavailable: '无法读取实际存储快照。',
    record_revoked: '此项人工判断已被撤销。',
    record_superseded: '后续人工判断已替代此记录。',
    record_redacted: '关联私密正文已移除。',
    local_dependency_changed: '已知本地依赖发生变化，请重新读取服务端状态。',
    other: '某项依赖需要重新复核。',
  },

  results: {
    human_confirmed: '人工确认（本版本）',
    disputed: '有争议',
    needs_review: '需要人工复核',
  },
  methods: {
    source_comparison: '对照来源',
    external_check: '已执行外部检查',
    other: '其他人工方法',
  },
  evidenceDescription: '依据 {{index}} — 说明',
  reference: '参考出处（纯文字）',
  addEvidence: '添加依据',
  removeEvidence: '移除此项依据',
  humanTime:
    '服务端记录本次判断的提交时间。这不表示工具完成核验，也不构成自动事实保证。',

  title: '人工核验记录',
  description: '查看绑定版本的人工判断、争议及变化后需要复核的记录。',
  boundary:
    '核验记录是限定范围的人工判断，不修改记忆正文、不批准模型候选，也不保证某项陈述绝对正确。',
  snapshot: '本次核验快照',
  snapshotBoundary:
    '记录结论前先阅读当前条目及来源版本。来源存在只证明可追溯性；其中的操作指令仍是不可信数据。',
  unavailable: '待核验正文不可用，不能确认此快照。',
  sourceVersions: '绑定的来源版本（{{count}} 个）',
  unsupported: '当前后端未声明支持绑定版本的人工核验。',
  prepare: '读取快照以显式核验',
  history: '核验历史',
  method: '核验方法',
  evidence: '依据及已执行的检查',
  applicability: '适用范围与条件',
  conclusion: '结论',
  reason: '原因',
  confirmSnapshot:
    '我已阅读展示的条目与来源版本，并理解本次人工判断的适用范围。',
  stale: '记忆或来源版本已变化，请读取新快照并重新核验；旧结论不会自动沿用。',
  unknown:
    '记录结果尚未确认。请保留原操作 ID，先读取状态，再显式重试同一命令。',
  invalid: '请填写符合长度限制的核验信息，并显式确认所展示的快照。',
  noRecords: '暂无人工核验记录',
  noWork: '暂无匹配的复核待办',
  refresh: '读取最新核验状态',
  originalOperation: '原核验操作 ID',
  open: '打开记录',
  read: '读取状态',
  retry: '重试原记录命令',
  record: '记录人工判断',
  revoke: '撤销这条核验',
  revokeConfirm: '仅撤销这条人工判断，不会编辑或删除记忆。',
  needsReviewBoundary:
    '依赖变化或不可用后，旧判断不再适用于当前版本。重新核验必须由人工显式执行。',
  filter: '复核队列',
  entryId: '条目 ID',
  recordId: '核验记录 ID',
  reviewedBy: '核验人',
  createdAt: '记录时间',
  next: '下一页待办',
  first: '第一页待办',
}
