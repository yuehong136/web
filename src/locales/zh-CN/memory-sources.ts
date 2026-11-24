export const memorySourceMessages = {
  jobSources: '查看本任务来源的提交回执',
  attributionBoundary:
    '认证仅确定提交者。客户端声明的角色、事件时间与来源正文均未经独立核验。',
  segmentCount: '声明的片段数：{{count}}',
  format: '来源格式',
  structured: '结构化提交',
  legacy: '旧版合并记录',
  submitter: '提交身份',
  authenticatedSubmission: '已认证的提交者',
  submitterUnknown: '未记录提交者',
  receivedAt: '服务端受理时间',
  eventTime: '事件时间声明',
  callerDeclared: '由客户端声明',
  unknown: '未知',
  referenceTime: '后续分析的参考时刻',
  humanBoundary:
    '人工核验是针对当前条目及其来源版本的独立判断。提交身份经过认证，不代表已经完成这种判断。',
  rolesDeclared:
    '下列角色由客户端声明。“工具”标签不证明工具实际执行或验证了正文。',
  segment: '片段 {{count}}',
  roles: {
    user: '用户（客户端声明）',
    assistant: '助手（客户端声明）',
    tool: '工具（客户端声明）',
    unknown: '未知角色',
  },
  legacyBoundary:
    '这条旧记录没有结构化角色回执，不会将正文中的标签解析为可信说话者。',
  inspect: '读取来源提交信息',
  idle: '仅在明确请求时读取，不调用模型、不创建核验、不发布记忆。',
  changed: '来源不可用或与当前版本不符，请刷新来源状态后重新查看。',
  failed: '无法读取来源提交信息，请刷新后明确重试。',
  digest: '提交回执摘要',
  close: '清除来源提交信息',
}
