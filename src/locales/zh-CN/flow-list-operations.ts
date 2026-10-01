export const listOperationsMessages = {
  ListOperationsOptions: {
    nth: '第 N 项',
    head: '取前 N 项',
    tail: '取后 N 项',
    sort: '排序',
    filter: '筛选',
    dropDuplicates: '去重',
  },
  ListOperationsLegacyOptions: {
    topN: '取前 N 项（历史）',
    head: '取前第 N 项（历史）',
    tail: '取后第 N 项（历史）',
  },
  strictMode: '严格模式',
  strictModeTip:
    '超出范围时报错。第 N 项要求 N 非零且绝对值不超过列表长度；前/后 N 项要求 N 在 1 到列表长度之间。',
  listOperationsConfig: {
    count: 'N',
    integerRequired: '请输入安全整数。',
    invalidVersion: '列表操作的配置版本无效，请检查导入的 DSL。',
    legacyTip: '此节点保留原有列表语义。历史 head 和 tail 操作只返回一项。',
    legacyCountTip:
      '非正数返回空列表。历史 head/tail 超出长度也返回空列表；Top N 超出长度时返回全部。',
    nthTip:
      '正数从 1 起算，负数从末尾起算。关闭严格模式时，0 或越界返回空列表。',
    sliceTip:
      '保持原顺序。关闭严格模式时，非正数返回空列表，超出列表长度时返回全部。',
  },
}
