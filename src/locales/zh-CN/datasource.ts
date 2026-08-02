export default {
  datasource: {
    // 页面标题
    title: '数据源管理',
    description: '管理和配置外部数据源，支持多种云存储、协作平台和代码仓库。',

    // 数据源列表
    addedSources: '已添加的数据源',
    availableSources: '可用数据源',
    availableSourcesDescription: '选择一个数据源类型来创建新的连接',
    emptyTip: '暂未添加数据源，点击下方数据源类型开始添加',

    // 添加模态框
    addModalTitle: '添加 {{name}} 数据源',

    // 删除确认
    deleteConfirmTitle: '删除数据源',
    deleteConfirmMessage:
      '确定要删除数据源 "{{name}}" 吗？此操作不可撤销，关联的知识库将不再同步数据。',

    // 详情页
    configuration: '配置信息',
    syncLogs: '同步日志',
    syncOverview: '同步概览',
    syncHistory: '同步历史',
    notFound: '数据源不存在',
    notFoundDescription: '该数据源可能已被删除，或当前账号无权访问。',
    backToList: '返回列表',
    loadingDetail: '正在加载数据源',
    loadingDetailDescription: '正在获取配置与最近同步状态。',

    // 状态
    statusPending: '待处理',
    statusRunning: '运行中',
    statusScheduled: '已排期',
    statusPaused: '已暂停',
    statusCompleted: '已完成',
    statusFailed: '失败',

    // 操作
    pause: '暂停',
    resume: '恢复',
    rebuild: '重新同步',
    autoParse: '自动解析',
    unbind: '解除绑定',

    // 日志表格
    logKnowledgeBase: '知识库',
    logStatus: '状态',
    logDocsIndexed: '已索引文档',
    logErrors: '错误数',
    logTime: '时间范围',
    noLogs: '暂无同步日志',
    noLogsDescription: '完成首次同步后，任务结果会显示在这里。',
    logUpdatedAt: '更新时间',
    logSummary: '任务摘要',
    logCursor: '同步至',
    logSummaryScheduled: '等待下一轮自动同步',
    logSummaryRunning: '正在从数据源拉取并更新知识库',
    logSummaryPaused: '任务已暂停',
    logSummaryFailed: '同步任务失败',
    logSummaryCompleted: '新增 {{added}} · 累计 {{total}} · 错误 {{errors}}',
    currentState: '当前状态',
    lastSuccessfulSync: '最近成功同步',
    nextEstimatedSync: '预计下次同步',
    waitingForSchedule: '等待调度信息',
    syncEveryMinutes: '每 {{count}} 分钟检查一次',
    lastSyncSummary: '本轮新增 {{added}}，累计 {{total}}',
    zeroChangesExplanation:
      '“新增 0”表示本轮没有发现上游变更，任务仍然是成功的；已排期表示自动同步已开启，并非尚未执行。',
    notAvailable: '暂无',

    // 链接数据源
    dataSources: '数据源',
    manageLinkedSources: '管理与此知识库关联的数据源',
    linkDataSource: '链接数据源',
    linkDataSourceDescription:
      '选择要链接到此知识库的数据源，链接后文件将自动同步',
    confirmLink: '确认链接',
    noAvailableSources: '暂无可用的数据源',
    configureSourcesFirst: '请先在设置中配置数据源',
    noLinkedSources: '暂未链接数据源',
    linkSourcesTip: '链接数据源后，文件将自动同步到知识库',

    // OAuth 认证
    pasteOAuthTokenPlaceholder: '粘贴 OAuth Token JSON，或点击下方按钮进行授权',
    pasteBoxTokenPlaceholder:
      '{ "client_id": "...", "client_secret": "...", "redirect_uri": "..." }',
    waitingForAuth: '等待授权...',
    authenticateWithGoogle: '使用 Google 授权',
    authenticateWithGmail: '使用 Gmail 授权',
    authenticateWithBox: '使用 Box 授权',
    authSuccess: '授权成功',
    oauthError: '授权失败，请重试',
    oauthTimeout: '授权超时，请重试',
    boxCredentialsRequired: '请先填写 Client ID 和 Client Secret',

    // 认证方式
    authMethod: '认证方式',

    // 索引模式
    indexMode: '索引模式',
    indexEverything: '索引全部',
    indexSpaceOnly: '仅索引空间',
    indexPageOnly: '仅索引页面',
    indexWorkspace: '索引工作区',
    indexRepositories: '索引指定仓库',
    indexProjects: '索引指定项目',

    // S3 相关
    s3Description: '连接 Amazon S3 存储桶，同步文件到知识库',
    s3RegionTip: 'AWS 区域，如 us-east-1、ap-northeast-1',
    s3PrefixTip: '仅同步指定前缀的文件',
    s3Compatible: 'S3 兼容存储',
    otherS3Compatible: '其他 S3 兼容存储',
    s3EndpointTip: 'S3 兼容存储的端点 URL',

    // R2 相关
    r2Description: '连接 Cloudflare R2 存储桶，同步文件到知识库',

    // Google Cloud Storage 相关
    googleCloudStorageDescription: '连接 Google Cloud Storage 存储桶',

    // Oracle Cloud Storage 相关
    ociStorageDescription: '连接 Oracle Cloud Infrastructure 对象存储',

    // Dropbox 相关
    dropboxDescription: '连接 Dropbox 云存储，同步文件和文件夹',
    dropboxAccessTokenTip: '从 Dropbox 开发者控制台获取访问令牌',

    // Box 相关
    boxDescription: '连接 Box 云存储，同步企业文件',

    // WebDAV 相关
    webdavDescription: '连接 WebDAV 服务器，支持 NextCloud、ownCloud 等',
    webdavRemotePathTip: '要同步的远程目录路径',

    // Notion 相关
    notionDescription: '连接 Notion 工作空间，同步页面和数据库',

    // Confluence 相关
    confluenceDescription: '连接 Confluence 知识库，同步文档和空间',
    confluenceWikiBaseTip: 'Confluence 实例的 Wiki 基础 URL',
    confluenceIsCloud: '云版本',
    confluenceSpaceTip: '要索引的空间 Key',
    confluencePageIdTip: '要索引的起始页面 ID',
    confluenceTokenTip: '从 Atlassian 账户设置中获取 API Token',

    // Jira 相关
    jiraDescription: '连接 Jira 项目，同步问题和评论',
    jiraBaseUrlTip: 'Jira 实例的基础 URL',
    jiraProjectKeyTip: '要索引的项目 Key',
    jiraJqlTip: '自定义 JQL 查询过滤问题',
    jiraBatchSizeTip: '每批次获取的问题数量',
    jiraCommentsTip: '是否索引问题评论',
    jiraAttachmentsTip: '是否索引问题附件',
    jiraEmailTip: '用于 API 认证的邮箱地址',
    jiraTokenTip: '从 Atlassian 账户设置中获取 API Token',

    // Asana 相关
    asanaDescription: '连接 Asana 项目，同步任务和评论',

    // Airtable 相关
    airtableDescription: '连接 Airtable 数据库，同步表格数据',

    // Zendesk 相关
    zendeskDescription: '连接 Zendesk 知识库，同步文章和工单',

    // GitHub 相关
    githubDescription: '连接 GitHub 仓库，同步代码、Issue 和 PR',

    // GitLab 相关
    gitlabDescription: '连接 GitLab 项目，同步代码、Issue 和 MR',

    // Bitbucket 相关
    bitbucketDescription: '连接 Bitbucket 仓库，同步代码和 PR',
    bitbucketWorkspaceTip: 'Bitbucket 工作区 ID',
    bitbucketRepoSlugsTip: '要索引的仓库 slug，用逗号分隔',
    bitbucketProjectsTip: '要索引的项目 Key，用逗号分隔',
    bitbucketTokenTip: '从 Bitbucket 设置中生成应用密码',

    // 数据库相关
    fieldHost: '主机',
    fieldPort: '端口',
    fieldDatabase: '数据库',
    fieldUsername: '用户名',
    fieldPassword: '密码',
    fieldSqlQuery: 'SQL 查询',
    fieldContentColumns: '内容列',
    fieldMetadataColumns: '元数据列',
    fieldIdColumn: 'ID 列',
    fieldTimestampColumn: '时间戳列',
    rdbmsQueryPlaceholder: '留空则加载所有表',
    mysqlDescription: '连接 MySQL 数据库，通过 SQL 查询同步表数据',
    mysqlQueryTip:
      '用于从数据库提取数据的 SQL 查询，例如 SELECT * FROM products WHERE status = "active"。',
    mysqlContentColumnsTip:
      '逗号分隔的列名，这些列的值会合并为用于向量化的文档内容。',
    mysqlMetadataColumnsTip:
      '逗号分隔的列名，这些列会保存为文档元数据，不参与向量化。',
    mysqlIdColumnTip: '作为唯一文档 ID 的列。未填写时使用内容哈希。',
    mysqlTimestampColumnTip:
      '用于增量同步的日期时间或时间戳列。仅拉取上次同步后修改的行。',
    postgresqlDescription: '连接 PostgreSQL 数据库，通过 SQL 查询同步表数据',
    postgresqlQueryTip:
      "用于从数据库提取数据的 SQL 查询，例如 SELECT * FROM products WHERE status = 'active'。",
    postgresqlContentColumnsTip:
      '逗号分隔的列名，这些列的值会合并为用于向量化的文档内容。',
    postgresqlMetadataColumnsTip:
      '逗号分隔的列名，这些列会保存为文档元数据，不参与向量化。',
    postgresqlIdColumnTip: '作为唯一文档 ID 的列。未填写时使用内容哈希。',
    postgresqlTimestampColumnTip:
      '用于增量同步的日期时间或时间戳列。仅拉取上次同步后修改的行。',

    // Google Drive 相关
    googleDriveDescription: '连接 Google Drive，同步文档和文件',
    google_drivePrimaryAdminTip: '拥有管理员权限的 Google 账户邮箱',
    google_driveTokenTip: 'OAuth 凭据 JSON，包含访问令牌和刷新令牌',
    google_driveMyDriveEmailsTip: '要索引的用户邮箱列表，用逗号分隔',
    google_driveSharedFoldersTip: '要索引的共享文件夹 URL，用逗号分隔',

    // Gmail 相关
    gmailDescription: '连接 Gmail 邮箱，同步邮件内容',
    gmailPrimaryAdminTip: '拥有管理员权限的 Gmail 账户邮箱',
    gmailTokenTip: 'OAuth 凭据 JSON，包含访问令牌和刷新令牌',

    // Discord 相关
    discordDescription: '连接 Discord 服务器，同步消息和附件',

    // Moodle 相关
    moodleDescription: '连接 Moodle 学习平台，同步课程和资源',

    // IMAP 相关
    imapDescription: '通过 IMAP 协议连接邮箱，同步邮件内容',
  },
}
