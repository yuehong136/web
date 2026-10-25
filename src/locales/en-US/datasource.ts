export default {
  datasource: {
    sharepoint: {
      description:
        'Sync SharePoint document libraries through Microsoft Graph.',
      siteUrl: 'Site URL',
      siteUrlTip:
        'Full site URL, for example https://contoso.sharepoint.com/sites/MySite. Requires Sites.Read.All and Files.Read.All application permissions with admin consent.',
      tenantId: 'Tenant ID',
      clientId: 'Client ID',
      clientSecret: 'Client secret',
    },
    slack: {
      description: 'Sync Slack channel messages and threads.',
      botToken: 'Bot token',
      botTokenTip:
        'Slack token with access to the selected channels. Requires channels:read, channels:history, users:read and groups:read/groups:history for private channels. Thread replies require a token permitted to read replies for that channel type.',
      channelScope: 'Channel scope',
      allChannels: 'All accessible channels',
      selectedChannels: 'Selected channels',
      noChannels: 'No channels',
      channels: 'Channels',
      channelsPlaceholder: 'Channel name, then Enter',
      channelsTip:
        'Exact channel names, optionally prefixed with #. Select All accessible channels to sync all; an empty selection syncs none.',
      useRegex: 'Match channel names with regular expressions',
    },
    stop: 'Stop',
    refreshMinutes: 'Sync interval (minutes)',
    pruneMinutes: 'Prune interval (minutes; 0 disables pruning)',
    timeoutSeconds: 'Task timeout (seconds)',
    scheduleInteger: 'Enter a whole number of at least {{minimum}}.',
    logTask: 'Task',
    logStartedAt: 'Started at',
    taskSync: 'Sync',
    taskPrune: 'Prune',
    pruneInProgress: 'Pruning source deletions',
    pruneCompleted: 'Removed {{removed}} documents · {{errors}} errors',
    startsInSeconds: 'Starts in {{seconds}}s',
    readyToRun: 'Ready to run',

    restApi: {
      nextCursorField: 'Next cursor field',
      nextCursorFieldTip:
        'Top-level field used when Next cursor JSONPath is empty.',
      hasNextPagePath: 'Has next page JSONPath',
      hasNextPagePathTip:
        'Optional JSONPath resolving to a boolean. True continues pagination even after an empty page.',
      batchSize: 'Document batch size',
      fieldTypeHints: 'Field type hints (JSON)',
      fieldTypeHintsTip: 'Map field paths to string, number or date.',
      fieldDefaults: 'Field default values (JSON)',
      contentTemplate: 'Content template',
      contentTemplateTip:
        'Optional {field} template. Replace dots in nested field names with underscores.',
      name: 'REST API',
      description:
        'Sync documents from an HTTP API with configurable authentication, field mapping and pagination.',
      url: 'Base URL',
      method: 'HTTP method',
      queryParams: 'Query parameters',
      queryParamsTip:
        'JSON object or one key=value pair per line. URL query parameters are also supported.',
      itemsPath: 'Items JSONPath',
      itemsPathTip:
        'JSONPath to the items array, for example $.data.items. Leave blank to detect a top-level array.',
      idField: 'ID field',
      idFieldTip:
        'Field path for a stable item ID. Leave blank to use a content hash.',
      authType: 'Authentication',
      none: 'None',
      api_key_header: 'API key header',
      bearer: 'Bearer token',
      basic: 'Username and password',
      headerName: 'API key header name',
      apiKey: 'API key',
      bearerToken: 'Bearer token',
      username: 'Username',
      password: 'Password',
      contentFields: 'Content fields',
      contentFieldsTip:
        'Comma-separated field paths to combine as document content, for example title,body or comments[*].text.',
      contentFieldsRequired: 'Enter at least one content field.',
      metadataFields: 'Metadata fields',
      metadataFieldsTip:
        'Comma-separated field paths to store as document metadata.',
      paginationType: 'Pagination',
      page: 'Page number',
      offset: 'Offset',
      cursor: 'Cursor',
      startPage: 'Start page',
      offsetParam: 'Offset parameter',
      startOffset: 'Start offset',
      cursorParam: 'Cursor parameter',
      nextCursorPath: 'Next cursor JSONPath',
      nextCursorPathTip:
        'JSONPath to the next cursor, for example $.pagination.next_cursor.',
      settings: 'Settings',
      standard: 'Standard',
      advanced: 'Advanced',
      headers: 'Custom headers',
      headersTip: 'JSON object or one key=value pair per line.',
      pageParam: 'Page parameter',
      pageSizeParam: 'Page size parameter',
      pageSize: 'Page size',
      limitParam: 'Limit parameter',
      limit: 'Offset page limit',
      initialCursor: 'Initial cursor',
      maxPages: 'Maximum pages',
      requestDelay: 'Request delay (seconds)',
      pollTimestampField: 'Poll timestamp field',
      pollTimestampFieldTip:
        'Item timestamp field for incremental sync. Leave blank to fetch all items on each sync.',
      requestBody: 'Request body (JSON)',
      requestBodyTip:
        'JSON object sent with POST requests. Leave blank to send an empty object.',
      objectRequired: 'Enter a valid JSON object.',
      keyValueRequired: 'Enter a JSON object or one key=value pair per line.',
      urlRequired: 'Enter a valid HTTP or HTTPS URL.',
      integerRequired:
        'Enter a non-negative whole number. Sizes and limits must be positive; maximum pages and batch size cannot exceed 10,000.',
      delayRequired: 'Enter a request delay between 0 and 60 seconds.',
      invalidConfig:
        'Check the REST API configuration. JSON fields must contain objects.',
      testConnection: 'Test connection',
      testing: 'Testing connection…',
      testSavedConfig:
        'Tests the saved configuration. Save your changes before testing.',
      testSuccess: 'Connection successful.',
      testFailed:
        'Connection test failed. Check the saved URL, authentication and response mapping.',
    },
    dingtalkName: 'DingTalk AI Table',
    dingtalkDescription: 'Sync records from every sheet in a DingTalk table.',
    dingtalkTableId: 'Table ID',
    dingtalkOperatorId: 'Operator Union ID',
    dingtalkAccessToken: 'Access token',
    // Page titles
    title: 'Data Source Management',
    description:
      'Manage and configure external data sources, supporting various cloud storage, collaboration platforms, and code repositories.',

    // Data source list
    addedSources: 'Added Data Sources',
    availableSources: 'Available Data Sources',
    availableSourcesDescription:
      'Select a data source type to create a new connection',
    emptyTip:
      'No data sources added yet. Click a data source type below to start adding.',

    // Add modal
    addModalTitle: 'Add {{name}} Data Source',

    // Delete confirmation
    deleteConfirmTitle: 'Delete Data Source',
    deleteConfirmMessage:
      'Are you sure you want to delete data source "{{name}}"? This action cannot be undone and linked knowledge bases will no longer sync data.',

    // Detail page
    configuration: 'Configuration',
    syncLogs: 'Sync Logs',
    syncOverview: 'Sync overview',
    syncHistory: 'Sync history',
    notFound: 'Data source not found',
    notFoundDescription:
      'This data source may have been deleted or is not accessible to this account.',
    backToList: 'Back to list',
    loadingDetail: 'Loading data source',
    loadingDetailDescription: 'Fetching configuration and recent sync state.',

    // Status
    statusPending: 'Pending',
    statusRunning: 'Running',
    statusScheduled: 'Scheduled',
    statusPaused: 'Paused',
    statusCompleted: 'Completed',
    statusFailed: 'Failed',

    // Actions
    pause: 'Pause',
    resume: 'Resume',
    rebuild: 'Rebuild',
    autoParse: 'Auto Parse',
    unbind: 'Unbind',

    // Log table
    logKnowledgeBase: 'Knowledge Base',
    logStatus: 'Status',
    logDocsIndexed: 'Docs Indexed',
    logErrors: 'Errors',
    logTime: 'Time Range',
    noLogs: 'No sync logs yet',
    noLogsDescription: 'Task results will appear here after the first sync.',
    logUpdatedAt: 'Updated at',
    logSummary: 'Task summary',
    logCursor: 'Synced through',
    logSummaryScheduled: 'Waiting for the next automatic sync',
    logSummaryRunning:
      'Fetching the data source and updating the knowledge base',
    logSummaryPaused: 'Task paused',
    logSummaryFailed: 'Sync task failed',
    logSummaryCompleted:
      'Added {{added}} · Total {{total}} · Errors {{errors}}',
    currentState: 'Current state',
    lastSuccessfulSync: 'Last successful sync',
    nextEstimatedSync: 'Estimated next sync',
    waitingForSchedule: 'Waiting for schedule details',
    syncEveryMinutes: 'Checks every {{count}} minutes',
    lastSyncSummary: 'Added {{added}} this run, {{total}} total',
    zeroChangesExplanation:
      '“Added 0” means no upstream changes were found and the task still succeeded. Scheduled means automatic sync is enabled, not that the first run is pending.',
    notAvailable: 'Not available',

    // Link data source
    dataSources: 'Data Sources',
    manageLinkedSources: 'Manage data sources linked to this knowledge base',
    linkDataSource: 'Link Data Source',
    linkDataSourceDescription:
      'Select a data source to link to this knowledge base. Files will sync automatically.',
    confirmLink: 'Confirm Link',
    noAvailableSources: 'No available data sources',
    configureSourcesFirst: 'Please configure data sources in settings first',
    noLinkedSources: 'No linked data sources',
    linkSourcesTip:
      'Link data sources to automatically sync files to the knowledge base',

    // OAuth authentication
    pasteOAuthTokenPlaceholder:
      'Paste OAuth Token JSON, or click button below to authorize',
    pasteBoxTokenPlaceholder:
      '{ "client_id": "...", "client_secret": "...", "redirect_uri": "..." }',
    waitingForAuth: 'Waiting for authorization...',
    authenticateWithGoogle: 'Authenticate with Google',
    authenticateWithGmail: 'Authenticate with Gmail',
    authenticateWithBox: 'Authenticate with Box',
    authSuccess: 'Authorization successful',
    oauthError: 'Authorization failed, please try again',
    oauthTimeout: 'Authorization timed out, please try again',
    boxCredentialsRequired: 'Please fill in Client ID and Client Secret first',

    // Authentication method
    authMethod: 'Authentication Method',

    // Index mode
    indexMode: 'Index Mode',
    indexEverything: 'Index Everything',
    indexSpaceOnly: 'Space Only',
    indexPageOnly: 'Page Only',
    indexWorkspace: 'Index Workspace',
    indexRepositories: 'Index Specific Repositories',
    indexProjects: 'Index Specific Projects',

    // S3 related
    s3Description:
      'Connect to Amazon S3 bucket and sync files to knowledge base',
    s3RegionTip: 'AWS region, e.g. us-east-1, ap-northeast-1',
    s3PrefixTip: 'Only sync files with specified prefix',
    s3Compatible: 'S3 Compatible Storage',
    otherS3Compatible: 'Other S3 Compatible Storage',
    s3EndpointTip: 'Endpoint URL for S3 compatible storage',

    // R2 related
    r2Description:
      'Connect to Cloudflare R2 bucket and sync files to knowledge base',

    // Google Cloud Storage related
    googleCloudStorageDescription: 'Connect to Google Cloud Storage bucket',

    // Oracle Cloud Storage related
    ociStorageDescription:
      'Connect to Oracle Cloud Infrastructure Object Storage',

    // Dropbox related
    dropboxDescription:
      'Connect to Dropbox cloud storage and sync files and folders',
    dropboxAccessTokenTip: 'Get access token from Dropbox developer console',

    // Box related
    boxDescription: 'Connect to Box cloud storage and sync enterprise files',

    // WebDAV related
    webdavDescription:
      'Connect to WebDAV server, supports NextCloud, ownCloud, etc.',
    webdavRemotePathTip: 'Remote directory path to sync',

    // Notion related
    notionDescription:
      'Connect to Notion workspace and sync pages and databases',

    // Confluence related
    confluenceDescription:
      'Connect to Confluence knowledge base and sync documents and spaces',
    confluenceWikiBaseTip: 'Wiki base URL of your Confluence instance',
    confluenceIsCloud: 'Cloud Version',
    confluenceSpaceTip: 'Space key to index',
    confluencePageIdTip: 'Starting page ID to index',
    confluenceTokenTip: 'Get API Token from Atlassian account settings',

    seafileDescription:
      'Sync files from SeaFile accounts, libraries or directories',
    seafileUrl: 'Server URL',
    seafileScope: 'Sync scope',
    seafileScope_account: 'Account',
    seafileScope_library: 'Library',
    seafileScope_directory: 'Directory',
    seafileRepo: 'Library ID',
    seafilePath: 'Directory path',
    seafileShared: 'Include shared libraries',
    seafileToken: 'Account token',
    seafileRepoToken: 'Library token',
    seafileScopeTip:
      'Library and directory scopes require a library ID. Directory scope also requires a non-root path.',
    seafileCredentialsTip:
      'Supply an account token, or a library token for library/directory scope.',
    zendeskDeletionLimit:
      'Source deletion sync is available for articles only. Ticket exports omit the most recent minute, so ticket deletion sync stays off.',
    syncDeletedFiles: 'Sync source deletions',
    syncDeletedFilesTip:
      'Off by default. Applies to subsequent syncs; initial imports and rebuilds do not check deletions. A successful complete source listing removes knowledge base documents missing from that listing. A complete empty listing removes all linked documents. The listing follows your current credentials and configuration; narrowing permissions, paths or JQL may also remove local documents. Permission or pagination failures never delete based on partial results.',
    notionSyncDeletedFilesTip:
      'Off by default. Notion deletion sync requires Root Page Id and a complete recursive listing of that root; workspace Search does not support deletion sync. Missing documents are removed from the knowledge base, and a complete empty listing removes all linked documents. The listing follows your current credentials and configuration; narrowing permissions or root scope may also remove local documents. Permission or pagination failures never delete based on partial results.',
    jiraBaseUrl: 'Jira Base URL',
    jiraProjectKey: 'Project Key',
    jiraJql: 'Custom JQL',
    jiraBatchSize: 'Batch Size',
    jiraAttachmentSize: 'Attachment Size Limit (bytes)',
    jiraAttachmentSizeTip: 'Maximum size of each attachment to sync.',
    jiraLabelsToSkip: 'Labels to Skip',
    jiraCommentBlacklist: 'Comment Email Blacklist',
    jiraIncludeComments: 'Include Comments',
    jiraIncludeAttachments: 'Include Attachments',
    jiraMode: 'Authentication Mode',
    jiraTokenAuthentication: 'API token',
    jiraPasswordAuthentication: 'Username and password',
    jiraEmail: 'Jira User Email',
    jiraToken: 'Jira API Token',
    jiraUsername: 'Jira Username',
    jiraPassword: 'Jira Password',
    jiraPasswordTip: 'Username and password authentication for Jira Server.',
    jiraScopedToken: 'Use Scoped Token',
    jiraServerCredentialsRequired: 'Enter a Jira username and password.',
    jiraCloudCredentialsRequired: 'Enter a Jira API token.',

    // Jira related
    jiraDescription: 'Connect to Jira project and sync issues and comments',
    jiraBaseUrlTip: 'Base URL of your Jira instance',
    jiraProjectKeyTip: 'Project key to index',
    jiraJqlTip: 'Custom JQL query to filter issues',
    jiraBatchSizeTip: 'Number of issues to fetch per batch',
    jiraCommentsTip: 'Whether to index issue comments',
    jiraAttachmentsTip: 'Whether to index issue attachments',
    jiraEmailTip: 'Email address for API authentication',
    jiraTokenTip: 'Get API Token from Atlassian account settings',

    // Asana related
    asanaDescription: 'Connect to Asana project and sync tasks and comments',

    // Airtable related
    airtableDescription: 'Connect to Airtable database and sync table data',

    // Zendesk related
    zendeskDescription:
      'Connect to Zendesk knowledge base and sync articles and tickets',

    // GitHub related
    githubDescription:
      'Connect to GitHub repository and sync code, issues, and PRs',

    // GitLab related
    gitlabDescription:
      'Connect to GitLab project and sync code, issues, and MRs',

    // Bitbucket related
    bitbucketDescription:
      'Connect to Bitbucket repository and sync code and PRs',
    bitbucketWorkspaceTip: 'Bitbucket workspace ID',
    bitbucketRepoSlugsTip: 'Repository slugs to index, separated by commas',
    bitbucketProjectsTip: 'Project keys to index, separated by commas',
    bitbucketAccountEmail: 'Bitbucket account email',
    bitbucketAccountEmailTip:
      'Email of the Atlassian account associated with the API token',
    bitbucketTokenTip: 'API token for the specified Bitbucket account',

    // Database related
    fieldHost: 'Host',
    fieldPort: 'Port',
    fieldDatabase: 'Database',
    fieldUsername: 'Username',
    fieldPassword: 'Password',
    fieldSqlQuery: 'SQL Query',
    fieldContentColumns: 'Content Columns',
    fieldMetadataColumns: 'Metadata Columns',
    fieldIdColumn: 'ID Column',
    fieldTimestampColumn: 'Timestamp Column',
    rdbmsQueryPlaceholder: 'Leave empty to load all tables',
    mysqlDescription:
      'Connect to MySQL database to sync table rows using SQL queries',
    mysqlQueryTip:
      'SQL query to extract data from your database, for example SELECT * FROM products WHERE status = "active".',
    mysqlContentColumnsTip:
      'Comma-separated column names whose values will be combined as document content for vectorization.',
    mysqlMetadataColumnsTip:
      'Comma-separated column names to store as document metadata without vectorizing them.',
    mysqlIdColumnTip:
      'Column to use as the unique document ID. If omitted, a content hash is used.',
    mysqlTimestampColumnTip:
      'Datetime or timestamp column for incremental sync. Only rows modified after the last sync are fetched.',
    postgresqlDescription:
      'Connect to PostgreSQL database to sync table rows using SQL queries',
    postgresqlQueryTip:
      "SQL query to extract data from your database, for example SELECT * FROM products WHERE status = 'active'.",
    postgresqlContentColumnsTip:
      'Comma-separated column names whose values will be combined as document content for vectorization.',
    postgresqlMetadataColumnsTip:
      'Comma-separated column names to store as document metadata without vectorizing them.',
    postgresqlIdColumnTip:
      'Column to use as the unique document ID. If omitted, a content hash is used.',
    postgresqlTimestampColumnTip:
      'Datetime or timestamp column for incremental sync. Only rows modified after the last sync are fetched.',

    // Google Drive related
    googleDriveDescription:
      'Connect to Google Drive and sync documents and files',
    google_drivePrimaryAdminTip: 'Google account email with admin permissions',
    google_driveTokenTip:
      'OAuth credentials JSON containing access token and refresh token',
    google_driveMyDriveEmailsTip:
      'Service accounts only: comma-separated user emails. Leave blank for OAuth connections.',
    google_driveSharedFoldersTip:
      'Shared folder URLs to index, separated by commas',

    // Gmail related
    gmailDescription: 'Connect to Gmail mailbox and sync email content',
    gmailPrimaryAdminTip: 'Gmail account email with admin permissions',
    gmailTokenTip:
      'OAuth credentials JSON containing access token and refresh token',

    // Discord related
    discordDescription:
      'Connect to Discord server and sync messages and attachments',

    // Moodle related
    moodleDescription:
      'Connect to Moodle learning platform and sync courses and resources',

    // RSS related
    rssDescription: 'Connect to an RSS or Atom feed and sync articles',
    rssFeedUrl: 'Feed URL',
    rssBatchSize: 'Batch size',
    rssSyncDeletedFilesTip:
      'Mirror the current feed. Articles that leave its rolling window are also deleted locally, even if the original article still exists. Leave off to retain history.',

    // IMAP related
    imapDescription:
      'Connect to mailbox via IMAP protocol and sync email content',
  },
}
