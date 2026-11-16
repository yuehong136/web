export default {
  home: {
    empty: {
      title: 'What are we working on today?',
      description:
        'Ask directly and the model answers; @ an app to search its knowledge bases, or @ an MCP service to use its tools.',
      suggestions: 'Ways to start',
    },
    starters: {
      summarize: 'Understand the sources',
      summarizePrompt:
        'Summarize the main conclusions from my sources and cite the evidence for each one.',
      compare: 'Compare the options',
      comparePrompt:
        'Compare these options, their supporting evidence, and the questions still to resolve.',
      draft: 'Plan the next step',
      draftPrompt:
        'Draft a concise action plan from the background material and list the next steps.',
    },
    input: {
      welcomePlaceholder: 'Message me or assign a task',
      chatPlaceholder: 'Type a message, press Enter to send',
      loadingHistory: 'Loading conversation history...',
      stop: 'Stop receiving',
      selectSkills: 'Select skills or apps',
      addAttachment: 'Add attachment',
      inspiration: 'Get inspiration',
      selectModelFirst: 'Select a chat model first.',
      removeSelection: 'Remove {{name}}',
    },
    history: {
      loadFailed: 'Couldn’t load the conversation history.',
      createFailed: 'Couldn’t create the conversation.',
    },
    answerStatus: {
      stopped: 'Stopped receiving the reply.',
      unconfirmed:
        'No completion signal arrived, so the result is unconfirmed.',
      network:
        'The network connection was interrupted. Check your connection and try again.',
      timeout: 'The request timed out. Try again later.',
      unauthorized: 'Your session has expired. Sign in again and retry.',
      rateLimited: 'Too many requests. Wait a moment and try again.',
      serverError: 'The service is temporarily unavailable. Try again later.',
      business: 'The reply couldn’t be completed.',
      failed: 'The request failed. Try again later.',
      partial: 'What was received is kept above and may be incomplete.',
    },
    tabs: {
      writing: 'Writing',
      ppt: 'PPT',
      video: 'Video',
      design: 'Design',
      excel: 'Excel',
      web: 'Web',
      podcast: 'Podcast',
      chart: 'Charts',
    },
    skillPanel: {
      loadFailed: 'Failed to load skills',
      searchPlaceholder: 'Search skills or apps',
      skills: 'Skills',
      apps: 'Apps',
      noSkillMatch: 'No matching skills',
      noSkills: 'No skills available',
      noAppMatch: 'No matching apps',
      noApps: 'No apps available',
      historyTitle: '{{name}} conversation history',
      newConversation: 'Start a new conversation',
      noHistory: 'No conversation history',
      unnamedConversation: 'Untitled conversation',
      minutesAgo: '{{count}} minutes ago',
      hoursAgo: '{{count}} hours ago',
      daysAgo: '{{count}} days ago',
    },
  },
}
