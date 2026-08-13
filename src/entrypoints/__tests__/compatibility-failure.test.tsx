import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CompatibilityFailure } from '../compatibility-failure-view'

describe('CompatibilityFailure', () => {
  it('renders a generic accessible failure without runtime details', () => {
    window.history.replaceState({}, '', '/secret-bridge-detail')
    const markup = renderToStaticMarkup(<CompatibilityFailure />)

    expect(markup).toContain('<main')
    expect(markup).toContain('<h1')
    expect(markup).not.toContain('secret-bridge-detail')
    expect(markup).not.toContain('app://')
    expect(markup).not.toContain('bridge version')
  })
})
