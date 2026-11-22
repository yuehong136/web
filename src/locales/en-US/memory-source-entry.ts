export const memorySourceEntryMessages = {
  title: 'Record a structured source',
  resume: 'Resume source submission',
  description:
    'Save declared segments as RAW data, then inspect the recorded source.',
  boundary:
    'Roles and event time are client declarations. Saving does not run extraction, approve candidates, verify facts or publish memory.',
  subject:
    'The server assigns the user subject from your authenticated session. This form cannot change the authenticated submitter.',
  agent: 'Exact agent ID',
  session: 'Exact session ID',
  exactScope:
    'Empty values are exact empty values. Spaces are preserved; they do not select all agents or sessions.',
  eventTime: 'Event time declaration',
  unknownTime: 'Unknown event time',
  declaredTime: 'Declare a timestamp with timezone',
  timestamp: 'RFC3339 timestamp with timezone',
  timestampExample: '2026-11-16T14:30:00+08:00',
  segment: 'Segment {{count}}',
  role: 'Declared role',
  content: 'Source content',
  remove: 'Remove segment {{count}}',
  add: 'Add a segment',
  limits:
    'Up to {{count}} segments; the server checks the complete JSON against {{bytes}} UTF-8 bytes and {{tokens}} estimated tokens.',
  invalid:
    'Check segment content, scope length and the timestamp with an explicit timezone.',
  submit: 'Record source only',
  recovery:
    'Only this operation ID is kept in the URL. Draft text is never stored there or in browser storage. Pending or unknown results must be checked using this operation; refreshing does not submit again.',
  recorded:
    'The RAW source is recorded. No automatic extraction task was started; review the source before explicitly preparing candidates.',
  prepare: 'Open explicit maintenance',
  new: 'Start a new submission',
  operations: 'Open this operation in recovery',
  closeDraft:
    'Closing discards unsubmitted text. A submitted operation remains recoverable from its URL.',
}
