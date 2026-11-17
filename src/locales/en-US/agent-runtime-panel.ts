export const runtimePanelMessages = {
  workbench: {
    title: 'Agent runtime workbench',
    description:
      'Configure Begin inputs and review run messages and the node execution timeline',
    runTab: 'Run',
    conversationTab: 'Conversation',
    stop: 'Stop',
  },
  header: {
    title: 'Agent run and step debugging',
    historySession: 'Past session',
    liveUnnamed: 'Live · Untitled',
    idleDescription:
      'Set the Begin inputs here, then review the conversation and the node timeline.',
    lastRunAt: 'Last run {{time}}',
    reset: 'Clear this run',
    close: 'Close the run workbench',
    currentSession: 'Current session: {{name}}',
    sessionIdPending: 'The session_id arrives from the backend after a run',
    newSession: 'New session',
  },
  sessionPicker: {
    trigger: 'Switch session',
    recentSessions: 'Recent sessions',
    hint: 'Only changes which session the Log shows; the current run is not affected.',
    backToLive: 'Back to Live',
    unnamedSession: 'Untitled session',
    liveBadge: 'Live',
    noTime: 'No time info',
    empty: 'No past sessions',
  },
  runPanel: {
    taskModeHint:
      'The Begin node is in task mode. Submitting the inputs starts a test run right away.',
    chatModeHint:
      'Submit the Begin inputs to open a session, then keep sending test messages.',
    noInputFields:
      'The Begin node has no extra input fields. You can still submit this page to go straight to the session.',
  },
  chatBox: {
    downloadFailed: 'Attachment download failed',
    emptyTitle: 'No run messages yet',
    emptyDescription:
      'Submit the start inputs on the Run tab, then send test messages here. Regular agents use the latest graph in the editor.',
    taskModeDescription:
      'In task mode, submit the start inputs on the Run tab first. Messages and the execution trace appear here after the run.',
  },
  chatPanel: {
    emptyTitle: 'No messages yet',
    emptyDescription: 'Send the first message to start the session.',
    taskModeTitle: 'Task mode session',
    taskModeDescription:
      'Submit the start inputs on the Run tab first. Messages and the execution trace appear here after the run.',
    placeholder: 'Type a test message...',
    attachmentMissingDocId:
      'This attachment has no doc_id and cannot be downloaded',
  },
  thoughtChain: {
    ioSummary: 'Input: {{input}} · Output: {{output}}',
    thoughts: 'Thoughts / Trace',
    error: 'Error',
    eventCount_one: '{{count}} event',
    eventCount_other: '{{count}} events',
    itemCount_one: '{{count}} item',
    itemCount_other: '{{count}} items',
    fieldSummary_one: '{{count}} field · {{preview}}...',
    fieldSummary_other: '{{count}} fields · {{preview}}...',
    systemMetadata: 'System metadata',
    actions: {
      action: 'Agent Action',
      tool: 'Tool Call',
      control: 'Flow Control',
      data: 'Data Step',
      system: 'Runtime',
    },
    nodeNames: {
      begin: 'Begin',
      workflowFinished: 'Workflow finished',
      error: 'Run error',
      event: 'Run event',
    },
  },
  tracePanel: {
    stepCount_one: '{{count}} step',
    stepCount_other: '{{count}} steps',
    toolCount_one: '{{count}} tool',
    toolCount_other: '{{count}} tools',
    failedCount_one: '{{count}} failed',
    failedCount_other: '{{count}} failed',
    runningCount_one: '{{count}} running',
    runningCount_other: '{{count}} running',
  },
  logPanel: {
    nodeTimeline: 'Node timeline',
  },
  controller: {
    missingCanvasForSave:
      'Missing canvas ID, so the current run context cannot be saved',
    saveFailed: 'Save failed, so the runtime workbench cannot open',
    inputsSynced: 'Run inputs synced. Start typing test messages',
    missingCanvasForSession:
      'Missing canvas ID, so a session cannot be created',
  },
  logDetail: {
    copySessionId: 'Copy Session ID',
    copyRawJson: 'Copy Raw JSON',
    downloadTrace: 'Download Trace',
    copyTracePaths: 'Copy Trace paths',
    refetchTrace: 'Fetch Trace again',
    retry: 'Retry',
    continueInSession: 'Continue in this session',
    noLatestOutput: 'No recent output to show.',
    latestOutput: 'Latest output',
    downloadJson: 'Download JSON',
    runError: 'Run error',
    noInputs: 'This run has no Begin inputs to show.',
    noTranscript: 'This session has no messages to show.',
  },
  formSheet: {
    unsupportedTitle: 'Editing this node configuration is not supported yet',
    unsupportedDescription:
      'This node type is {{type}}. You can still connect, run or save it on the canvas.',
    jsonLabel: 'JSON',
  },
}
