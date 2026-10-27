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

it('applies a late updater to the draft as it is now, keeping text typed meanwhile', async () => {
  // 附件上传开始时拿到的是旧草稿；上传期间继续输入，完成回写不能覆盖这些文字
  const finishUpload = (draft: Draft) => ({
    ...draft,
    files: [...draft.files, 'report.pdf'],
  })
  await act(async () => drafts.setDraft({ content: 'draft', files: [] }))
  await act(async () =>
    drafts.setDraft((draft) => ({ ...draft, content: 'draft, typed later' })),
  )
  await act(async () => drafts.setDraft(finishUpload))

  expect(drafts.draft).toEqual({
    content: 'draft, typed later',
    files: ['report.pdf'],
  })
})

it('starts an updater from the empty draft in a conversation without one', async () => {
  await render('fresh')
  await act(async () =>
    drafts.setDraft((draft) => ({ ...draft, content: 'first words' })),
  )

  expect(drafts.draft).toEqual({ content: 'first words', files: [] })
})
