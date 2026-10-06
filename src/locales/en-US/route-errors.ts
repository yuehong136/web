export default {
  routeErrors: {
    unavailable: {
      knowledgeImport: {
        title: 'Knowledge base import is unavailable',
        description:
          'Whole knowledge base import is not supported. Open a knowledge base to upload files or connect a data source.',
        action: 'Open knowledge bases',
      },
      documents: {
        title: 'File center is unavailable',
        description:
          'Files are currently managed within each knowledge base. Open a knowledge base to upload and manage its documents.',
        action: 'Open knowledge bases',
      },
      workflow: {
        title: 'Workflow center is unavailable',
        description:
          'Use the Agents workspace to manage agents and data pipelines.',
        action: 'Open Agents',
      },
      appearance: {
        title: 'Appearance settings page is unavailable',
        description:
          'Use the theme and language controls in the sidebar to change your preferences.',
        action: 'Go to home',
      },
    },
    notFound: {
      title: 'Page not found',
      description: 'The address you requested does not exist or has changed.',
    },
    unauthorized: {
      title: 'Please sign in again',
      description: 'Your session has expired. Sign in to continue.',
    },
    forbidden: {
      title: 'Access denied',
      description:
        'Your account does not have permission to view this content.',
    },
    server: {
      title: 'Service temporarily unavailable',
      description:
        'The service encountered a temporary problem. Try again later.',
    },
    unexpected: {
      title: 'Unable to display this page',
      description:
        'The page encountered an unexpected problem. Reload to continue.',
    },
    actions: {
      home: 'Go to home',
      back: 'Go back',
      retry: 'Reload',
      login: 'Sign in again',
    },
  },
}
