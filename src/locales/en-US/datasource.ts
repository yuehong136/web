export default {
  datasource: {
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
    bitbucketTokenTip: 'Generate app password from Bitbucket settings',

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
      'List of user emails to index, separated by commas',
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

    // IMAP related
    imapDescription:
      'Connect to mailbox via IMAP protocol and sync email content',
  },
}
