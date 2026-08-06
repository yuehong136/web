export default {
  channel: {
    title: '渠道接入',
    description: '管理外部消息平台，并将消息安全地绑定到 MultiRAG 已发布能力。',
    overview:
      '渠道凭据只在服务端保存；启用后，独立 Channel Runtime 将接收消息并调用已绑定的 MultiRAG 目标。',
    providers: {
      dingtalk: {
        name: '钉钉',
        description: '通过 Stream 长连接接收钉钉机器人消息并回复。',
      },
      feishu: {
        name: '飞书',
        description: '通过长连接接收飞书 / Lark 机器人的私聊消息并回复。',
      },
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
      providersUnavailable:
        '暂时取不到渠道类型元数据，无法新建或编辑渠道；已有渠道的启停与删除不受影响。',
    },
    form: {
      createTitle: '新建渠道',
      editTitle: '编辑渠道',
      description: '先保存为草稿，确认凭据与绑定目标后再启用。',
      basicSection: '基本信息',
      connectionSection: '平台连接',
      bindingSection: 'MultiRAG 绑定',
    },
    connected: {
      title: '已接入渠道（{{count}}）',
    },
    gallery: {
      title: '可接入渠道',
      description:
        '选择一个平台开始接入。列表由服务端下发，新增渠道无需更新前端。',
      connect: '接入',
      connectedCount: '已接入 {{count}}',
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
      client_id: {
        label: 'Client ID',
        description: '钉钉开放平台应用的 Client ID，旧版控制台称 AppKey。',
        placeholder: 'dingxxxxxxxxxxxxxxxx',
      },
      client_secret: {
        label: 'Client Secret',
        description: '仅提交到服务端密钥存储，保存后不会再次回显。',
        placeholder: '输入 Client Secret',
      },
      robot_code: {
        label: '机器人编码',
        description:
          '应用要以哪个机器人身份回话，在钉钉开放平台的机器人配置页获取。',
        placeholder: 'robot_xxx',
      },
      allowed_user_ids: {
        label: '允许的用户 ID',
        description:
          '可选。每行或逗号分隔一个用户 ID；留空时依赖钉钉应用可见范围。',
        placeholder: 'user_xxx',
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
      searchTargets: '搜索 Agent…',
      loadingTargets: '正在加载可用目标',
      targetsLoadFailed: '可用目标加载失败，请关闭后重试。',
      unnamedTarget: '未命名目标',
      revisionId: '发布版本 ID',
      revisionIdDescription:
        '该 ID 用于校验 Agent 仍是当前最新发布版本；实际执行沿用 MultiRAG 的 release 模式。',
      staleRelease: '原绑定版本 {{revision}}（已过期）',
      staleReleaseDescription:
        'Agent 已发布新版本。请选择当前发布版本并保存，系统不会静默切换 DSL。',
      revisionStale:
        '绑定版本已过期，机器人暂时无法应答。请编辑并选择当前发布版本。',
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
      // 服务端 RuntimeState 的六个取值，不多不少。
      // 曾经这里有十二条，其中六条（pending/running/healthy/online/disabled/
      // failed）服务端永远不会返回——词表是从客户端凭空发明的。
      states: {
        // 没有存活 runner 持有该 binding 时上报，包含 runner 停止心跳之后。
        waiting: '等待启动',
        starting: '正在连接',
        connected: '已连接',
        stopping: '正在停止',
        stopped: '已停止',
        error: '运行异常',
      },
    },
    validation: {
      required: '此项为必填项',
    },
    // 服务端在失败信封的 data.error_code 里给出的码。写成「是什么 + 你该做什么」，
    // 因为这四类失败的处置路径毫无共同点。
    errorCodes: {
      CHANNEL_NOT_ACCESSIBLE: '该渠道不属于当前账号，请确认后重试',
      CHANNEL_TARGET_NOT_ACCESSIBLE:
        '你没有权限把该目标发布到外部渠道；请联系目标所属团队的管理员',
      INVALID_CHANNEL_CONFIGURATION:
        '渠道配置不完整或已失效（凭据缺失、未绑定目标、或绑定的 Agent 版本已过期）',
      CHANNEL_SECRET_STORE_UNAVAILABLE:
        '密钥库当前不可用，这不是配置问题，请联系运维',
      CHANNEL_OPERATION_FAILED: '服务端处理失败，请联系运维并提供操作时间',
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
