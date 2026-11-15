export default {
  memory: {
    dreaming: {
      title: 'Maintenance',
      description:
        'Prepare memory candidates, inspect their sources, and review publication.',
      boundary:
        'Model-generated candidates remain separate from active memory. Review and approve candidates before explicitly publishing them; completion does not verify their factual accuracy.',
      unsupported:
        'This backend does not support reviewed memory maintenance. Existing memory controls remain available.',
      newJob: 'Prepare a job',
      sourceIds: 'RAW source IDs',
      sourcePlaceholder:
        'One exact decimal ID per line, or separated by commas',
      explicitScope:
        'Select 1–{{count}} exact RAW source IDs. An empty selection never means the whole bank.',
      invalidSources:
        'Enter 1–{{count}} unique, positive int64 decimal source IDs without rounding.',
      invalidEntries:
        'Select up to 32 unique entry IDs (32 lowercase hexadecimal characters each).',
      invalidBudget: 'Use whole tokens: input 1,024–32,768; output 256–8,192.',
      entryIds: 'Target entry IDs (optional)',
      entryScope:
        'Only these current entries can receive a proposed patch. An empty selection allows additions only.',
      inspectSources: 'Inspect / register selected sources',
      sourceRegistration: 'Selected source controls',
      registrationBoundary:
        'Register each source explicitly before creating a job. Registration can activate managed mode for this entire bank. Source withdrawal is permanent and uses its own confirmation.',
      policy: 'Policy',
      policies: {
        general: 'General facts',
        preferences: 'Preferences',
        decisions: 'Decisions',
        procedures: 'Procedures',
      },
      inputBudget: 'Input token budget',
      outputBudget: 'Output token budget',
      budgetBoundary:
        'These are estimated host budgets. Oversized sources are deferred whole, without truncation; model usage and estimated tokens are separate.',
      requiresManaged:
        'This job requires a managed bank and registered active sources. Use the explicit source registration controls first.',
      create: 'Create input snapshot',
      createUnknown:
        'The create result is unconfirmed. Preserve this operation ID; read the job list or explicitly retry the same frozen request.',
      findCreatedJob: 'Find the original job',
      retryCreate: 'Retry the same create request',
      jobs: 'Jobs & analysis',
      job: 'Job ID',
      jobState: 'Job state',
      selectJob: 'Select a job',
      resumeJob: 'Open an existing job ID',
      resumePublication: 'Read a publication operation ID',
      open: 'Open',
      run: 'Run analysis explicitly',
      cancel: 'Cancel job',
      explicitRun:
        'Reading or refreshing a job never runs the model. Failed or interrupted analysis keeps the same analysis operation ID.',
      analysisOperation: 'Analysis operation',
      estimatedInput: 'Estimated input tokens / budget',
      coverage:
        'Selected {{selected}} · included {{included}} · analyzed {{analyzed}} · deferred {{deferred}}',
      deferred:
        'Some sources were deferred whole and have not been analyzed. Do not treat this job as complete coverage of every selected source.',
      analysisReady:
        'Analysis finished. Candidates still require review and explicit publication; their facts remain unverified.',
      runningBoundary:
        'An in-flight model request may still be settling. Refresh reads state; cancellation is not complete until the server confirms it.',
      inputManifest: 'Input versions & coverage',
      sourceVersion: 'revision {{revision}} · generation {{generation}}',
      inputDeferred: 'This input is deferred; its body was not analyzed.',
      analysisModel: 'Analysis model',
      usage: 'Reported model usage (separate from estimates)',
      jobStates: {
        pending: 'Snapshot prepared',
        running: 'Analysis running',
        ready: 'Analysis finished',
        failed: 'Analysis failed / needs recovery',
        cancel_requested: 'Cancellation requested',
        canceled: 'Canceled',
        stale: 'Inputs changed',
        redacted: 'Unavailable evidence',
      },
      coverageStates: {
        included: 'Included',
        deferred: 'Deferred',
        analyzed: 'Analyzed',
      },
      candidates: 'Review candidates',
      noCandidates: 'No reviewable candidates',
      noCandidatesDescription:
        'Prepare and explicitly run a job. A successful analysis can also produce no publishable change.',
      actions: {
        add: 'Add memory',
        patch: 'Patch current entry',
        noop: 'No change',
      },
      candidateStates: {
        pending: 'Awaiting review',
        approved: 'Approved, unpublished',
        rejected: 'Rejected',
        publishing: 'Publication pending',
        published: 'Published',
        stale: 'Stale',
        redacted: 'Redacted',
      },
      candidateRevision: 'candidate revision {{revision}}',
      targetEntry: 'Target entry',
      targetRevision: 'expected entry revision {{revision}}',
      selectPublication: 'Select for publication',
      assessment: 'Assessment',
      old_text: 'Before',
      new_text: 'Proposed result',
      provenance: 'Evidence sources ({{count}})',
      redacted:
        'The evidence is unavailable or changed. Candidate text is hidden and cannot be approved or published.',
      approve: 'Approve candidate',
      reject: 'Reject candidate',
      reviewUnknown:
        'The review result is unconfirmed. Read current state or explicitly retry this original review operation.',
      retryReview: 'Retry original review',
      conflict:
        'The selection or version changed. Refresh and inspect the latest sources and candidate diff before creating a new command. An unknown publication keeps its original operation ID.',
      publishBoundary:
        'Only approved candidates at their current revision can publish (up to {{count}}). This is a single selected batch decision; index synchronization may still be pending.',
      publishSelected: 'Publish selected approved candidates ({{count}})',
      anotherBatch: 'Prepare another reviewed batch',
      refreshRejected: 'Recheck rejected operation before reviewing again',
    },
    writers: {
      rawPublished: 'Raw conversation publication confirmed.',
      queueUnconfirmed:
        'The raw conversation is indexed, but extraction queue acknowledgement is still unconfirmed.',
      appendPending: 'Raw conversation publication is pending.',
      queueState: 'Extraction queue',
      rawSource: 'Raw source ID',
      extractionTask: 'Extraction task ID',
      noExtraction: 'This bank does not require an extraction task.',
      extractionBoundary:
        'A submitted queue task is not completed extraction. Check the worker task separately; this receipt does not confirm extracted facts.',

      activation:
        'This enables managed mode for the whole memory bank. Existing unadopted records remain readable.',
      managed: 'This memory bank uses managed publication.',
      append: 'New conversations',
      automatic_extraction: 'Automatic extraction',
      fifo: 'FIFO capacity retention',
      supported: 'Supported',
      unavailable: 'Unavailable on this server',
      operationBoundary:
        'Accepted work may still be pending. Inspect its operation before treating it as published.',
      legacyDrain:
        'Before deployment, operators must drain legacy writers and verify untracked tasks. Unknown writes can block deletion until reconciled.',
    },
    deletion: {
      description:
        'Stop new writes and retrieval, wait for admitted writers to settle, then remove the bank and tracked data. Backups and untraceable copies are not certified erased.',
      completed: 'Memory bank deletion confirmed',
      pending: 'Deletion accepted. Waiting for writers and tracked cleanup.',
      lifecycle: 'Bank lifecycle',
      notConfirmed: 'Not confirmed',
      blockedBy: 'Waiting on',
      operatorRequired:
        'An unresolved writer requires operator verification. Keep this operation ID; creating another operation does not release it.',
      keepOperation:
        'Keep this operation ID until deletion is confirmed. Reading status does not advance cleanup. This page does not restore the operation after a reload.',
      unavailable:
        'This server does not yet support coordinated deletion of managed banks.',
      drain: {
        active_attempts: 'Active writer attempts',
        unknown_attempts: 'Unknown writer attempts',
        pending_appends: 'Pending appends',
        untracked_tasks: 'Untracked tasks',
      },
    },
    revisions: {
      notCertified: 'Not certified complete',
      trackedCleanup: 'Tracked index cleanup',
      retainedCopies:
        'This receipt covers tracked projections. It does not certify erasure of untracked copies or backups.',

      managedForgetScope:
        'Stop normal supply of this derived memory and redact its tracked managed revision history. The raw source, other derived memories, unrelated copies and backups remain. Physical cleanup is tracked separately.',
      inflight:
        'A previous attempt may still be running. Keep this operation ID, wait and inspect its status. Manual verification may be needed before reconciliation can proceed.',
      title: 'Correct memory',
      adoptDescription:
        'Adopt this derived record before editing. Reading history never adopts or publishes it.',
      activationImpact:
        'This enables managed mode for the entire memory bank. Ordinary automatic writes and whole-bank deletion are temporarily restricted. Existing unadopted records remain readable.',
      managedImpact:
        'This bank is managed. Ordinary automatic writes and whole-bank deletion are temporarily restricted; unadopted records remain readable.',
      activationConfirm: 'I understand this applies to the entire memory bank.',
      adopt: 'Enable managed editing',
      userAsserted:
        'A manual correction is a user assertion. A source reference records provenance and does not verify that the statement is true.',
      version: 'Revision {{revision}}',
      refresh: 'Refresh current revision',
      replace: 'Replace content',
      exactPatch: 'Exact text patch',
      content: 'Corrected content',
      oldText: 'Exact text to replace (must occur once)',
      newText: 'Replacement text',
      reason: 'Reason',
      preview: 'Preview correction',
      submit: 'Submit previewed correction',
      previewTitle: 'Correction preview',
      estimatedTokens: 'Estimated tokens: {{count}}',
      before: 'Before',
      after: 'After',
      history: 'Revision history and sources',
      redacted: 'Content has been removed from this history view.',
      firstHistory: 'Newest revisions',
      source: 'Source',
      scope: 'Source scope',
      sourceManaged: 'Registered source',
      sourceUnmanaged: 'Unregistered source',
      adoptSource: 'Register source for withdrawal',
      withdraw: 'Withdraw source',
      withdrawScope:
        'Permanently stop supplying this source and its tracked derived memories from normal reads. Historical content is redacted and physical index cleanup is tracked separately. This does not erase backups or unrelated copies.',
      withdrawConfirm:
        'I confirm withdrawal for this source and its tracked derived memories.',
      withdrawn:
        'This source is withdrawn from normal supply. Check the operation for physical cleanup status.',
      operation: 'Operation status',
      publication: 'Publication',
      indexSync: 'Index synchronization',
      supply: 'Normal supply',
      cleanup: 'Physical cleanup',
      complete: 'Complete',
      pendingShort: 'Pending or unconfirmed',
      ready: 'The operation is confirmed ready.',
      pending:
        'Completion has not been confirmed. Read the latest status, or reconcile this operation to resume pending work.',
      refreshStatus: 'Read latest status',
      reconcile: 'Reconcile this operation',
      statusFailed:
        'Status could not be confirmed. Keep this operation ID and refresh; do not submit a new command.',
      conflict:
        'The record changed. Refresh it and create a new preview before submitting.',
      unknown:
        'The result is unconfirmed. Read the original operation and reconcile explicitly; do not resend the command.',
      failed:
        'The request could not be completed. Refresh the record or read its operation status.',
      unsupported:
        'Managed corrections are unavailable on this storage backend.',
      unsafeId:
        'This legacy identifier cannot be represented exactly. Editing is disabled to protect the original record.',
      capabilitiesFailed: 'Memory editing capabilities could not be loaded.',
      readOnly: 'This revision is not editable. Refresh its state.',
      managedNotice:
        'Managed mode is active. Ordinary automatic writes and whole-bank deletion are restricted. Existing records remain readable.',
      legacyForgetScope:
        'This forget action stops normal retrieval for this selected record only. It does not erase raw sources, other derived memories, history or backups. Source withdrawal is a separate action in the source inspector.',
    },
    page: {
      title: 'Memory banks',
      description: 'Manage AI memory so conversations become more contextual.',
      create: 'Create memory bank',
    },
    common: {
      allMemories: 'All memory banks',
      loading: 'Loading...',
      online: 'Online',
      notEditable: 'Locked after creation',
      selectedCount: '{{count}} selected (1 required)',
      clear: 'Clear',
    },
    validation: {
      nameRequired: 'Enter a name.',
      memoryTypeRequired: 'Select at least one memory type.',
      rawRequired: 'Raw memory is required.',
      selectEmbeddingRequired: 'Select an embedding model.',
      selectLlmRequired: 'Select a large language model.',
    },
    toast: {
      createSuccess: 'Memory bank "{{name}}" created.',
      createFailed: 'Failed to create memory bank.',
      updateFailed: 'Failed to update memory bank.',
      deleteSuccess: 'Memory bank deleted.',
      deleteFailed: 'Failed to delete memory bank.',
      updateMessageStatusFailed: 'Failed to update message status.',
      forgetMessageSuccess: 'Message forgotten.',
      forgetMessageFailed: 'Failed to forget message.',
    },
    dialog: {
      createTitle: 'Create memory bank',
      createDescription: 'Configure the basic information and models.',
      editTitle: 'Edit memory bank',
      editDescription: 'Update the memory bank name and avatar.',
      editSettingsTip: 'Open settings to edit more configuration.',
    },
    stats: {
      totalMemories: 'Memory banks',
      totalMessages: 'Messages',
      totalStorage: 'Storage',
      activeMemories: 'Active',
    },
    filters: {
      memoryType: 'Memory type',
      raw: 'Raw',
      rawDescription: 'Raw conversation content between the user and agent.',
      semantic: 'Semantic',
      semanticDescription:
        'General knowledge and facts about the user and world.',
      episodic: 'Episodic',
      episodicDescription: 'Specific timestamped events and experiences.',
      procedural: 'Procedural',
      proceduralDescription: 'Learned skills, habits, and procedures.',
      searchPlaceholder: 'Search memory banks...',
      searchTypePlaceholder: 'Search memory types...',
      selectTypePlaceholder: 'Select memory types...',
      noTypeFound: 'No memory types found.',
      required: 'Required',
      tooltip:
        'Raw: raw conversation content between the user and agent (required by default).\nSemantic: general knowledge and facts about the user and world.\nEpisodic: specific timestamped events and experiences.\nProcedural: learned skills, habits, and procedures.',
    },
    fields: {
      name: 'Name',
      namePlaceholder: 'Enter memory bank name',
      avatar: 'Avatar',
      avatarUploadTips: 'JPG and PNG supported, up to 5 MB',
      description: 'Description',
      descriptionPlaceholder: 'Enter a description',
      storageType: 'Storage type',
      permission: 'Permission',
      createdAt: 'Created',
      updatedAt: 'Updated',
      graph: 'Graph',
      table: 'Table',
      onlyMe: 'Only me',
      team: 'Team',
      embeddingModel: 'Embedding model',
      embeddingModelTooltip:
        'Converts text into vectors for semantic similarity search and memory retrieval.',
      llm: 'Large language model',
      llmTooltip:
        'Analyzes conversation content, extracts key information, and generates structured memory summaries.',
    },
    empty: {
      listTitle: 'No memory banks yet',
      listDescription:
        'Create your first memory bank so AI can remember conversations.',
      searchTitle: 'No matching memory banks',
      searchDescription: 'Adjust your search or filters.',
      messagesTitle: 'No messages',
      messagesDescription:
        'When agents use this memory bank, conversation content will be recorded here.',
    },
    messages: {
      title: 'Messages',
      description:
        'Memory extraction uses the prompts and temperature configured in advanced settings.',
      searchPlaceholder: 'Search messages...',
      total: '{{count}} messages',
      agent: 'Agent',
      sessionId: 'Session ID',
      type: 'Type',
      validDate: 'Valid date',
      forgetAt: 'Forget at',
      enable: 'Enabled',
      content: 'Content',
      contentEmbed: 'Embedding vector',
      viewContent: 'View content',
      loadContentFailed: 'Failed to load message content',
      conversation: 'Conversation',
      rawContent: 'Raw content',
      userInput: 'User input',
      agentResponse: 'Agent response',
      extractedMemories: 'Extracted memories',
      vectorDimensions: '{{count}} dimensions',
      forget: 'Forget',
      forgetTitle: 'Forget message',
      forgetDescription:
        'After this message is forgotten, agents will no longer retrieve it.',
      noMessages: 'No messages',
      previous: 'Previous',
      next: 'Next',
      pageStatus: 'Page {{page}} of {{totalPages}}',
    },
    model: {
      loading: 'Loading models...',
      noChatModels:
        'No chat models available. Add one in model providers first.',
      chatPlaceholder: 'Select a chat model',
      chatEmpty: 'No matching chat models found',
    },
    upload: {
      invalidType: 'Select an image file.',
      tooLarge: 'Avatar image must be 5 MB or smaller.',
      readFailed: 'Failed to read the file.',
      changeAvatar: 'Change avatar',
      removeAvatar: 'Remove avatar',
    },
    config: {
      title: 'Memory bank settings',
      description: 'Configure basic information and advanced settings.',
      basicInfo: 'Basic information',
      modelConfig: 'Model configuration',
      advancedSettings: 'Advanced settings',
      messageLockedHint: '{{count}} messages exist',
      messageLockedBanner:
        '{{count}} messages exist. Some configuration cannot be modified.',
      memorySize: 'Memory size',
      memorySizeTooltip:
        'Counts each message content plus its embedding vector (about content plus dimensions times 8 bytes).\nFor example, a 1 KB message with 1024-dimension embeddings uses about 9 KB. The 5 MB default stores about 500 messages.',
      forgettingPolicy: 'Forgetting policy',
      fifo: 'First in, first out (FIFO)',
      lru: 'Least recently used (LRU)',
      temperature: 'Temperature',
      temperatureTooltip:
        'Controls output randomness. Higher values produce more varied output.',
      systemPrompt: 'System prompt',
      systemPromptPlaceholder: 'Set the system prompt for memory extraction...',
      userPrompt: 'User prompt',
      userPromptPlaceholder: 'Set the user prompt for memory extraction...',
      saveSuccess: 'Saved',
      saveFailed: 'Save failed',
    },
    toolbar: {
      detailedTime: 'Detailed time',
      compactTime: 'Compact time',
      relativeTime: 'Relative time',
      descending: 'Desc',
      ascending: 'Asc',
      gridView: 'Grid view',
      listView: 'List view',
    },
    pagination: {
      total: '{{count}} items',
      previous: 'Previous',
      next: 'Next',
    },
    deleteDialog: {
      title: 'Delete memory bank',
      description:
        'After deletion, all messages in this memory bank will be removed and agents will no longer retrieve them.',
    },
    workspace: {
      enabledCount: 'Enabled memories: {{count}}',
      stateHelp: 'Page scope and lifecycle help',

      sourcePage: 'Page {{page}} · Sources on this page: {{count}}',
      messageId: 'Message ID',
      title: 'Memory workspace',
      description:
        'See what AI remembers, trace each memory, and verify retrieval.',
      strategy: 'Settings & policies',
      testRecall: 'Test retrieval',
      memories: 'Extracted memories',
      sources: 'Conversation sources',
      all: 'All states',
      enabled: 'Enabled',
      disabled: 'Disabled',
      forgotten: 'Forgotten',
      stateFilter: 'Filter states on this page',
      pageOverview:
        'This page: {{sources}} sources · {{memories}} extracted memories',
      pageScope:
        '{{count}} extracted memories are enabled. Counts and state filters apply to this page only.',
      sessionPlaceholder: 'Find a source by its full session ID',
      checkSession: 'Check the session ID or clear the filter to try again.',
      lifecycleHint:
        'Forgotten records remain visible for traceability and their state cannot be changed. Sources and extracts have independent states; forgetting a source does not automatically forget its extracts.',
      toggleMessage: 'Toggle message {{id}}',
      noEntries: 'No matching memories here',
      noEntriesDescription:
        'Switch to conversation sources, adjust the state filter, or check another page.',
      source: 'Source',
      extractCount: 'Extracted memories: {{count}}',
      copySession: 'Copy source session ID',
      noContent: 'No content preview; open details',
      forgetExplanation:
        'This marks the selected record with a forgetting time. It can no longer be retrieved or re-enabled, but stays visible in the list. Related sources and extracts are not forgotten together.',
      inspect: 'Memory details',
      inspectDescription: 'Inspect content, provenance, and lifecycle.',
      technicalDetails: 'Raw content & technical details',
      recallDescription:
        'Query this memory directly to check whether existing content can be recalled.',
      recallQuestion: 'What should AI remember?',
      recallPlaceholder: 'For example: What do I like to eat?',
      recall: 'Search',
      recallOptions: 'Retrieval parameters',
      threshold: 'Similarity threshold',
      recallReady: 'Try a real question',
      recallBoundary:
        'This tests direct retrieval without generating an answer or writing a memory. An agent’s use of memory tools depends on its model and workflow configuration.',
      recallResults: '“{{query}}” · {{count}} results (up to 5)',
      recallError:
        'Retrieval failed. Check the model service or try again later.',
      noRecall: 'No matching memories recalled',
      noRecallDescription:
        'Rephrase your question or adjust the similarity threshold and try again.',
      memoryActions: 'Actions for {{name}}',
      capacity: 'Capacity limit',
      cardDescription:
        'Build context for future conversations from facts, experiences, and habits.',
      yourMemories: 'Your memories',
      listHint: 'Open a memory to inspect content or test retrieval',
      settingsDescription:
        'Control how memories are extracted, retained, and shared.',
      unsaved: 'Unsaved changes',
      saved: 'Configuration synced',
      resetChanges: 'Discard unsaved changes',
      identityTab: 'Identity & models',
      policyTab: 'Capacity & forgetting',
      extractionTab: 'Extraction',
      modelLock:
        'Memory types and the extraction model remain read-only while records exist or the record check is incomplete. The embedding model is fixed after creation.',
      policyDescription:
        'Set a capacity limit and choose a forgetting policy for capacity management.',
      capacityDescription:
        'This is a configured limit, not current usage. Both message content and embedding vectors consume capacity.',
      forgettingDescription:
        'FIFO forgets older records first; LRU prioritizes records used less recently.',
      extractionDescription:
        'Control how the model extracts memories from new conversations. These prompts and temperature apply to extraction, independently of agent conversation prompts.',
      agentFilter: 'Filter by agent',
      allAgents: 'All agents',
    },
  },
}
