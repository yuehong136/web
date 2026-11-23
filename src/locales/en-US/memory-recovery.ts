export const memoryRecoveryMessages = {
  title: 'Operations & recovery',
  bankIdentifier: 'Memory {{id}}',
  readOnlyBoundary:
    'This page reads durable server records. Refreshing, reopening and polling do not start analysis, publish candidates or reconcile an operation. Recovery commands require an explicit action.',
  inbox: 'Server operation inbox',
  pendingView: 'Pending',
  allView: 'All operations',
  pendingFound:
    'This memory has operations waiting for completion or reconciliation.',
  openPending: 'View pending operations',
  openMemory: 'Open memory workspace',
  openJob: 'Open job and candidates',
  empty: 'No operations in this view',
  emptyDescription:
    'Read a known operation ID, switch to all operations, or refresh the server list.',
  discoveryFailed:
    'The operation list is unavailable. Retry or read a known original operation ID.',
  knownOperation: 'Read an original operation',
  previous: 'Previous page',
  next: 'Next page',
  pending: 'Pending or unconfirmed',
  ready: 'Operation ready',
  unknown:
    'The result is unconfirmed. Read the original operation and keep its ID; do not submit a replacement.',
  operatorNeeded: 'Operator reconciliation required',
  operatorRequired:
    'An earlier attempt may still have live requests. An operator must independently confirm they have settled before recovery can proceed.',
  analysisPending:
    'Analysis has not completed. Any candidates remain separate from active memory.',
  submitAnalysis: 'Submit background analysis',
  openAnalysisOperation: 'Open analysis operation',
  backgroundBoundary:
    'The submission is durable. Closing this page sends no cancellation. This page only reads progress; approval and publication remain explicit.',
  executionAttempt: 'Execution attempt: {{count}}',
  memoryStates: {
    deleting:
      'Normal supply has stopped while writers drain and tracked cleanup settles. Keep the original deletion operation.',
    deleted:
      'This memory has been deleted. Only minimal deletion audit remains available; backup and client copies are not certified erased.',
  },
  executionStates: {
    queued: 'Queued for analysis',
    claimed: 'Claimed, waiting to start',
    running: 'Analysis running',
    succeeded: 'Analysis complete; review candidates',
    failed: 'Analysis attempt failed',
    canceled: 'Execution canceled',
    needs_reconciliation: 'Execution needs reconciliation',
  },
  executionHints: {
    queued: 'Waiting for a worker to claim this explicit submission.',
    claimed:
      'The submission is claimed; model work has not yet been confirmed running.',
    running:
      'Requests may still be in flight. A stale heartbeat does not prove that they have ended.',
    succeeded:
      'Any generated candidates remain unverified and require review and explicit publication.',
    failed:
      'Read the original operation for the recovery actions currently permitted.',
    canceled:
      'Job cancellation does not certify that separate publication stages have been cleaned.',
    needs_reconciliation:
      'Keep the original operation ID and obtain independent confirmation that old requests have settled.',
  },
}
