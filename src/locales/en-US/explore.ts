export default {
  explore: {
    attachmentOnlyPrompt: 'Please analyze these attachments',
    assistantFallback: 'AI Assistant',
    welcomeDescription: 'How can I help?',
    dragUpload: {
      title: 'Release to upload files',
      description: 'Images, documents, and more are supported',
      titleShort: 'Release to upload',
      action: 'Click or drag files here',
      limits:
        'Supports images, documents, and more. Up to {{count}} files, {{size}}MB each.',
    },
    tabs: {
      workspace: 'Workspace',
      topics: 'Topics',
      settings: 'Settings',
    },
    sidebar: {
      discover: 'Discover',
      loadingApps: 'Loading apps...',
      loadFailed: 'Failed to load',
      noApps: 'No apps',
      selectAppFirst: 'Select an app first',
      settingsComingSoon: 'Settings are under development...',
    },
    conversations: {
      loading: 'Loading...',
      new: 'New conversation',
      fallbackName: 'New conversation',
      rename: 'Rename',
      delete: 'Delete',
      deleted: 'Conversation deleted',
      deleteFailed: 'Delete failed',
      renameTitle: 'Rename conversation',
      namePlaceholder: 'Enter conversation name',
      groups: {
        today: 'Today',
        yesterday: 'Yesterday',
        last7Days: 'Last 7 days',
        earlier: 'Earlier',
      },
    },
    header: {
      market: 'App Market',
      chatSettings: 'Chat settings',
      defaultLayout: 'Default layout',
      centerLayout: 'Centered layout',
      fullLayout: 'Full-width layout',
    },
    market: {
      added: 'Added',
      addToWorkspace: 'Add to workspace',
    },
    prompts: {
      explain: {
        label: 'Explain this concept',
        description: 'Learn in depth',
      },
      code: {
        label: 'Write code',
        description: 'Programming assistant',
      },
      summarize: {
        label: 'Summarize key points',
        description: 'Extract quickly',
      },
      translate: {
        label: 'Translate text',
        description: 'Multilingual',
      },
    },
    sender: {
      placeholder:
        'Type a message, press Enter to send, or send attachments directly',
      uploadFile: 'Upload file',
      stop: 'Stop generating',
      thinking: 'Deep thinking',
      onlineSearch: 'Web search',
      uploading: 'Uploading...',
      attachmentsReady: '{{count}} attachments ready',
      canSendDirectly: 'Ready to send',
      uploadErrorHint: 'Some attachments failed. Click a card to retry.',
    },
    attachmentStatus: {
      uploading: 'Uploading {{percent}}%',
      error: 'Upload failed. Click to retry',
      ready: 'Ready · {{type}} · {{size}}',
      image: 'Image',
    },
    toast: {
      copied: 'Copied to clipboard',
      copyFailed: 'Copy failed',
      like: 'Thanks for your feedback',
      dislike: 'Thanks for your feedback. We will keep improving.',
      missingUserMessage: 'Could not find the matching user message',
      assistantError: 'Sorry, something went wrong. Please try again.',
      uploadSuccess: 'File {{name}} uploaded',
      uploadFailed: 'Upload failed: {{message}}',
      fileTooLarge: 'File {{name}} exceeds the size limit',
    },
  },
}
