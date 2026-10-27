import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createContextManifest } from '@/lib/ai-workspace/contracts'
import { setProductLanguage } from '@/locales/i18n'
import { ContextManifestSummary } from '@/components/chat/context-manifest-summary'

const manifest = createContextManifest({
  scope: { identity: 'user-a', threadId: 'conversation-a' },
  messageId: 'answer-a',
  stage: 'submitted',
  resources: [
    {
      kind: 'tool',
      id: 'server-a',
      label: '真实工具名称',
      origin: 'turn',
      availability: 'unknown',
    },
  ],
})
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('discloses actual labels with submission and unknown-availability semantics', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<ContextManifestSummary manifest={manifest} />),
  )
  const details = container.querySelector('details')!
  expect(details.open).toBe(false)
  await act(async () => container.querySelector('summary')!.click())
  expect(details.open).toBe(true)
  expect(container.textContent).toContain('Submitted with this turn')
  expect(container.textContent).toContain(
    'does not confirm that the model read it',
  )
  expect(container.textContent).toContain('Availability unknown')
  expect(container.textContent).toContain('真实工具名称')
  expect(container.textContent).not.toContain('Used in this answer')
})

it('switches UI language using the same instance while preserving the open disclosure and resource label', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<ContextManifestSummary manifest={manifest} />),
  )
  const details = container.querySelector('details')!
  details.open = true
  await act(async () => setProductLanguage('zh-CN'))
  expect(container.querySelector('details')).toBe(details)
  expect(details.open).toBe(true)
  expect(container.textContent).toContain('真实工具名称')
  expect(container.textContent).not.toContain('Turn context')
  expect(container.textContent).not.toContain('chat.aiWorkspace')
})

it('shows a selected scope before submission and hides an empty manifest', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(
      <ContextManifestSummary
        manifest={createContextManifest({ ...manifest, stage: 'selected' })}
      />,
    ),
  )
  expect(container.textContent).toContain('Selected')
  expect(container.textContent).toContain(
    'Actual use requires server confirmation',
  )
  await act(async () =>
    root.render(
      <ContextManifestSummary
        manifest={createContextManifest({ ...manifest, resources: [] })}
      />,
    ),
  )
  expect(container.textContent).toBe('')
})
