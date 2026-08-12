export default {
  routeErrors: {
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
