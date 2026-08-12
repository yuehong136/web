;(function initializeTheme() {
  var pathname = window.location.pathname || ''
  var isShareRoute =
    pathname.indexOf('/agent/share') === 0 ||
    pathname.indexOf('/chats/widget') === 0

  if (isShareRoute) {
    // Share/embed routes prefer the URL theme and must not inherit host state.
    try {
      var urlTheme = new URLSearchParams(window.location.search).get('theme')
      if (urlTheme === 'light' || urlTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', urlTheme)
        return
      }
    } catch (_error) {
      // Invalid search parameters fall through to the persisted/system theme.
    }
  }

  var persistedTheme
  try {
    persistedTheme = localStorage.getItem('theme')
  } catch (_error) {
    // Sandboxed or privacy-restricted contexts fall back to the system theme.
  }
  if (persistedTheme === 'light' || persistedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', persistedTheme)
    return
  }

  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
})()
