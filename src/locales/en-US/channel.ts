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
      providersUnavailable:
        'Channel type metadata is temporarily unavailable, so channels cannot be created or edited. Enabling, disabling and deleting existing channels still work.',
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
      searchTargets: 'Search agents…',
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
      revisionStale:
        'Bound release is outdated, so the bot cannot answer. Edit this channel and select the current release.',
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
      // Exactly the six values the server's RuntimeState can hold.
      // There used to be twelve; six of them (pending/running/healthy/online/
      // disabled/failed) were invented client-side and never emitted.
      states: {
        // Reported while no live runner holds the binding, including after a
        // runner stops sending heartbeats.
        waiting: 'Waiting to start',
        starting: 'Connecting',
        connected: 'Connected',
        stopping: 'Stopping',
        stopped: 'Stopped',
        error: 'Runtime error',
      },
    },
    validation: { required: 'This field is required' },
    // Codes the server puts in the failure envelope's data.error_code. Written
    // as "what happened + what to do", because these failures have nothing in
    // common in terms of how an admin resolves them.
    errorCodes: {
      CHANNEL_NOT_ACCESSIBLE:
        'This channel does not belong to the current account',
      CHANNEL_TARGET_NOT_ACCESSIBLE:
        'You do not have permission to publish this target to an external channel. Ask an admin of the owning team.',
      INVALID_CHANNEL_CONFIGURATION:
        'The channel configuration is incomplete or no longer valid (missing credentials, no bound target, or a stale Agent revision)',
      CHANNEL_SECRET_STORE_UNAVAILABLE:
        'The secret store is unavailable. This is not a configuration problem — contact your operators.',
      CHANNEL_OPERATION_FAILED:
        'The server failed to process the request. Contact your operators with the time it happened.',
    },
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
