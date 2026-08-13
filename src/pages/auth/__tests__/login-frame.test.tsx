import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LoginFrame } from '../components/login-frame'

describe('LoginFrame', () => {
  it('renders a compact desktop frame without the marketing carousel', () => {
    const markup = renderToStaticMarkup(
      <LoginFrame desktop>
        <div>shared-login-form</div>
      </LoginFrame>,
    )

    expect(markup).toContain('data-auth-frame="desktop"')
    expect(markup).toContain('shared-login-form')
    expect(markup).not.toContain('开始您的旅程')
  })

  it('keeps the existing marketing composition for web', () => {
    const markup = renderToStaticMarkup(
      <LoginFrame desktop={false}>
        <div>shared-login-form</div>
      </LoginFrame>,
    )

    expect(markup).toContain('data-auth-frame="web"')
    expect(markup).toContain('开始您的旅程')
    expect(markup).toContain('shared-login-form')
  })
})
