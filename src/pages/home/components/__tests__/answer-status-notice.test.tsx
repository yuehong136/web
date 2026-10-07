import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { AnswerStatus } from '../../types'
import { AnswerStatusNotice } from '../answer-status-notice'

let root: Root
let host: HTMLDivElement

const render = (status?: AnswerStatus) =>
  act(async () => root.render(<AnswerStatusNotice status={status} />))
const notice = () => host.querySelector<HTMLElement>('[data-answer-status]')

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('renders nothing for an answer that completed', async () => {
  await render(undefined)

  expect(host.innerHTML).toBe('')
})

it('states the category in words and notes that received content was kept', async () => {
  await render({ kind: 'network', partial: true })

  expect(notice()?.dataset.answerStatus).toBe('network')
  expect(notice()?.textContent).toBe(
    i18n.t('home.answerStatus.network') + i18n.t('home.answerStatus.partial'),
  )
  // 图标只作装饰，状态由文字表达而不是颜色
  expect(notice()?.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
    'true',
  )
  // 它在对话的 polite log 区域里随消息播报，不另设 alert 打断朗读
  expect(notice()?.getAttribute('role')).toBeNull()
})

it('leaves out the partial note when nothing had arrived', async () => {
  await render({ kind: 'unauthorized', partial: false })

  expect(notice()?.textContent).toBe(i18n.t('home.answerStatus.unauthorized'))
})

it('follows the product language', async () => {
  await setProductLanguage('en-US')
  await render({ kind: 'stopped', partial: false })

  expect(notice()?.textContent).toBe('Stopped receiving the reply.')
})
