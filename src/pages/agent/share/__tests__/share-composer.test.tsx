import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { ShareComposer } from '../share-composer'

let root: Root
let host: HTMLDivElement
const submit = vi.fn()
const stop = vi.fn()
const parameters = vi.fn()
const upload = vi.fn()

const render = async (
  props: Partial<Parameters<typeof ShareComposer>[0]> = {},
) =>
  act(async () =>
    root.render(
      <ShareComposer
        value="Hello"
        files={[]}
        attachmentInputRef={createRef<HTMLInputElement>()}
        onChange={() => {}}
        onSubmit={submit}
        onStop={stop}
        onOpenParameters={parameters}
        onUploadFiles={upload}
        {...props}
      />,
    ),
  )
const button = (label: string) =>
  host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const enter = () =>
  act(async () => {
    host
      .querySelector('textarea')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
  })

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  for (const mock of [submit, stop, parameters, upload]) mock.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('sends the draft with Enter, and files alone without text', async () => {
  await render()
  await enter()
  expect(submit).toHaveBeenCalledWith('Hello')
  await render({
    value: '',
    files: [{ id: 'f1', name: 'report.pdf' } as never],
  })
  expect(host.textContent).toContain('report.pdf')
  await enter()
  expect(submit).toHaveBeenLastCalledWith('')
})

it('opens the file picker and run parameters from the toolbar', async () => {
  const input = createRef<HTMLInputElement>()
  await render({ hasParameters: true, attachmentInputRef: input })
  const pick = vi.spyOn(input.current!, 'click')
  await act(async () => button('Upload attachment').click())
  expect(pick).toHaveBeenCalledOnce()
  await act(async () => button('Run parameters').click())
  expect(parameters).toHaveBeenCalledOnce()
})

it('stops a running reply and blocks sending while files upload', async () => {
  await render({ isRunning: true })
  await act(async () => button('Stop').click())
  expect(stop).toHaveBeenCalledOnce()
  await render({ uploading: true })
  await enter()
  expect(submit).not.toHaveBeenCalled()
  expect(host.querySelector('textarea')!.disabled).toBe(true)
})
