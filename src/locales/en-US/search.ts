import { searchSettingsResource } from './search-settings'
import { searchWorkspaceResource } from './search-workspace'

export default {
  searchPage: {
    ...searchWorkspaceResource,
    ...searchSettingsResource,
    feedback: {
      knowledgeRequired: 'Select at least one knowledge base.',
      nameRequired: 'Enter a search app name.',
      createTitle: 'Created',
      createSuccess: 'Search app created.',
      createFailedTitle: 'Create failed',
      createFailed: 'Could not create the search app. Try again.',
      saveTitle: 'Saved',
      saveSuccess: 'Search configuration updated.',
      saveFailedTitle: 'Save failed',
      saveFailed: 'Could not update the search configuration. Try again.',
    },
    title: 'Search apps',
    create: 'Create search app',
    results: 'Search apps: {{count}}',
    loading: 'Loading search apps',
    loadFailedTitle: 'Could not load search apps',
    loadFailedDescription: 'Try loading the list again. Your filters are kept.',
    pageFeatures:
      'This page: AI summary on {{summary}} · related questions on {{related}}',
    columns: {
      knowledge: 'Knowledge',
    },
    filters: {
      summary: 'AI summary',
      related: 'Related questions',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    toolbar: {
      searchPlaceholder: 'Search app name...',
      order: 'Order',
      timeFormat: 'Time display',
      sortUpdated: 'Updated time',
      sortCreated: 'Created time',
      sortName: 'Name',
      detailedTime: 'Detailed time',
      compactTime: 'Compact time',
      relativeTime: 'Relative time',
      descending: 'Desc',
      ascending: 'Asc',
    },
    card: {
      summaryOn: 'Summary on',
      summaryOff: 'Summary off',
      relatedOn: 'Related on',
      relatedOff: 'Related off',
      knowledgeBases_one: '{{count}} knowledge base',
      knowledgeBases_other: '{{count}} knowledge bases',
      noKnowledge: 'No knowledge base',
      actionsFor: 'Actions for {{name}}',
      settings: 'Settings',
      delete: 'Delete',
    },
    empty: {
      reset: 'Clear search and filters',
      searchTitle: 'No matching search apps',
      listTitle: 'No search apps yet',
      searchDescription: 'Adjust your search or filters and try again.',
      listDescription:
        'Create a search app to configure knowledge bases and retrieval parameters for document search and AI summaries.',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
    },
    notifications: {
      deleteSuccessTitle: 'Deleted',
      deleteSuccessMessage: 'Search app deleted',
      deleteFailedTitle: 'Delete failed',
      deleteFailedMessage: 'An error occurred while deleting the search app',
    },
    export: {
      action: 'Export current session',
      streamingDisabled: 'Export is available after the search finishes',
      success: 'Current session exported',
      failed: 'Export failed. Try again.',
      document: {
        exportedAt: 'Exported at: {{date}}',
        round: 'Round {{index}}',
        question: 'Question',
        answer: 'Answer',
        relatedQuestions: 'Related questions',
        noSummary: 'No AI summary is available for this round.',
      },
    },
    deleteDialog: {
      title: 'Delete search app',
      description:
        'This will permanently delete "{{name}}". This cannot be undone.',
    },
  },
}
