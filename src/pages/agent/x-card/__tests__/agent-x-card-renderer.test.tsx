// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCatalog, clearCatalogCache } from '@ant-design/x-card'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AgentXCardRenderer } from '../agent-x-card-renderer'
import { actionCardCommands, upgradeCardCatalog } from './fixtures'

beforeEach(() => registerCatalog(upgradeCardCatalog))
afterEach(() => clearCatalogCache())

it('keeps the A2UI source ID, ISO timestamp and resolved action context', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const onAction = vi.fn()
  try {
    await act(async () => {
      root.render(
        <AgentXCardRenderer
          commands={actionCardCommands}
          surfaceIds={['upgrade-card']}
          onAction={onAction}
        />,
      )
    })
    const button = container.querySelector('button')
    expect(button?.textContent).toBe('Confirm fixture')
    await act(async () => button?.click())
    expect(onAction).toHaveBeenCalledOnce()
    const payload = onAction.mock.calls[0][0]
    expect(payload).toMatchObject({
      name: 'confirm',
      surfaceId: 'upgrade-card',
      sourceComponentId: 'submit',
      context: { choice: { value: 'test' } },
    })
    expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp)
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})

it('renders tool-provided text as text instead of executable markup', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const text = '<img src=x onerror="alert(1)"><script>alert(1)</script>'
  const commands = actionCardCommands.map((command) =>
    'updateComponents' in command
      ? {
          ...command,
          updateComponents: {
            ...command.updateComponents,
            components: command.updateComponents.components.map((component) =>
              component.id === 'label' ? { ...component, text } : component,
            ),
          },
        }
      : command,
  )
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => {
      root.render(
        <AgentXCardRenderer
          commands={commands}
          surfaceIds={['upgrade-card']}
        />,
      )
    })
    expect(container.textContent).toContain(text)
    expect(container.querySelector('img, script')).toBeNull()
  } finally {
    await act(async () => root.unmount())
  }
})
