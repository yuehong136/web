export interface GraphTheme {
  accentColor: string
  borderColor: string
  cardShadow: string
  edgeActiveColor: string
  edgeColor: string
  focusColor: string
  surfaceColor: string
  surfaceSubtleColor: string
  textColor: string
  textColorSub: string
  workspaceBorderColor: string
}

function readDesignToken(element: HTMLElement, token: string) {
  return (
    getComputedStyle(element).getPropertyValue(`--color-${token}`).trim() ||
    `var(--color-${token})`
  )
}

export function getGraphTheme(element: HTMLElement): GraphTheme {
  const workspaceBorderColor = readDesignToken(
    element,
    'components-workspace-border',
  )

  return {
    accentColor: readDesignToken(element, 'text-accent'),
    borderColor: readDesignToken(element, 'components-card-border'),
    cardShadow: readDesignToken(element, 'components-card-shadow'),
    edgeActiveColor: readDesignToken(element, 'text-secondary'),
    edgeColor: workspaceBorderColor,
    focusColor: readDesignToken(element, 'state-focus'),
    surfaceColor: readDesignToken(element, 'components-card-bg'),
    surfaceSubtleColor: readDesignToken(element, 'components-card-bg-hover'),
    textColor: readDesignToken(element, 'text-primary'),
    textColorSub: readDesignToken(element, 'text-muted'),
    workspaceBorderColor,
  }
}
