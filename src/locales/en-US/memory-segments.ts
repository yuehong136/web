export const memorySegmentMessages = {
  previewCoverageHint:
    'Coverage at this explicit preview. Planned fragment counts and child-job progress use separate units.',
  liveCoverageHint:
    'Current effective coverage for this saved plan, read from the server. The selection counts above remain frozen.',
  totalParts: 'Required primary fragments',
  analyzedParts: 'Effectively analyzed fragments',
  snapshotInputs:
    'Snapshot inputs: {{selected}} selected, {{included}} included, {{analyzed}} analyzed, {{deferred}} deferred.',

  enable: 'Split long sources into fragments',
  selectionHint:
    'Analyze bounded fragments in separate child jobs. A source version is analyzed only after every required fragment finishes and actual work settles. Candidate review and publication remain explicit.',
  unavailable:
    'This backend does not advertise fragmented analysis. Select whole-source mode to continue.',
  wholeMode: 'Whole sources',
  segmentedMode: 'Source fragments',
  mode: 'Analysis units',
  fragmentBudget: 'Target token limit per fragment',
  maxParts: 'Maximum fragments per source',
  fragmentBudgetHint:
    'The server also checks the full child input, including surrounding text, context and instructions.',
  previewBoundary:
    'This preview reads source bodies to plan and check fragments. It creates no analysis job and makes no model call. Child snapshots recheck source versions and budgets before execution.',
  createBoundary:
    'Saving binds the reviewed fragment plan and stable child handles. It may reread sources to confirm versions; it does not submit analysis or call a model.',
  fragment: 'Fragment {{number}} of {{total}}',
  core: 'Primary character range',
  read: 'Read range with surrounding context',
  range: '[{{start}}, {{end}})',
  offsetHint:
    'Ranges use Unicode codepoints in the original source. Adjacent read context may overlap; only primary ranges count toward source coverage.',
  provenance: 'Fragment provenance',
  identity: 'Fragment fingerprint',
  wholeHash: 'Whole source hash',
  coreHash: 'Primary range hash',
  readHash: 'Read range hash',
  splitter: 'Splitter version',
  reviewBoundary:
    'A fragment can miss relationships with other fragments. Analysis coverage does not establish factual accuracy, complete cross-source synthesis or publication.',
  sourceBoundary:
    'A changed or withdrawn source invalidates its prior fragment coverage. Repeated context is not new primary coverage.',
  selectedFragments: 'Planned primary fragments',
  sourceCoverage: 'Source-version analysis coverage',
  sourcesSelected: 'Selected source versions',
  sourcesCovered: 'Fully analyzed source versions',
  sourcesPartial: 'Partially analyzed source versions',
  sourcesBlocked: 'Blocked source versions',
  partialHint:
    'Some fragments were analyzed. The whole source version is not yet counted as analyzed.',
  blockedSources: 'Sources deferred by planning',
  reason: 'Deferral reason',
  reasons: {
    segment_parts_limit:
      'The source needs more fragments than the selected limit.',
    segment_plan_limit:
      'The bounded plan cannot include all required fragments.',
    segment_source_size_limit:
      'The source exceeds the supported planning size.',
    segment_context_budget:
      'Required surrounding or entry context exceeds the input budget.',
    segment_no_fragment_fits:
      'No complete fragment fits the selected input budget.',
    input_budget: 'The complete input exceeds the child token budget.',
    unknown:
      'This input was deferred. Read the original job for its current state.',
  },
}
