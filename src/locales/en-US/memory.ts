export default {
  memory: {
    page: {
      title: 'Memory banks',
      description: 'Manage AI memory so conversations become more contextual.',
      create: 'Create memory bank',
    },
    stats: {
      totalMemories: 'Memory banks',
      totalMessages: 'Messages',
      totalStorage: 'Storage',
      activeMemories: 'Active',
    },
    filters: {
      memoryType: 'Memory type',
      raw: 'Raw',
      semantic: 'Semantic',
      episodic: 'Episodic',
      procedural: 'Procedural',
      searchPlaceholder: 'Search memory banks...',
    },
    fields: {
      name: 'Name',
      storageType: 'Storage type',
      permission: 'Permission',
      createdAt: 'Created',
      updatedAt: 'Updated',
      graph: 'Graph',
      table: 'Table',
      onlyMe: 'Only me',
      team: 'Team',
    },
    empty: {
      listTitle: 'No memory banks yet',
      listDescription:
        'Create your first memory bank so AI can remember conversations.',
      searchTitle: 'No matching memory banks',
      searchDescription: 'Adjust your search or filters.',
      messagesTitle: 'No messages',
      messagesDescription:
        'When agents use this memory bank, conversation content will be recorded here.',
    },
    toolbar: {
      detailedTime: 'Detailed time',
      compactTime: 'Compact time',
      relativeTime: 'Relative time',
      descending: 'Desc',
      ascending: 'Asc',
      gridView: 'Grid view',
      listView: 'List view',
    },
    pagination: {
      total: '{{count}} items',
      previous: 'Previous',
      next: 'Next',
    },
    deleteDialog: {
      title: 'Delete memory bank',
      description:
        'After deletion, all messages in this memory bank will be removed and agents will no longer retrieve them.',
    },
  },
}
