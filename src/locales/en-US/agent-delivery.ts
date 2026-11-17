export const deliveryMessages = {
  version: {
    title: 'Publish Agent',
    asset: 'Asset',
    published: 'Published',
    unpublished: 'Unpublished',
    neverPublished: 'Not published yet',
    lastPublished: 'Last published: {{time}}',
    releaseNote: 'Release notes',
    releaseNotePlaceholder: 'Describe what changed in this release',
    releaseHint:
      'Publishing saves the current canvas and creates a released version. Runtimes can use it with release=true.',
    tokenMissing:
      'No beta found on the first system API Token. Publishing does not create a Token; to generate a Share link, create or refresh one in system Token management first.',
    publishing: 'Publishing...',
    publish: 'Publish',
    publishDone: 'Published successfully',
    copyShare: 'Copy Share',
    webhook: 'Webhook',
    explore: 'Explore',
    history: 'Version history',
    historyEmpty: 'No versions yet',
    noTime: 'No time info',
    releasedBadge: 'Published',
  },
  webhook: {
    title: 'Webhook test',
    url: 'Webhook URL',
    copyUrlFailed: 'Copy failed. Copy the Webhook URL manually.',
    testEndpoint: 'Test endpoint: {{url}}',
    testing: 'Testing...',
    trigger: 'Run test',
    refreshTrace: 'Refresh Trace',
    jwtWarning:
      'JWT tests require replacing the Authorization header manually. The frontend does not generate or sign JWTs.',
    tabs: {
      overview: 'Overview',
      timeline: 'Timeline',
      request: 'Request',
    },
    sections: {
      input: 'Input',
      output: 'Output',
      response: 'Response',
      request: 'Request',
      curl: 'curl',
    },
    timeline: {
      empty:
        'No trace events yet. After you run a test, events are polled from the webhook logs endpoint.',
    },
  },
}
