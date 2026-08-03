export default {
  channel: {
    title: '渠道接入',
    description: '管理外部消息平台，并将消息安全地绑定到 MultiRAG 已发布能力。',
    overview:
      '渠道凭据只在服务端保存；启用后，独立 Channel Runtime 将接收消息并调用已绑定的 MultiRAG 目标。',
    providers: {
      feishu: '飞书',
    },
    actions: {
      create: '新建渠道',
      edit: '编辑',
      enable: '启用',
      disable: '停用',
      delete: '删除',
      cancel: '取消',
      retry: '重试',
      saveDraft: '保存草稿',
    },
    status: {
      enabled: '已启用',
      draft: '草稿',
    },
    states: {
      loading: '正在加载渠道',
      loadingDescription: '正在读取渠道配置和运行状态。',
      error: '渠道加载失败',
      errorDescription: '暂时无法读取渠道信息，请稍后重试。',
      empty: '还没有渠道',
      emptyDescription: '创建飞书渠道，并绑定一个 MultiRAG Agent 或对话应用。',
    },
    form: {
      createTitle: '新建渠道',
      editTitle: '编辑渠道',
      description: '先保存为草稿，确认凭据与绑定目标后再启用。',
      basicSection: '基本信息',
      connectionSection: '平台连接',
      bindingSection: 'MultiRAG 绑定',
    },
    fields: {
      name: {
        label: '渠道名称',
      },
      provider: {
        label: '渠道类型',
      },
      app_id: {
        label: 'App ID',
        description: '飞书开放平台应用的 App ID。',
        placeholder: 'cli_xxx',
      },
      app_secret: {
        label: 'App Secret',
        description: '仅提交到服务端密钥存储，保存后不会再次回显。',
        placeholder: '输入 App Secret',
      },
      domain: {
        label: '飞书域名类型',
        description: '中国大陆飞书使用 feishu；Lark 国际版使用 lark。',
        placeholder: 'feishu',
      },
      allowed_open_ids: {
        label: '允许的用户 Open ID',
        description:
          '可选。每行或逗号分隔一个 Open ID；留空时依赖飞书应用可用范围。',
        placeholder: 'ou_xxx',
      },
    },
    secret: {
      label: '平台密钥',
      configured: '已配置',
      missing: '未配置',
      keepPlaceholder: '留空以保留现有密钥',
      keepHelp: '现有值不会显示；仅在需要轮换时输入新值。',
    },
    binding: {
      target: '绑定目标',
      targetType: '目标类型',
      selectTargetType: '选择目标类型',
      targetId: '目标 ID',
      targetIdDescription: '目标必须属于当前租户，并且已有可执行的发布版本。',
      selectTarget: '选择已发布目标',
      loadingTargets: '正在加载可用目标',
      targetsLoadFailed: '可用目标加载失败，请关闭后重试。',
      unnamedTarget: '未命名目标',
      revisionId: '发布版本 ID',
      revisionIdDescription:
        '该 ID 用于校验 Agent 仍是当前最新发布版本；实际执行沿用 MultiRAG 的 release 模式。',
      staleRelease: '原绑定版本 {{revision}}（已过期）',
      staleReleaseDescription:
        'Agent 已发布新版本。请选择当前发布版本并保存，系统不会静默切换 DSL。',
      dialogRevisionDescription: '对话应用当前不需要单独选择发布版本。',
      currentRelease: '当前发布版本',
      versionLabel: '版本 {{number}}',
      notConfigured: '尚未绑定',
      types: {
        canvasAgent: 'MultiRAG Agent',
        dialog: 'MultiRAG 对话应用',
      },
    },
    policy: {
      privateChatOnly: '仅允许私聊',
      privateChatOnlyDescription: '群聊消息不会触发已绑定目标。',
    },
    runtime: {
      label: '运行状态',
      unknown: '未知',
      lastHeartbeat: '最近心跳',
      errorCode: '运行错误：{{code}}',
      states: {
        pending: '等待启动',
        starting: '正在连接',
        connected: '已连接',
        running: '运行中',
        healthy: '健康',
        online: '在线',
        stopped: '已停止',
        disabled: '已停用',
        failed: '运行失败',
      },
    },
    validation: {
      required: '此项为必填项',
    },
    messages: {
      saved: '渠道草稿已保存',
      saveFailed: '渠道保存失败',
      enabled: '渠道已启用',
      disabled: '渠道已停用',
      toggleFailed: '渠道状态更新失败',
      deleted: '渠道已删除',
      deleteFailed: '渠道删除失败',
    },
    delete: {
      title: '删除渠道？',
      description: '将删除“{{name}}”的连接、绑定和运行状态。此操作无法撤销。',
    },
  },
}
