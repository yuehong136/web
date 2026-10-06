import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NEW_CONVERSATION_DRAFT, useHomeDrafts } from '../use-home-drafts'

let drafts: ReturnType<typeof useHomeDrafts>
let root: Root
let host: HTMLDivElement

function Surface({
  identity,
  draftKey,
}: {
  identity: string
  draftKey: string
}) {
  const current = useHomeDrafts(identity, draftKey)
  useEffect(() => {
    drafts = current
  }, [current])
  return null
}

const render = (identity: string, draftKey: string) =>
  act(async () =>
    root.render(<Surface identity={identity} draftKey={draftKey} />),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  root = createRoot(host)
  await render('user-a:tenant-a', NEW_CONVERSATION_DRAFT)
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('keeps a separate draft for each conversation', async () => {
  await act(async () => drafts.setDraft('reply for A'))
  await render('user-a:tenant-a', 'conversation-b')

  expect(drafts.draft).toBe('')

  await act(async () => drafts.setDraft('reply for B'))
  await render('user-a:tenant-a', NEW_CONVERSATION_DRAFT)

  expect(drafts.draft).toBe('reply for A')
})

it('clears a draft only while it still holds the submitted text', async () => {
  await act(async () => drafts.setDraft('first'))
  await act(async () => drafts.clearDraft(NEW_CONVERSATION_DRAFT, 'stale'))

  expect(drafts.draft).toBe('first')

  await act(async () => drafts.clearDraft(NEW_CONVERSATION_DRAFT, 'first'))

  expect(drafts.draft).toBe('')
})

it('moves the next draft along when a new conversation receives its id', async () => {
  await act(async () => drafts.setDraft('typed while the answer streams'))
  await act(async () =>
    drafts.moveDraft(NEW_CONVERSATION_DRAFT, 'conversation-new'),
  )

  expect(drafts.draft).toBe('')

  await render('user-a:tenant-a', 'conversation-new')

  expect(drafts.draft).toBe('typed while the answer streams')
})

it('starts from empty drafts for another user or tenant', async () => {
  await act(async () => drafts.setDraft('private draft'))
  await render('user-b:tenant-a', NEW_CONVERSATION_DRAFT)

  expect(drafts.draft).toBe('')

  await render('user-a:tenant-a', NEW_CONVERSATION_DRAFT)

  expect(drafts.draft).toBe('')
})
