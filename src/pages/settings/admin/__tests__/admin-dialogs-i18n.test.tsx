import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import { ChangePasswordDialog } from '../components/change-password-dialog'
import { CreateUserDialog } from '../components/create-user-dialog'

let root: Root
let container: HTMLDivElement
let nativeDialog: ReturnType<typeof stubNativeDialog>

const text = () => document.body.textContent ?? ''
const submit = (formId: string) =>
  act(async () =>
    document
      .getElementById(formId)!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  nativeDialog = stubNativeDialog()
  await setProductLanguage('zh-CN')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  nativeDialog.restore()
  vi.unstubAllGlobals()
  await setProductLanguage('zh-CN')
})

it('re-translates create-user validation errors after a language switch', async () => {
  const onSubmit = vi.fn()
  await act(async () =>
    root.render(
      <CreateUserDialog open onOpenChange={() => {}} onSubmit={onSubmit} />,
    ),
  )
  expect(text()).toContain('设为管理员')

  await submit('create-user-form')
  expect(onSubmit).not.toHaveBeenCalled()
  expect(text()).toContain('请输入邮箱')
  expect(text()).toContain('请输入密码')

  await act(async () => setProductLanguage('en-US'))
  expect(text()).toContain('Enter an email address')
  expect(text()).toContain('Enter a password')
  expect(text()).toContain('Make administrator')
  expect(text()).not.toContain('请输入邮箱')
  expect(text()).not.toMatch(/settings\.admin\./)
})

it('localizes the change-password dialog including its mismatch error', async () => {
  await setProductLanguage('en-US')
  const onSubmit = vi.fn()
  await act(async () =>
    root.render(
      <ChangePasswordDialog
        open
        onOpenChange={() => {}}
        user={{ email: 'ada@example.com' } as never}
        onSubmit={onSubmit}
      />,
    ),
  )
  const [password, confirm] = document.querySelectorAll<HTMLInputElement>(
    'input[type="password"]',
  )
  const type = (input: HTMLInputElement, value: string) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  await type(password, 'long-enough')
  await type(confirm, 'different-one')
  await submit('change-password-form')

  expect(onSubmit).not.toHaveBeenCalled()
  expect(text()).toContain('Change password')
  expect(text()).toContain('The passwords do not match')
  await act(async () => setProductLanguage('zh-CN'))
  expect(text()).toContain('两次密码不一致')
})
