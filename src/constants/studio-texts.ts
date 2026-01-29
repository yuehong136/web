/**
 * 工作室页面文本常量
 * 便于国际化和统一管理
 */

export const STUDIO_TEXTS = {
  // 页面基础信息
  pageTitle: '工作室',
  pageDescription: '创建和管理您的 AI 应用和智能体',

  // 操作按钮
  createProject: '新建项目',
  createApp: '创建应用',
  createAgent: '创建智能体',

  // 统计卡片
  stats: {
    totalApps: '应用总数',
    published: '已发布',
    draft: '草稿',
    recentUpdated: '最近更新',
  },

  // 搜索和筛选
  searchPlaceholder: '搜索应用...',
  filter: '筛选',
  filterStatus: '状态',
  statusPublished: '已发布',
  statusDraft: '草稿',

  // 时间格式
  timeFormatDetailed: '详细时间',
  timeFormatCompact: '简洁时间',
  timeFormatRelative: '相对时间',

  // 视图模式
  gridView: '网格视图',
  listView: '列表视图',

  // 卡片信息
  app: '应用',
  agent: '智能体',
  knowledgeBases: '知识库',
  updatedAt: '更新于',
  createdAt: '创建于',

  // 操作
  edit: '编辑',
  delete: '删除',
  settings: '设置',
  configure: '配置',

  // 空状态
  noApps: '还没有应用',
  noAppsDescription: '开始创建您的第一个 AI 应用，让 AI 为您的业务赋能',
  noResults: '未找到匹配的应用',
  noResultsDescription: '尝试调整搜索条件或筛选器',
  createFirstApp: '创建第一个应用',

  // 删除确认
  deleteApp: '删除应用',
  deleteAppConfirm: '确定要删除这个应用吗？此操作不可撤销。',
  deleteAppsConfirm: '确定要删除选中的 {count} 个应用吗？此操作不可撤销。',

  // 通用
  common: {
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    save: '保存',
    edit: '编辑',
    loading: '加载中...',
  },

  // 项目类型选择弹窗
  projectType: {
    title: '新建项目',
    description: '选择您要创建的项目类型',
    appTitle: '创建应用',
    appDescription: '构建完整的 AI 应用程序，提供丰富的用户界面和功能',
    appFeatures: ['可视化界面', '多模态交互', '工作流集成', '数据可视化'],
    agentTitle: '创建智能体',
    agentDescription: '创建专业的 AI 助手，具备特定领域的专业知识和能力',
    agentFeatures: ['专业知识库', '对话交互', '任务执行', '学习适应'],
    tip: '创建后您可以随时修改项目设置、添加功能模块，或者将应用和智能体相互转换。我们提供了丰富的模板和组件来帮助您快速构建。',
    clickToCreate: '点击创建',
  },

  // 创建应用弹窗
  createAppModal: {
    title: '创建应用',
    editTitle: '编辑应用',
    nameLabel: '应用名称',
    namePlaceholder: '请输入应用名称',
    nameRequired: '应用名称不能为空',
    nameMaxLength: '应用名称不能超过 255 字节',
    descriptionLabel: '应用描述',
    descriptionPlaceholder: '请输入应用描述（可选）',
    descriptionMaxLength: '描述不能超过 200 字符',
    iconLabel: '应用图标',
    iconUpload: '上传图标',
    iconTip: '支持 JPG、PNG、SVG 格式，最大 2MB',
  },
} as const
