export default {
  routeErrors: {
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
