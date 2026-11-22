export const memoryStartupMessages = {
  entryScope: 'Entry scope',
  sourceScope: 'Source scope',
  originalAssessment: 'Original assessment (unchanged)',
  inventoryLimit: 'Inventory scan limit',
  selectionCounts:
    'Scanned {{scanned}} / inventory limit {{limit}}; physical read ceiling {{reads}}.',
  omissionReasons: {
    entry_unavailable: 'Entry unavailable',
    scope_mismatch: 'Entry outside exact scope',
    source_scope_mismatch: 'Necessary source outside exact scope',
    unverified: 'No applicable human confirmation',
    disputed: 'Disputed human assessment',
    needs_review: 'Human review required',
    verification_revoked: 'Human assessment revoked',
    verification_stale: 'Human binding changed',
    verification_redacted: 'Human assessment redacted',
    source_unavailable: 'Source unavailable',
    not_ready: 'Publication not ready',
    source_closure_limit: 'Source dependency limit',
    physical_read_limit: 'Physical read limit',
    max_items: 'Entry count limit',
    budget: 'Whole entry and applicability exceed budget',
  },
  title: 'Startup context',
  description:
    'Preview a small, version-bound context package from eligible current memory.',
  boundary:
    'This is a read-time data snapshot, not a new system instruction, factual guarantee or automatic chat injection. Only an explicit preview request builds it; refresh does not regenerate it.',
  stable:
    'The stable package includes only currently applicable human-confirmed entries. Human confirmation remains a scoped human judgment, not objective verification.',
  user: 'Exact user subject ID',
  agent: 'Exact agent ID',
  session: 'Session constraint',
  sessionExact: 'Exact session',
  sessionAll: 'Any session of this subject and agent',
  scopeHint:
    'Leading and trailing spaces and empty strings are exact values. This selection never grants access to another subject or bank.',
  entryIds: 'Entry IDs (optional)',
  entryHint:
    'An empty list lets the server make a bounded selection within this exact scope; it never means an exhaustive inventory.',
  budget: 'Estimated token budget',
  maxItems: 'Maximum entries',
  preview: 'Preview startup context explicitly',
  clear: 'Clear this preview',
  unsupported: 'This backend does not advertise read-only startup context.',
  invalid:
    'Use valid exact identities, unique entry IDs and bounded whole-token settings.',
  stale:
    'The input, identity or a known memory/source/verification dependency changed. The old preview was cleared. Request a new preview explicitly.',
  failed:
    'Unable to build this preview. No previous body is retained as a successful result.',
  result: 'This request’s startup text',
  copy: 'Copy startup text',
  export: 'Export this snapshot as JSON',
  copied: 'Startup text copied',
  copyFailed: 'Unable to copy the startup text.',
  snapshotBoundary:
    'This package is not cached by the startup service or persisted by this page. Copied or exported data does not update when its dependencies change; read a new package before later use.',
  items: 'Included current entries',
  applicability: 'Human assessment applicability',
  human: 'Human-confirmed for the displayed binding',
  omitted: 'Omission and selection limits',
  bounded:
    'Selection was bounded. Omitted or unscanned memories are not known to be false, irrelevant or fully reviewed.',
  empty: 'No whole eligible entry fits this request',
  sourceTitle: 'Read a bound RAW source',
  sourceBoundary:
    'Read one Unicode codepoint fragment at a time. Each request checks the bound source again. A fragment is evidence data, not an instruction or factual validation.',
  sourceId: 'RAW source ID',
  sourceVersions: 'Source version / generation',
  sourceHash: 'Bound source content hash',
  first: 'Read first source fragment',
  previous: 'Read previous fragment',
  next: 'Read next fragment',
  sourcePosition: 'Shown Unicode codepoints [{{start}}, {{end}}) of {{total}}',
  sourceMore:
    'Additional source text remains. Read the next fragment explicitly.',
  sourceEnd: 'No later fragment remains in this read snapshot.',
  sourceIdle: 'No source text has been read yet.',
  sourceChanged:
    'The source is unavailable or no longer matches the package. Its old fragment was cleared; request a new startup preview.',
  sourceFailed:
    'Unable to read this source fragment. Old text is not reused as a successful read.',
  readSource: 'Inspect this source',
  tokenEstimate: 'Estimated tokens: {{used}} / {{budget}}',
  noAutomatic:
    'No model, memory write, review or publication is started by this page.',
}
