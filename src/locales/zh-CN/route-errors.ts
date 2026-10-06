export default {
  routeErrors: {
    unavailable: {
      knowledgeImport: {
        title: '暂不支持整库导入',
        description:
          '当前没有整库导入功能。添加内容请进入具体知识库，上传文件或关联数据源。',
        action: '前往知识库',
      },
      documents: {
        title: '文件中心暂不可用',
        description: '当前文件按知识库管理。请进入具体知识库上传和管理文档。',
        action: '前往知识库',
      },
      workflow: {
        title: '工作流中心暂不可用',
        description: '请在 Agent 工作区管理 Agent 和数据管道。',
        action: '前往 Agent',
      },
      appearance: {
        title: '独立界面设置页暂不可用',
        description: '请使用侧栏中的主题和语言控件调整界面偏好。',
        action: '返回首页',
      },
    },
    notFound: {
      title: '页面未找到',
      description: '您访问的地址不存在或已经变更。',
    },
    unauthorized: {
      title: '需要重新登录',
      description: '当前会话已失效，请登录后继续。',
    },
    forbidden: {
      title: '无权访问',
      description: '当前账号没有访问此内容的权限。',
    },
    server: {
      title: '服务暂时不可用',
      description: '服务遇到了临时问题，请稍后重试。',
    },
    unexpected: {
      title: '页面无法显示',
      description: '页面遇到了意外问题，请重新加载。',
    },
    actions: {
      home: '返回首页',
      back: '返回上一页',
      retry: '重新加载',
      login: '重新登录',
    },
  },
}
