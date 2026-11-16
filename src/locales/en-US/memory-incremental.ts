export const memoryIncrementalMessages = {
  title: 'Incremental batches',
  description:
    'Preview eligible source versions, submit a bounded batch, and track analysis across jobs.',
  boundary:
    'Coverage means source versions were analyzed. It does not establish factual accuracy, publication, or complete relationships across sources. Review and publication remain explicit.',
  manualJobs: 'Review jobs and candidates',
  unsupported:
    'This backend does not advertise incremental maintenance. Existing job review remains available.',
  managedRequired:
    'Incremental maintenance requires a managed memory bank. Use the existing workspace to explicitly register or adopt sources first; this page never activates managed mode.',
  selection: 'Select a bounded source range',
  scope: 'Source scope',
  scopeFields: {
    user: 'User subject ID',
    agent: 'Agent ID',
    session: 'Session ID',
  },
  allValues: 'All values',
  exactValue: 'Exact value',
  emptyExact: 'Empty exact value',
  exactScopeHint:
    'Exact matching preserves spaces. An empty exact value matches an empty value; it does not mean all values.',
  contextEntries: 'Explicit context entry IDs',
  contextHint:
    'Optional: up to 32 current entry IDs. Only their required sources are added as context. An empty list never loads the whole bank.',
  batchSize: 'Source slots per child',
  maxSources: 'Primary version limit',
  inputBudget: 'Input token budget per child',
  outputBudget: 'Output token budget per child',
  invalidNumber: 'Enter an integer from {{min}} to {{max}}.',
  preview: 'Preview sources and coverage',
  previewResult: 'Source preview and current coverage',
  registeredOnly:
    'Counts cover registered, active source versions in this exact scope, not every physical RAW record.',
  currentCounts: 'Current version coverage for these settings',
  snapshotCounts: 'Counts when this plan was selected',
  previewSavedProfile: 'Read current coverage with this plan’s settings',
  snapshotHint:
    'These are saved selection counts. Preview the current range again to read effective coverage after jobs settle.',
  counts: {
    active: 'Active versions',
    covered: 'Analyzed versions',
    inflight: 'In flight',
    blocked: 'Deferred / blocked',
    eligible: 'Eligible versions',
    selected_primary: 'Selected primary versions',
    context: 'Context versions',
  },
  tokenFit:
    'This preview plans versions without reading their bodies or checking token fit. Child snapshots may defer a whole source; content is never truncated or summarized to claim coverage.',
  hasMore:
    'Additional eligible primary versions remain beyond this plan’s limit. Read a new preview explicitly when you are ready for another plan.',
  profile: 'Coverage settings and provenance',
  profileHint:
    'Coverage is bound to the scope, policy, budgets, analyst strategy, model/configuration and explicit context versions. A changed profile can make the same source version eligible again. Batch size and the primary limit only bound this plan.',
  profileIdentity: 'Coverage profile fingerprint',
  model: 'Analysis model',
  strategy: 'Analyst strategy fingerprint',
  config: 'Model configuration fingerprint',
  sourcePlan: 'Planned child source groups ({{count}})',
  childOrdinal: 'Child {{ordinal}}',
  primary_sources: 'Primary versions',
  context_sources: 'Explicit context versions',
  none: 'None',
  noEligible: 'No eligible primary versions selected',
  noEligibleHint:
    'Check analyzed, in-flight and blocked counts, or change the explicit range and budgets. This is not a claim that every physical source has been analyzed.',
  createPlan: 'Save batch plan',
  createBoundary:
    'Saving records metadata and stable child handles. It does not read source bodies, call a model or submit child analysis.',
  creationUnknown:
    'The plan creation result is not yet confirmed. Keep this original request ID and find it on the server; do not create a replacement request.',
  knownRequest: 'Original creation request ID',
  knownBatch: 'Batch plan ID',
  findRequest: 'Find original request',
  repreview: 'Adjust and preview again',
  conflict:
    'The selection, profile or operation conflicts with current state. Read the original record, then preview again where appropriate; do not replace an unconfirmed operation.',
  invalidSelection:
    'This range, context or budget cannot be planned as requested. Adjust the selection and preview again.',
  unknown:
    'Completion is unconfirmed. Keep the original handles and read current state before explicitly retrying the same request.',
  readFailed: 'Unable to read the plan. Check access or retry this read.',
  recentPlans: 'Server batch plans',
  restoreHint:
    'Recent plans are read from the server. Reopening or polling does not submit analysis. Older plans can be opened by ID.',
  noPlans: 'No batch plans found',
  planDetail: 'Selected plan and child jobs',
  planState: 'Orchestration state',
  progressBoundary:
    'These are child-job counts, separate from source-version coverage. Queued or analyzed work does not mean candidates were approved or published. Valid empty output can still complete analysis.',
  progress: {
    planned: 'Planned children',
    created: 'Created children',
    submitted: 'Submitted children',
    running: 'Running children',
    analyzed: 'Analyzed children',
    failed: 'Failed children',
    canceled: 'Canceled children',
    blocked: 'Blocked children',
    pending: 'Pending children',
  },
  runLimit: 'Children per explicit submission',
  submitChildren: 'Submit bounded child jobs',
  retryOriginalRun: 'Retry original submission',
  runBoundary:
    'Only this button advances a bounded part of the saved plan. Refresh and polling only read. Existing children keep their fixed job and analysis IDs.',
  runAccepted:
    'The server returned this bounded submission. Inspect each child for queued, unknown, failed or analyzed state; this is not publication.',
  runRecovery:
    'The original submission ID is preserved. Reads do not replay it. An explicit retry uses the same ID and child limit.',
  cancelPlan: 'Cancel unfinished plan and candidates',
  retryCancel: 'Retry original cancellation',
  cancelBoundary:
    'Cancellation must be confirmed by the server and may await actual work draining. Published memory is not undone; publication-stage cleanup is tracked by its original operation.',
  openChild: 'Review original job',
  jobNotCreated:
    'The fixed job ID is reserved; the job has not yet been confirmed created.',
  errorCode: 'Reason code',
  childNotCovered:
    'This child is not confirmed analyzed. Deferred, failed, stale or unknown work must not be counted as completed source coverage.',
  originalHandles: 'Original child handles',
  createHandle: 'Child creation operation',
  discoveryStates: {
    planned: 'Plan saved',
    partial: 'Partly submitted',
    submitted: 'Children submitted',
    running: 'Analysis running',
    settled: 'Execution settled; inspect outcomes',
    canceled: 'Plan canceled',
    stale: 'Plan no longer current',
  },
  batchStates: {
    planned: 'Planned',
    created: 'Job created',
    submitted: 'Analysis submitted',
    running: 'Running',
    analyzed: 'Analysis confirmed',
    failed: 'Failed',
    canceled: 'Canceled',
    blocked: 'Deferred / blocked',
    stale: 'Stale',
    unknown: 'Unconfirmed',
  },
}
