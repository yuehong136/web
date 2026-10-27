import { studioEditor } from './studio-editor'

export default {
  studio: {
    editor: studioEditor,

    page: {
      title: 'Studio',
      description:
        'Create projects and manage the conversational apps in this workspace.',
      createProject: 'New project',
      import: 'Import',
      exporting: 'Exporting…',
      exportSelected: 'Export ({{count}})',
      deleteSelected: 'Delete ({{count}})',
      results: 'Apps: {{count}}',
      selection: 'Selected apps',
      clearSelection: 'Clear selection',
      loadingTitle: 'Loading apps',
      loadingDescription: 'Your apps will appear here.',
      errorTitle: 'Could not load apps',
      errorDescription: 'Try loading the list again. Your filters are kept.',
    },
    stats: {
      totalApps: 'Apps',
      published: 'Published',
      draft: 'Drafts',
      recentUpdated: 'Recently updated',
    },
    filters: {
      status: 'Status',
      published: 'Published',
      draft: 'Draft',
      unknown: 'Status unavailable',
      searchPlaceholder: 'Search apps',
      reset: 'Clear search and filters',
      pageScope: 'Status and update order apply to this page.',
    },
    toolbar: {
      timeFormat: 'Time display',
      detailedTime: 'Detailed time',
      compactTime: 'Compact time',
      relativeTime: 'Relative time',
      descending: 'Newest first',
      ascending: 'Oldest first',
      gridView: 'Grid view',
      listView: 'List view',
    },
    pagination: {
      total: '{{count}} items',
      selected: 'Selected: {{count}}',
      previous: 'Previous',
      next: 'Next',
    },
    card: {
      app: 'App',
      knowledgeBases: 'Knowledge bases',
      knowledgeCount: 'Knowledge bases: {{count}}',
      edit: 'Edit',
      delete: 'Delete',
      settings: 'Settings',
      exportTemplate: 'Export template',
      actionsFor: 'Actions for {{name}}',
      selectApp: 'Select {{name}}',
      selectPage: 'Select apps on this page',
      noDescription: 'No description yet.',
      noUpdateTime: 'Update time unavailable',
    },
    empty: {
      listTitle: 'No apps yet',
      listDescription:
        'Create a conversational app or import a template to begin.',
      searchTitle: 'No matching apps',
      searchDescription:
        'Try another search or clear the filters for this page.',
      createFirst: 'Create an app',
    },
    deleteDialog: {
      title: 'Delete apps',
      description: 'This cannot be undone.',
      namedDescription: 'Delete “{{name}}”? This cannot be undone.',
      bulkDescription:
        'Delete the selected apps ({{count}})? This cannot be undone.',
    },
    projectType: {
      title: 'New project',
      description: 'Choose how you want to build.',
      appTitle: 'Conversational app',
      appDescription:
        'Configure a model, prompts, and knowledge for a chat experience.',
      agentTitle: 'Agent workflow',
      agentDescription:
        'Connect tools and reasoning steps in a visual workflow.',
      continue: 'Continue',
    },
    createApp: {
      title: 'Create an app',
      description:
        'Give your app a name and description. Configure the model and knowledge next.',
      icon: 'App icon (optional)',
      uploadIcon: 'Upload icon',
      removeIcon: 'Remove icon',
      iconHint: 'JPG, PNG, or SVG under 2 MB.',
      name: 'App name',
      namePlaceholder: 'Name your app',
      nameHint: 'Up to 255 UTF-8 bytes.',
      appDescription: 'Description',
      descriptionPlaceholder: 'What will this app help people do?',
      submit: 'Create app',
      validation: {
        nameRequired: 'Enter an app name.',
        nameTooLong: 'Keep the name within 255 UTF-8 bytes.',
        descriptionRequired: 'Enter a description.',
        iconType: 'Choose a JPG, PNG, or SVG image.',
        iconSize: 'Choose an image smaller than 2 MB.',
        iconRead: 'Could not read the image. Choose it again.',
      },
    },
    importDialog: {
      title: 'Import app templates',
      description: 'Use a JSON template or a ZIP containing templates.',
      dropHint: 'Drop a file here or choose one.',
      chooseFile: 'Choose a template file',
      submit: 'Import templates',
      retryHint: 'Could not import. Your file is kept; try again.',
      processed: 'Templates processed: {{count}}',
      summary: 'Imported: {{imported}}. Failed: {{failed}}.',
      warnings:
        'Configuration warnings: {{count}}. Review this app before use.',
      failedItem:
        'This template was not imported. Check it and import a corrected file.',
      partialHint:
        'Choose a corrected file for failed templates. Re-importing successful templates may create duplicates.',
      validation: {
        fileType: 'Choose a .json or .zip template file.',
        format: 'This JSON is not a supported app template.',
        app: 'The template is missing app data.',
        json: 'Could not read this JSON file. Check its content.',
        result:
          'The import result could not be verified. Keep this file and check the app list before retrying.',
      },
    },
    feedback: {
      created: 'App created',
      updated: 'App updated',
      saveFailed: 'Could not save the app. Try again.',
      deleted: 'Apps deleted',
      deleteFailed: 'Could not delete the apps. Try again.',
      exported: 'Templates exported',
      exportFailed: 'Could not export templates. Try again.',
      imported: 'Apps imported: {{count}}',
      importFailed: 'Could not import templates. Try again.',
      importPartial:
        'Imported: {{imported}}. Failed: {{failed}}. Review the import results.',
      importEmpty: 'No apps were imported. Check the template file.',
    },
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
  },
}
