import { act, createRef, type RefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import { ChatInputBox } from '../ChatInputBox'

vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: ({ disabled }: { disabled?: boolean }) => (
    <div
      data-testid="model-selector"
      data-disabled={String(Boolean(disabled))}
    />
  ),
}))

const app = { id: 'dialog-1', name: '流式引用验证' } as DialogApp
let root: Root
let host: HTMLDivElement
const onSend = vi.fn()
const onStop = vi.fn()

const render = (props: {
  inputValue: string
  isStreaming?: boolean
  scopeLocked?: boolean
}) =>
  act(async () =>
    root.render(
      <ChatInputBox
        onInputChange={() => undefined}
        onKeyDown={() => undefined}
        selectedMCPServers={[]}
        selectedApps={[app]}
        onRemoveSkill={() => undefined}
        onRemoveApp={() => undefined}
        isSkillPanelOpen={false}
        onSkillPanelToggle={() => undefined}
        skillPanelRef={
          createRef<HTMLButtonElement>() as RefObject<HTMLButtonElement>
        }
        skillPanelContent={null}
        models={{}}
        selectedModelId="qwen-plus"
        onModelSelect={() => undefined}
        modelsLoading={false}
        isModelLocked={false}
        onSend={onSend}
        onStop={onStop}
        variant="chat"
        {...props}
      />,
    ),
  )

const byLabel = (label: string) =>
  host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  onSend.mockReset()
  onStop.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('keeps the draft editable while an answer streams and only offers stop', async () => {
  await render({ inputValue: '下一条草稿', isStreaming: true })

  expect(host.querySelector('textarea')?.disabled).toBe(false)
  expect(byLabel('提交')).toBeNull()

  await act(async () => byLabel('停止输出')!.click())
  expect(onStop).toHaveBeenCalledOnce()
  expect(onSend).not.toHaveBeenCalled()
})

it('locks the request scope and send while a send is being prepared', async () => {
  await render({ inputValue: '草稿', scopeLocked: true })

  expect(host.querySelector('textarea')?.disabled).toBe(false)
  expect(byLabel('提交')?.disabled).toBe(true)
  expect(byLabel('选择技能或应用')?.disabled).toBe(true)
  expect(byLabel('移除 流式引用验证')?.disabled).toBe(true)
  expect(
    host
      .querySelector('[data-testid="model-selector"]')
      ?.getAttribute('data-disabled'),
  ).toBe('true')
})

it('enables send and scope changes again when idle with a draft', async () => {
  await render({ inputValue: '草稿' })

  expect(byLabel('提交')?.disabled).toBe(false)
  expect(byLabel('移除 流式引用验证')?.disabled).toBe(false)

  await act(async () => byLabel('提交')!.click())
  expect(onSend).toHaveBeenCalledOnce()
})

it('disables send for an empty draft', async () => {
  await render({ inputValue: '   ' })

  expect(byLabel('提交')?.disabled).toBe(true)
})
