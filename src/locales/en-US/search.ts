export default {
  searchPage: {
    title: 'Search apps',
    description:
      'Build dedicated search apps with retrieval and AI summaries on selected knowledge bases.',
    create: 'Create search app',
    stats: {
      total: 'Total search apps',
      summary: 'AI summary enabled',
      related: 'Related questions enabled',
      knowledgeBases: 'Linked knowledge bases',
    },
    filters: {
      summary: 'AI summary',
      related: 'Related questions',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    toolbar: {
      searchPlaceholder: 'Search app name...',
      sortUpdated: 'Updated time',
      sortCreated: 'Created time',
      sortName: 'Name',
      detailedTime: 'Detailed time',
      compactTime: 'Compact time',
      relativeTime: 'Relative time',
      descending: 'Desc',
      ascending: 'Asc',
      gridView: 'Grid view',
      listView: 'List view',
    },
    card: {
      summaryOn: 'Summary on',
      summaryOff: 'Summary off',
      relatedOn: 'Related on',
      relatedOff: 'Related off',
      knowledgeBases: '{{count}} KBs',
      settings: 'Settings',
      delete: 'Delete',
    },
    empty: {
      searchTitle: 'No matching search apps',
      listTitle: 'No search apps yet',
      searchDescription: 'Adjust your search or filters and try again.',
      listDescription:
        'Create a search app to configure knowledge bases and retrieval parameters for document search and AI summaries.',
    },
    pagination: {
      total: '{{count}} items',
      previous: 'Previous',
      next: 'Next',
    },
    notifications: {
      deleteSuccessTitle: 'Deleted',
      deleteSuccessMessage: 'Search app deleted',
      deleteFailedTitle: 'Delete failed',
      deleteFailedMessage: 'An error occurred while deleting the search app',
    },
    deleteDialog: {
      title: 'Delete search app',
      description:
        'This will permanently delete "{{name}}". This cannot be undone.',
    },
  },
}
