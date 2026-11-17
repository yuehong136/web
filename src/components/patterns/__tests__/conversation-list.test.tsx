import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  ConversationList,
  type ConversationListAction,
} from '../conversation-list'

let root: Root
let host: HTMLDivElement
const select = vi.fn()
const create = vi.fn()
const rename = vi.fn()
const remove = vi.fn()
const actions: ConversationListAction[] = [
  { key: 'rename', label: 'Rename', onSelect: rename },
  { key: 'delete', label: 'Delete', danger: true, onSelect: remove },
]

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  select.mockReset()
  create.mockReset()
  rename.mockReset()
  remove.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () =>
    root.render(
      <ConversationList
        activeKey="b"
        onSelect={select}
        creation={{ label: 'New chat', onClick: create }}
        groupLabel={(group) => `Group ${group}`}
        actionsLabel={(item) => `Actions for ${item.label}`}
        actions={actions}
        items={[
          { key: 'a', label: 'First', group: 'today' },
          { key: 'b', label: 'Second', group: 'today' },
          { key: 'c', label: 'Third', group: 'earlier' },
        ]}
      />,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('groups conversations under their headings in order and marks the current one', () => {
  expect([...host.querySelectorAll('h3')].map((h) => h.textContent)).toEqual([
    'Group today',
    'Group earlier',
  ])
  const current = host.querySelector('[aria-current="true"]')
  expect(current?.textContent).toBe('Second')
})

it('creates and selects conversations', async () => {
  const button = (label: string) =>
    [...host.querySelectorAll('button')].find(
      (item) => item.textContent === label,
    )!
  await act(async () => button('New chat').click())
  await act(async () => button('Third').click())
  expect(create).toHaveBeenCalledOnce()
  expect(select).toHaveBeenCalledWith('c')
})

it('offers rename and delete from each conversation’s menu', async () => {
  const trigger = host.querySelector<HTMLButtonElement>(
    'button[aria-label="Actions for First"]',
  )!
  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  const item = [...document.querySelectorAll('[role="menuitem"]')].find(
    (entry) => entry.textContent === 'Delete',
  ) as HTMLElement
  expect(item).toBeDefined()
  await act(async () => item.click())
  expect(remove).toHaveBeenCalledWith(
    expect.objectContaining({ key: 'a', label: 'First' }),
  )
  expect(select).not.toHaveBeenCalled()
})
