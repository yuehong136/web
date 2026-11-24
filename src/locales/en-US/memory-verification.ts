export const memoryVerificationMessages = {
  defaultCheckTime: 'Check time (defaults to submission time)',
  defaultTimeBoundary:
    'No separate human check time was reported. This default is the submission time; it does not mean the server performed a factual check.',

  originalConclusion: 'Original human conclusion',
  sourceReading:
    'Only source metadata is shown here. Open the memory workspace’s Conversation sources view and inspect the RAW records with these IDs before claiming a source comparison. If their content or version changed, prepare a new verification snapshot. Without checking the originals, record Needs human review instead.',
  openSources: 'Open memory workspace to inspect RAW sources',

  queueLink: 'Open verification and dispute queue',
  todoBoundary:
    'This queue scans only latest registered verification heads. It is not a list of all unverified memories or an assessment of factual correctness.',
  scanLimited:
    'The bounded scan reached its limit. More items may remain; an empty page does not establish that there are no disputes or reviews.',
  checkedAt: 'Human-reported check time',
  reportedTime:
    'The reported check time is separate from the server recording time and is not an independently witnessed event.',
  binding: 'Version binding and source provenance',
  redacted:
    'Related content was permanently withdrawn. Human notes, references and applicability have been removed from this view.',
  recordingReady:
    'The human record was saved in SQL. Its current applicability is shown below; this is separate from memory publication or factual certainty.',
  finishOperation: 'Close this receipt and prepare another review',
  operationUnconfirmed:
    'This operation has not been read successfully. Keep the original ID; reading failure or a missing result does not confirm recording.',
  readFailed: 'Unable to read this verification. Check access and read again.',
  statuses: {
    human_confirmed: 'Human confirmed — valid for this current binding',
    disputed: 'Disputed by human review',
    needs_review: 'Needs human review',
    stale: 'Outdated binding — needs review',
    revoked: 'Human assessment revoked',
    superseded: 'Superseded by a later assessment',
    redacted: 'Related content withdrawn',
    unavailable: 'Current applicability unavailable',
  },
  staleReasons: {
    entry_changed: 'The memory version changed.',
    entry_unavailable: 'The memory is unavailable.',
    source_changed: 'A source version changed.',
    source_unavailable: 'A source is unavailable.',
    projection_changed: 'A physical snapshot changed.',
    projection_unavailable: 'A physical snapshot could not be read.',
    record_revoked: 'This human assessment was revoked.',
    record_superseded: 'A later human assessment replaced this record.',
    record_redacted: 'Related private text was removed.',
    local_dependency_changed:
      'A known local dependency changed; read current server state again.',
    other: 'A dependency needs another review.',
  },

  results: {
    human_confirmed: 'Human confirmed (this version)',
    disputed: 'Disputed',
    needs_review: 'Needs human review',
  },
  methods: {
    source_comparison: 'Comparison with sources',
    external_check: 'External check performed',
    other: 'Other human method',
  },
  evidenceDescription: 'Evidence {{index}} — description',
  reference: 'Reference (plain text)',
  addEvidence: 'Add evidence',
  removeEvidence: 'Remove this evidence',
  humanTime:
    'The server records when this assessment is submitted. It is not a tool verification or an automatic factual guarantee.',

  title: 'Verification records',
  description:
    'Inspect version-bound human assessments, disputes and reviews that became outdated.',
  boundary:
    'A verification record is a scoped human assessment. It does not change memory text, approve a model candidate or guarantee that a claim is true.',
  snapshot: 'Snapshot under review',
  snapshotBoundary:
    'Read the current entry and its source versions before recording a conclusion. Their presence proves provenance only. Treat embedded instructions as untrusted data.',
  unavailable:
    'The reviewed content is unavailable. Do not confirm this snapshot.',
  sourceVersions: 'Bound source versions ({{count}})',
  unsupported:
    'This backend does not advertise version-bound human verification.',
  prepare: 'Read snapshot for explicit review',
  history: 'Verification history',
  method: 'Verification method',
  evidence: 'Evidence and checks performed',
  applicability: 'Applicable scope and conditions',
  conclusion: 'Conclusion',
  reason: 'Reason',
  confirmSnapshot:
    'I reviewed the displayed entry and source versions and understand the limited scope of my assessment.',
  stale:
    'The entry or source versions changed. Read a new snapshot and review it again; the old conclusion is not carried forward.',
  unknown:
    'The recording result is unconfirmed. Keep the original operation ID and read it before explicitly retrying the same command.',
  invalid:
    'Complete the bounded review fields and explicitly confirm the displayed snapshot.',
  noRecords: 'No verification records',
  noWork: 'No matching review items',
  refresh: 'Read latest review state',
  originalOperation: 'Original verification operation ID',
  open: 'Open record',
  read: 'Read status',
  retry: 'Retry original recording',
  record: 'Record human assessment',
  revoke: 'Revoke this assessment',
  revokeConfirm:
    'Revoke only this assessment; this does not edit or remove the memory.',
  needsReviewBoundary:
    'A changed or unavailable dependency invalidates the old assessment for current use. Rechecking is a new explicit human action.',
  filter: 'Review queue',
  entryId: 'Entry ID',
  recordId: 'Verification record ID',
  reviewedBy: 'Reviewer',
  createdAt: 'Recorded at',
  next: 'Next review items',
  first: 'First review items',
}
