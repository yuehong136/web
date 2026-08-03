export default {
  channel: {
    title: 'Channels',
    description:
      'Manage external messaging platforms and bind them securely to published MultiRAG capabilities.',
    overview:
      'Channel credentials are stored only on the server. Once enabled, an independent Channel Runtime receives messages and invokes the bound MultiRAG target.',
    providers: {
      feishu: 'Feishu',
    },
    actions: {
      create: 'New channel',
      edit: 'Edit',
      enable: 'Enable',
      disable: 'Disable',
      delete: 'Delete',
      cancel: 'Cancel',
      retry: 'Retry',
      saveDraft: 'Save draft',
    },
    status: {
      enabled: 'Enabled',
      draft: 'Draft',
    },
    states: {
      loading: 'Loading channels',
      loadingDescription: 'Reading channel configuration and runtime state.',
      error: 'Unable to load channels',
      errorDescription:
        'Channel information is temporarily unavailable. Try again shortly.',
      empty: 'No channels yet',
      emptyDescription:
        'Create a Feishu channel and bind a MultiRAG Agent or dialog app.',
    },
    form: {
      createTitle: 'New channel',
      editTitle: 'Edit channel',
      description:
        'Save a draft first, then enable it after confirming credentials and the binding.',
      basicSection: 'Basics',
      connectionSection: 'Platform connection',
      bindingSection: 'MultiRAG binding',
    },
    fields: {
      name: { label: 'Channel name' },
      provider: { label: 'Channel type' },
      app_id: {
        label: 'App ID',
        description: 'The App ID from the Feishu Open Platform.',
        placeholder: 'cli_xxx',
      },
      app_secret: {
        label: 'App Secret',
        description:
          'Submitted only to server-side secret storage and never displayed again.',
        placeholder: 'Enter the App Secret',
      },
      domain: {
        label: 'Feishu domain',
        description:
          'Use feishu for mainland China or lark for Lark international.',
        placeholder: 'feishu',
      },
      allowed_open_ids: {
        label: 'Allowed user Open IDs',
        description:
          'Optional. Enter one Open ID per line or comma-separated. Leave blank to rely on the app availability scope.',
        placeholder: 'ou_xxx',
      },
    },
    secret: {
      label: 'Platform secret',
      configured: 'Configured',
      missing: 'Not configured',
      keepPlaceholder: 'Leave blank to keep the existing secret',
      keepHelp:
        'The existing value is never displayed. Enter a new value only to rotate it.',
    },
    binding: {
      target: 'Bound target',
      targetType: 'Target type',
      selectTargetType: 'Select a target type',
      targetId: 'Target ID',
      targetIdDescription:
        'The target must belong to the current tenant and have an executable published version.',
      selectTarget: 'Select a published target',
      loadingTargets: 'Loading available targets',
      targetsLoadFailed:
        'Unable to load available targets. Close this panel and try again.',
      unnamedTarget: 'Unnamed target',
      revisionId: 'Release revision ID',
      revisionIdDescription:
        'This ID verifies that the Agent is still on its latest published revision; execution continues to use MultiRAG release mode.',
      staleRelease: 'Previous revision {{revision}} (outdated)',
      staleReleaseDescription:
        'The Agent has a newer release. Select the current revision and save; MultiRAG will not switch DSL silently.',
      dialogRevisionDescription:
        'Dialog apps do not currently require a separate release revision.',
      currentRelease: 'Current published revision',
      versionLabel: 'Version {{number}}',
      notConfigured: 'Not bound',
      types: {
        canvasAgent: 'MultiRAG Agent',
        dialog: 'MultiRAG dialog app',
      },
    },
    policy: {
      privateChatOnly: 'Private chats only',
      privateChatOnlyDescription:
        'Group messages will not invoke the bound target.',
    },
    runtime: {
      label: 'Runtime',
      unknown: 'Unknown',
      lastHeartbeat: 'Last heartbeat',
      errorCode: 'Runtime error: {{code}}',
      states: {
        pending: 'Pending',
        starting: 'Connecting',
        connected: 'Connected',
        running: 'Running',
        healthy: 'Healthy',
        online: 'Online',
        stopped: 'Stopped',
        disabled: 'Disabled',
        failed: 'Failed',
      },
    },
    validation: { required: 'This field is required' },
    messages: {
      saved: 'Channel draft saved',
      saveFailed: 'Unable to save the channel',
      enabled: 'Channel enabled',
      disabled: 'Channel disabled',
      toggleFailed: 'Unable to update the channel state',
      deleted: 'Channel deleted',
      deleteFailed: 'Unable to delete the channel',
    },
    delete: {
      title: 'Delete channel?',
      description:
        'This deletes the connection, binding, and runtime state for “{{name}}”. This action cannot be undone.',
    },
  },
}
