export default {
  reference: {
    unknownDocument: '未知文档',
    openWebSource: '查看网页',
    openWebSourceHint: '在新标签页中打开来源网页',
    documentMetadata: '文档元数据',
    docType: {
      table: '表格',
      image: '图片',
      text: '文本',
    },
    marker: {
      label: '引用 {{index}}：{{name}}',
    },
    panel: {
      title: '引用来源',
      documentCount_one: '{{count}} 个文档',
      documentCount_other: '{{count}} 个文档',
      chunkCount_one: '{{count}} 条引用',
      chunkCount_other: '{{count}} 条引用',
      showMore: '查看更多（{{count}} 条）',
      showLess: '收起',
    },
    diagnostics: {
      title: '检索诊断',
      score: '检索匹配评分',
      vectorScore: '向量匹配',
      termScore: '词汇匹配',
      unavailable: '不可用',
      outOfRange:
        '原始值 {{value}} 超出 0–1，未按百分比显示（PageRank 等排序加权会使分值超过 1）',
      scoreHint:
        '检索阶段计算的匹配程度，用于排查检索效果；分值范围随应用的检索设置变化，不代表回答是否正确。',
      noPositions: '无定位数据',
      copyValue: '复制{{label}}',
      valueCopied: '已复制{{label}}',
    },
  },
}
