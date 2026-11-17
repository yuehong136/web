import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import {
  WorkbenchHeaderProvider,
  useWorkbenchHeaderState,
} from '@/components/layout/workbench-header'
import { ChatThreadHeader } from '../chat-thread-header'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

function Shell({ children }: { children: ReactNode }) {
  const { value, titleRef, actionsRef } = useWorkbenchHeaderState()
  return (
    <WorkbenchHeaderProvider value={value}>
      <div data-shell-header>
        <div ref={titleRef} data-workbench-title />
        <div ref={actionsRef} data-workbench-actions />
      </div>
      <main data-main-task-area>{children}</main>
    </WorkbenchHeaderProvider>
  )
}

const header = (
  <ChatThreadHeader
    title="Retrieval strategy"
    identity={<span>gpt-test</span>}
    actions={<button type="button">Settings</button>}
  />
)

it('moves the title, identity and actions into the shell header', async () => {
  await act(async () => root.render(<Shell>{header}</Shell>))
  await act(async () => {})
  const title = container.querySelector('[data-workbench-title]')!
  expect(title.querySelector('h1')?.textContent).toBe('Retrieval strategy')
  expect(title.querySelector('[data-thread-identity]')?.textContent).toBe(
    'gpt-test',
  )
  expect(
    container.querySelector('[data-workbench-actions] button')?.textContent,
  ).toBe('Settings')
  // One heading row: nothing visible is left inside the page.
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('main header')).toBeNull()
})

it('stays inline outside the app shell', async () => {
  await act(async () => root.render(header))
  const inline = container.querySelector('header[data-thread-header]')!
  expect(inline.querySelector('h1')?.textContent).toBe('Retrieval strategy')
  expect(inline.querySelector('button')?.textContent).toBe('Settings')
})
