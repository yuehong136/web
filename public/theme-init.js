;(function initializeAppearance() {
  // Keep this small pre-paint reader aligned with themes/appearance.ts.
  // It is an external script so strict CSP does not need an inline-script exception.
  var preferences = {}
  var legacyTheme
  try {
    var saved = localStorage.getItem('appearance')
    if (saved) {
      try {
        preferences = JSON.parse(saved)
      } catch (_error) {
        saved = null
      }
    }
    if (!saved) {
      legacyTheme = localStorage.getItem('theme')
      if (['light', 'dark', 'system'].indexOf(legacyTheme) < 0) {
        var oldStore = localStorage.getItem('ui-storage')
        legacyTheme = oldStore && JSON.parse(oldStore).state.theme
      }
    }
  } catch (_error) {
    // Privacy restrictions and malformed old stores use safe defaults.
  }
  preferences =
    preferences && typeof preferences === 'object' ? preferences : {}
  var preset =
    ['studio', 'paper', 'graphite', 'ocean'].indexOf(preferences.preset) >= 0
      ? preferences.preset
      : 'studio'
  var mode = preferences.mode == null ? legacyTheme : preferences.mode
  mode = mode === 'light' || mode === 'dark' ? mode : 'system'
  var density = preferences.density === 'compact' ? 'compact' : 'comfortable'
  var scale =
    preferences.textScale === 1.125 || preferences.textScale === 1.25
      ? preferences.textScale
      : 1
  var motion = preferences.motion === 'reduced' ? 'reduced' : 'system'
  var pathname = window.location.pathname || ''
  if (
    pathname.indexOf('/agent/share') === 0 ||
    pathname.indexOf('/chats/widget') === 0
  ) {
    try {
      var urlTheme = new URLSearchParams(window.location.search).get('theme')
      if (urlTheme === 'light' || urlTheme === 'dark') mode = urlTheme
    } catch (_error) {
      /* Invalid URLs keep the resolved preference. */
    }
  }
  function matches(query) {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches
    )
  }
  var resolvedMode =
    mode === 'system'
      ? matches('(prefers-color-scheme: dark)')
        ? 'dark'
        : 'light'
      : mode
  var reducedMotion =
    motion === 'reduced' || matches('(prefers-reduced-motion: reduce)')
  var root = document.documentElement
  root.setAttribute('data-theme', resolvedMode)
  root.setAttribute('data-preset', preset)
  root.setAttribute('data-density', density)
  root.setAttribute('data-text-scale', String(scale))
  root.setAttribute('data-motion', reducedMotion ? 'reduced' : 'system')
})()
