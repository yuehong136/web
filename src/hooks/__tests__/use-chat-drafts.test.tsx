import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useChatDrafts } from '../use-chat-drafts'

// 文字加附件的草稿：每次编辑都换一个新对象，只有提交时的那个对象会被清掉
interface Draft {
  content: string
  files: string[]
}

const EMPTY: Draft = { content: '', files: [] }

let drafts: ReturnType<typeof useChatDrafts<Draft>>
let root: Root
let host: HTMLDivElement

function Surface({ draftKey }: { draftKey: string }) {
  const current = useChatDrafts('user-a:tenant-a', draftKey, EMPTY)
  useEffect(() => {
    drafts = current
  }, [current])
  return null
}

const render = (draftKey: string) =>
  act(async () => root.render(<Surface draftKey={draftKey} />))

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  root = createRoot(host)
  await render('new')
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('starts every conversation from the shared empty draft', () => {
  expect(drafts.draft).toBe(EMPTY)
})

it('clears an object draft only while it is the submitted snapshot', async () => {
  const submitted = { content: 'question', files: ['a.pdf'] }
  await act(async () => drafts.setDraft(submitted))
  const edited = { ...submitted, content: 'question, edited after send' }
  await act(async () => drafts.setDraft(edited))
  await act(async () => drafts.clearDraft('new', submitted))

  expect(drafts.draft).toBe(edited)

  await act(async () => drafts.clearDraft('new', edited))

  expect(drafts.draft).toBe(EMPTY)
})

it('carries an object draft over to the created conversation', async () => {
  const next = { content: 'next turn', files: ['b.png'] }
  await act(async () => drafts.setDraft(next))
  await act(async () => drafts.moveDraft('new', 'created'))

  expect(drafts.draft).toBe(EMPTY)

  await render('created')

  expect(drafts.draft).toBe(next)
})
