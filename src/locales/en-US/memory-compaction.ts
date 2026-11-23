export const memoryCompactionMessages = {
  retention: {
    title: 'Artifact inventory and cleanup',
    boundary:
      'This quota counts registered compression artifacts. Cleanup only clears the selected artifact and its stored copies; original RAW sources, long-term memories and human reviews remain unchanged. Nothing is cleaned automatically.',
    retained_count: 'Retained artifacts',
    available_slots: 'Available slots',
    retired_count: 'Cleanup receipts',
    unsettled_count: 'Unsettled operations',
    quota:
      'Artifact limit: {{count}}. Busy or unknown writers: {{busy}}. These counts are a current snapshot.',
    full: 'The artifact quota is full. Preview an eligible completed artifact before confirming cleanup.',
    refreshInventory: 'Refresh artifact inventory',
    select: 'Open an artifact below to preview its cleanup scope.',
    preview: 'Preview artifact cleanup',
    previewFailed:
      'The cleanup scope could not be confirmed. Read a fresh preview; nothing has been cleared.',
    impact: 'Source bindings: {{count}}. Artifact slots released: {{slots}}.',
    clearsPackage:
      'The generated summary, retained copies and source bindings in this artifact will be cleared. Existing consumption references will stop supplying context.',
    noPackage:
      'No generated package remains. The preview lists this artifact’s remaining source bindings.',
    audit:
      'The original operation, identity and hash audit receipt remain. This does not certify erasure from backups.',
    confirmLabel:
      'I understand that this artifact cannot be reopened or regenerated through the original operation, and its original RAW sources will not be deleted.',
    confirm: 'Confirm artifact cleanup',
    confirming: 'Confirming cleanup for this artifact…',
    retired:
      'Artifact content has been cleared. The original operation is a read-only receipt, and old references cannot supply context or trigger another generation.',
    changed:
      'The preview is no longer current. Cleanup was not confirmed; read a fresh preview before deciding again.',
    unknown:
      'The cleanup result is not yet confirmed. Keep the original operation and read its state. Do not start a new generation to recover this request.',
    readFailed:
      'The original operation could not be read. Keep its identity and try reading again; no generation was sent.',
    recover: 'Read original cleanup receipt',
    blockers: {
      already_retired: 'This artifact has already been cleaned up.',
      not_creator: 'Only the original artifact creator may confirm cleanup.',
      memory_not_active: 'This memory bank is not active.',
      generation_unsettled:
        'Generation or its final result is not settled. Cleanup is unavailable.',
      writer_not_drained:
        'The actual provider attempt has not drained. Cleanup cannot stop it.',
      metadata_unavailable:
        'The server cannot confirm the cleanup prerequisites. Cleanup is unavailable.',
    },
  },
  copyReference: 'Copy consumption reference',
  referenceReading: 'Checking current source binding…',
  referenceCopied:
    'The four-field reference was copied. No summary or source body was copied or applied.',
  referenceUnavailable:
    'A current valid reference could not be copied. The original operation is retained; no generation was repeated.',
  referenceBoundary:
    'A reference is not application, review or fact verification. External consumers must freshly read and validate the original operation, and budget their entire request plus output reserve. Generation and repeated consumption costs are unknown here.',
  title: 'Context compression',
  newRequest: 'Explicit generation request',
  recent: 'Find an existing artifact',
  metadataOnly:
    'This list contains stored metadata only. Current source validity has not been checked; open an original operation to read its fresh state. Listing never generates a result.',
  storedState: 'Stored state',
  open: 'Open original operation',
  empty: 'No artifacts found in this bounded page.',
  refreshList: 'Refresh metadata list',
  previous: 'Previous page',
  next: 'Next page',
  requiresManaged:
    'Generation requires an active managed bank and registered active RAW sources. Inspect the selected sources and activate managed mode only through its explicit confirmation.',
  description:
    'Generate and inspect a separate, source-bound context artifact.',
  boundary:
    'Generation calls a paid model. It does not apply the artifact, replace the original sources, verify facts, or write or publish long-term memories.',
  noAutomatic:
    'Opening, refreshing and polling only read the original operation. They do not generate again, apply a result or publish memories.',
  unsupported: 'This backend does not support explicit context compression.',
  sources: 'Ordered root RAW source IDs',
  orderBoundary:
    'Choose up to {{count}} root RAW sources from this bank, in conversational order. IDs are never sorted automatically. Legacy RAW is treated as an indivisible block; missing tool-pair boundaries are not inferred.',
  invalidSources:
    'Enter 1–{{count}} unique positive int64 decimal source IDs in the intended order, without rounding.',
  generate: 'Generate compression (model cost)',
  inspect: 'Inspect / register selected sources',
  prefix: 'Number of leading sources to compress',
  prefixBoundary:
    'Compress these leading whole sources. The remaining suffix is retained verbatim. Tool declarations in the compressed prefix are rejected when safe pair boundaries cannot be established.',
  inputBudget: 'Analysis input token budget',
  outputBudget: 'Model output token limit',
  packageBudget: 'Complete package token budget',
  invalidRequest:
    'Check ordered source IDs, the prefix count and the whole-token budgets. No request was sent.',
  artifact: 'Independent context artifact',
  snapshot:
    'This is a version-bound snapshot, not an applied conversation or a confirmed fact. Re-read the operation before relying on its current validity.',
  operation: 'Original compression operation',
  recoveryLabel: 'Context artifact operation — not applied',
  recoveryBoundary:
    'This operation generates a separate context artifact. Index readiness is not publication or application. Use the compression workspace for its current source-bound artifact; generic writer reconciliation is unavailable.',
  refresh: 'Read current status',
  unknown:
    'Generation is unconfirmed. Keep the original operation ID and read its status; do not generate under a replacement ID.',
  stale:
    'The selected source versions changed or could not be reconfirmed. The previous preview has been cleared. Review the sources before explicitly starting a new request.',
  generated: 'Generated — not applied',
  canceled: 'Canceled — no application',
  failed: 'Generation failed',
  running: 'Generation is in progress',
  retained: 'Retained original blocks',
  lineage: 'Source lineage',
  budget: 'Estimated complete package budget',
  savings: 'Estimated token difference',
  estimateBoundary:
    'Estimates compare the same complete package JSON, including retained blocks and source lineage. Management receipts, HTTP envelopes and caller-added prompts are excluded and need their own budget. A smaller artifact does not establish response quality or actual monetary savings.',
  artifactId: 'Artifact ID',
  manifest: 'Source snapshot binding',
  model: 'Generation model',
  modelConfig: 'Model configuration fingerprint',
  before: 'Uncompressed input estimate',
  after: 'Complete artifact estimate / budget',
  notMeasured: 'Unknown',
  billingUnknown:
    'Provider token usage and billing have not been verified by this receipt. Unknown cost is not zero cost.',
  summary: 'Generated summary (untrusted data)',
  noSummary: 'No summary body is available.',
  sourceBoundary:
    'Order and source versions are preserved. Role labels are declarations, not proof of speaker identity, tool execution or factual accuracy.',
  exactEmpty: 'Empty string (exact value)',
  readSource: 'Read the bound original source',
  draining:
    'An actual provider attempt is still draining. Cancellation or a stored result does not establish that external IO has finished.',
  operatorRequired:
    'The operation requires operator reconciliation. Keep this handle; do not create a replacement generation request.',
  cancelUnknown:
    'Cancellation is unconfirmed. Read this same operation; do not assume the provider stopped or the artifact was applied.',
  readFailed:
    'Current status could not be confirmed. The old body has been cleared. Keep the original handle and read again; no generation request is repeated.',
  cancel: 'Cancel this generation',
  startNew: 'Prepare a new explicit request',
  states: {
    running: 'Generation in progress — not applied',
    generated: 'Generated — not applied',
    failed: 'Generation failed — not applied',
    stale: 'Source snapshot unavailable or changed — preview cleared',
    canceled: 'Canceled — not applied',
    persistence_unknown: 'Outcome unconfirmed — keep the original operation',
  },
}
