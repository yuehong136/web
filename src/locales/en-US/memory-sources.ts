export const memorySourceMessages = {
  jobSources: 'Inspect submission receipts for these job sources',
  attributionBoundary:
    'Authentication identifies the submitter only. Client roles, timestamps and source content are not independently verified.',
  segmentCount: 'Declared segments: {{count}}',
  format: 'Source format',
  structured: 'Structured submission',
  legacy: 'Legacy combined record',
  submitter: 'Submission identity',
  authenticatedSubmission: 'Authenticated submitter',
  submitterUnknown: 'Submitter not recorded',
  receivedAt: 'Server receipt time',
  eventTime: 'Event time declaration',
  callerDeclared: 'Declared by the client',
  unknown: 'Unknown',
  referenceTime: 'Reference time for later analysis',
  humanBoundary:
    'Human verification is a separate judgment about a current entry and its source versions. Submission authentication does not create that judgment.',
  rolesDeclared:
    'Roles below are client declarations. A tool label does not prove that a tool ran or validated the content.',
  segment: 'Segment {{count}}',
  roles: {
    user: 'User (client declared)',
    assistant: 'Assistant (client declared)',
    tool: 'Tool (client declared)',
    unknown: 'Unknown role',
  },
  legacyBoundary:
    'This legacy record has no structured role receipt. Labels in its body are not parsed into trusted speakers.',
  inspect: 'Read source submission',
  idle: 'Read only when requested. This does not run a model, create a verification, or publish a memory.',
  changed:
    'The source is unavailable or no longer matches this version. Refresh its state and inspect again.',
  failed:
    'Source submission could not be read. Retry explicitly after refreshing.',
  digest: 'Submission receipt digest',
  close: 'Clear source submission',
}
