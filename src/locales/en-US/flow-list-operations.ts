export const listOperationsMessages = {
  ListOperationsOptions: {
    nth: 'Nth item',
    head: 'First N items',
    tail: 'Last N items',
    sort: 'Sort',
    filter: 'Filter',
    dropDuplicates: 'Drop duplicates',
  },
  ListOperationsLegacyOptions: {
    topN: 'First N items (legacy)',
    head: 'Nth item from the start (legacy)',
    tail: 'Nth item from the end (legacy)',
  },
  strictMode: 'Strict mode',
  strictModeTip:
    'Reject out-of-range N. Nth requires a nonzero index within the list; first/last N requires 1 to the list length.',
  listOperationsConfig: {
    count: 'N',
    integerRequired: 'Enter a safe integer.',
    invalidVersion:
      'This list operation configuration has an invalid version. Check the imported DSL.',
    legacyTip:
      'This node keeps its original list behavior. The legacy head and tail operations return a single item.',
    legacyCountTip:
      'Nonpositive N returns an empty list. Legacy head/tail also return an empty list beyond the list length; Top N returns all items when N is larger.',
    nthTip:
      'Positive N counts from 1; negative N counts from the end. With strict mode off, zero or an out-of-range index returns an empty list.',
    sliceTip:
      'Keep the original order. With strict mode off, nonpositive N returns an empty list and N beyond the list length returns all items.',
  },
}
