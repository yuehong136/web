export const deliveryMessages = {
  version: {
    title: '发布 Agent',
    asset: '资产',
    published: '已发布',
    unpublished: '未发布',
    neverPublished: '尚未发布',
    lastPublished: '上次发布：{{time}}',
    releaseNote: '发布说明',
    releaseNotePlaceholder: '记录本次发布的变更点',
    releaseHint:
      '发布会保存当前画布并生成 released version；运行端可通过 release=true 使用已发布版本。',
    tokenMissing:
      '未检测到第一条系统 API Token 的 beta。发布不会自动创建 Token；如需生成 Share 链接，请先到系统 Token 管理创建或刷新。',
    publishing: '发布中...',
    publish: '确认发布',
    publishDone: '发布完成',
    copyShare: '复制 Share',
    webhook: 'Webhook',
    explore: 'Explore',
    history: '版本历史',
    historyEmpty: '暂无版本记录',
    noTime: '无时间信息',
    releasedBadge: 'Published',
  },
  webhook: {
    title: 'Webhook 测试',
    url: 'Webhook URL',
    copyUrlFailed: '复制失败，请手动复制 Webhook URL',
    testEndpoint: 'Test endpoint: {{url}}',
    testing: '测试中...',
    trigger: '触发测试',
    refreshTrace: '刷新 Trace',
    jwtWarning:
      'JWT 测试需要手动替换 Authorization header，前端不会生成或签名 JWT。',
    tabs: {
      overview: 'Overview',
      timeline: 'Timeline',
      request: 'Request',
    },
    sections: {
      input: 'Input',
      output: 'Output',
      response: 'Response',
      request: 'Request',
      curl: 'curl',
    },
    timeline: {
      empty: '暂无 trace 事件。点击测试后会从 webhook logs 接口轮询事件。',
    },
  },
}
