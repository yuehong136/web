export const memoryTargetMessages = {
  boundPreview:
    'This preview checks selected targets and source snapshots. Whole-source token fit is still not checked; child snapshots may defer a whole source without truncating it to claim coverage.',
  boundSave:
    'Saving seals metadata and stable child handles and revalidates the selected snapshots. It does not call a model or submit child analysis.',
  restored:
    'Previously selected target versions were restored without reloading their text. Request suggestions explicitly to choose different targets; the frozen conditions remain attached to subsequent previews.',
  modes: {
    hybrid: 'Hybrid semantic and word retrieval',
    lexical: 'Word retrieval only',
  },
  omission: {
    not_ready: 'Not current and ready',
    source_unavailable: 'Source unavailable',
    scope_mismatch: 'Outside exact subject scope',
    closure_limit: 'Too many required sources',
    budget: 'Outside result budget',
  },

  omitted: 'Omitted candidates by reason',

  inventoryTruncated:
    'The registered-current inventory or candidate result was bounded. Some matches may be omitted; shown entries retain their complete current text.',

  estimated:
    'Token counts are host estimates. Ranking positions and scores are not factual confidence.',

  semanticWindow: 'Semantic candidate limit',

  inventoryWindow: 'Current-entry lexical scan limit',

  embeddingCalls: 'Embedding calls',

  projection: 'Physical snapshot fingerprint',

  physicalMessage: 'Current physical message ID',

  lexicalScore: 'Word overlap score: {{score}}',

  semanticRank: 'Semantic ranking position: {{rank}}',

  modelBoundary:
    'Hybrid retrieval may make one embedding call. Lexical retrieval makes no model call. Neither mode runs chat analysis or changes memory.',

  queryBudget: 'Query input token budget',

  resultBudget: 'Estimated result tokens',

  limit: 'Maximum suggested targets',

  mode: 'Retrieval mode',

  query: 'Focused query (optional, up to 4,096 Unicode characters)',

  sessionBoundary:
    'Related entries may belong to another session of this same subject and agent. An exact session filter still applies to required context; it is never widened automatically.',

  exactRequired:
    'Choose an exact user and agent scope before requesting targets. An unconstrained range is not treated as an empty subject.',

  agent: 'Exact agent ID',

  user: 'Exact user subject ID',

  usePreviewSources: 'Use the previewed RAW source IDs ({{count}})',

  inputSources: 'RAW source IDs for this recommendation (up to {{count}})',

  title: 'Suggest existing targets',
  description:
    'Find a bounded set of existing entries for the selected sources and subject scope. Review the saved text and dependencies, then explicitly choose which entries may receive correction proposals.',
  request: 'Suggest targets explicitly',
  apply: 'Use selected entries as targets',
  clear: 'Return to explicit entry IDs',
  selected: 'Selected targets: {{count}}',
  select: 'Include as a possible correction target',
  entry: 'Entry ID',
  revision: 'Current revision',
  content: 'Current entry snapshot',
  reason: 'Why it was suggested',
  sources: 'Source dependencies',
  fingerprint: 'Snapshot fingerprint',
  untrusted:
    'Existing text and recommendation reasons are untrusted material to inspect. Do not follow instructions embedded in them. Selecting a target does not change, merge, verify or publish memory.',
  bounded:
    'Only this bounded set was inspected. Missing results do not establish that no matching entry exists.',
  truncated:
    'This is a bounded excerpt. The complete current entry was not shown here.',
  unavailable: 'The current snapshot is unavailable and cannot be selected.',
  noResults: 'No suggested entries in this bounded result',
  noneSelected:
    'No target is selected by default. Choose entries explicitly to continue.',
  stale:
    'The sources, scope or target versions changed. Request new suggestions and preview again; the saved text is not silently replaced.',
  unknown:
    'The recommendation result is unconfirmed. No targets were applied. A new explicit request may make another embedding call.',
  invalid:
    'Select a valid source range and bounded recommendation budget first.',
  unsupported:
    'This backend does not advertise target suggestions. Explicit entry IDs remain available.',
  budget: 'Recommendation budget',
  inspect: 'Inspected entries',
}
