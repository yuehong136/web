/**
 * 记忆库文本常量
 *
 * 预留 i18n 支持，后续迁移到 locales 文件时只需：
 * 1. 将此文件内容迁移到 locales/zh.ts 和 locales/en.ts
 * 2. 全局替换 MEMORY_TEXTS.xxx.yyy 为 t('memories.xxx') 或 t('memory.yyy')
 *
 * 参考 ragflow 的 locales/zh.ts 和 locales/en.ts
 */

export const MEMORY_TEXTS = {
  // ============ 列表页 ============
  memories: {
    // 页面标题
    memory: '记忆库',
    pageTitle: '记忆库管理',
    pageDescription: '管理您的 AI 记忆，让对话更智能',

    // 创建
    createMemory: '创建记忆库',
    editMemory: '编辑记忆库',
    createMemoryDescription: '配置记忆库的基本信息和模型设置',
    editMemoryDescription: '修改记忆库的名称和头像',
    editName: '编辑名称',

    // 表单字段
    name: '名称',
    memoryNamePlaceholder: '请输入记忆库名称',
    avatarUploadTips: '支持 JPG、PNG，最大 5MB',
    editSettingsTip: '更多配置请前往设置页面修改',

    // 记忆类型
    memoryType: '记忆类型',
    memoryTypeTooltip: `原始: 用户与智能体之间的原始对话内容（默认必需）。
语义记忆: 关于用户和世界的通用知识和事实。
情景记忆: 带时间戳的特定事件和经历记录。
程序记忆: 学习的技能、习惯和自动化程序。`,
    raw: '原始',
    rawDesc: '用户与智能体之间的原始对话内容',
    semantic: '语义',
    semanticDesc: '关于用户和世界的通用知识和事实',
    episodic: '情景',
    episodicDesc: '带时间戳的特定事件和经历记录',
    procedural: '程序',
    proceduralDesc: '学习的技能、习惯和自动化程序',
    rawRequired: '必须包含原始记忆类型',

    // 模型选择
    embeddingModel: '嵌入模型',
    embeddingModelTooltip:
      '将文本转换为数值向量，用于语义相似度搜索和记忆检索。',
    embeddingModelError: '记忆类型为必填项，且"原始"类型不可删除。',
    llm: '大语言模型',
    llmTooltip: '分析对话内容，提取关键信息，并生成结构化的记忆摘要。',
    selectModel: '选择模型',
    selectLlmRequired: '请选择大语言模型',
    selectEmbeddingRequired: '请选择嵌入模型',
    nameRequired: '请输入名称',
    memoryTypeRequired: '请选择至少一种记忆类型',
    noMemoryTypeFound: '没有找到记忆类型',
    required: '必选',

    // 错误消息
    createFailed: '创建记忆库失败',
    updateFailed: '更新记忆库失败',
    deleteFailed: '删除记忆库失败',
    updateMessageStatusFailed: '更新消息状态失败',
    forgetMessageFailed: '遗忘消息失败',

    // 删除
    deleteMemory: '删除记忆库',
    delMemoryWarn: '删除后，此记忆中的所有消息都将被删除，智能体将无法检索。',

    // 统计
    totalMemories: '记忆库总数',
    totalMessages: '总消息数',
    totalStorage: '总存储量',
    activeMemories: '活跃数',

    // 筛选
    filter: '筛选',
    search: '搜索',
    searchPlaceholder: '搜索记忆库...',

    // 空状态
    noMemories: '还没有记忆库',
    noMemoriesDescription: '创建您的第一个记忆库，让 AI 记住与您的对话',
    noResults: '未找到匹配的记忆库',
    noResultsDescription: '尝试调整搜索条件或筛选器',
  },

  // ============ 详情页 - 消息 ============
  messages: {
    // 页面
    pageTitle: '消息列表',
    messageDescription: '记忆提取使用高级设置中的提示词和温度值进行配置。',

    // 表格列
    sessionId: '会话ID',
    agent: '智能体',
    type: '类型',
    validDate: '有效日期',
    forgetAt: '遗忘于',
    enable: '启用',
    action: '操作',
    content: '内容',
    contentEmbed: '嵌入向量',

    // 操作
    viewContent: '查看内容',
    forget: '遗忘',
    forgetMessage: '遗忘消息',
    forgetMessageTip: '确定要遗忘这条消息吗？',
    delMessageWarn: '遗忘后，智能体将无法检索此消息。',

    // 状态
    enabled: '已启用',
    disabled: '已禁用',
    forgotten: '已遗忘',

    // 复制
    copied: '已复制！',
    copyContent: '复制内容',
    copyEmbed: '复制嵌入向量',

    // 空状态
    noMessages: '暂无消息',
    noMessagesDescription: '当智能体使用此记忆库时，对话内容将自动记录在这里',
  },

  // ============ 详情页 - 设置 ============
  config: {
    // 页面
    pageTitle: '记忆库配置',
    pageDescription: '配置记忆库的基础信息和高级设置',

    // 基础信息
    basicInfo: '基础信息',
    avatar: '头像',
    description: '描述',
    descriptionPlaceholder: '请输入描述信息',

    // 模型配置
    modelConfig: '模型配置',

    // 高级设置
    advancedSettings: '高级设置',

    // 存储和权限
    memorySize: '记忆大小',
    memorySizeTooltip: `记录每条消息的内容 + 其嵌入向量（≈ 内容 + 维度 × 8 字节）。
例如：一条带有 1024 维嵌入的 1 KB 消息大约使用 9 KB。5 MB 的默认限制大约可容纳 500 条消息。`,
    permission: '权限',
    onlyMe: '仅自己',
    team: '团队',

    // 存储类型
    storageType: '存储类型',
    table: '表格',
    graph: '图',

    // 遗忘策略
    forgettingPolicy: '遗忘策略',
    fifo: '先进先出 (FIFO)',
    lru: '最近最少使用 (LRU)',

    // 提示词
    temperature: '温度',
    temperatureTooltip: '控制生成内容的随机性，值越高输出越多样化',
    systemPrompt: '系统提示词',
    systemPromptPlaceholder: '设置记忆提取的系统提示词...',
    userPrompt: '用户提示词',
    userPromptPlaceholder: '设置记忆提取的用户提示词...',

    // 操作
    save: '保存',
    cancel: '取消',
    saving: '保存中...',
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
  },

  // ============ 侧边栏 ============
  sideBar: {
    messages: '消息',
    configuration: '配置',
  },

  // ============ 通用 ============
  common: {
    confirm: '确定',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    create: '创建',
    search: '搜索',
    filter: '筛选',
    loading: '加载中...',
    noData: '暂无数据',
    operation: '操作',
    success: '成功',
    failed: '失败',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    pleaseSelect: '请选择',
    selectMemoryType: '选择记忆类型...',
    notEditable: '创建后不可修改',
    allMemories: '所有记忆库',
  },
}

// 导出类型，方便使用
export type MemoryTextsType = typeof MEMORY_TEXTS
