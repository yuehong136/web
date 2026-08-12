import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingDialog } from '..'

const mutationState = vi.hoisted(() => ({
  updateAgentSetting: vi.fn(),
}))

vi.mock('@/hooks/use-agent-mutation', async () => {
  const React = await import('react')
  return {
    useUpdateAgentSetting: () => {
      const [isLoading, setIsLoading] = React.useState(false)
      return {
        isLoading,
        updateAgentSetting: async (payload: unknown) => {
          setIsLoading(true)
          try {
            return await mutationState.updateAgentSetting(payload)
          } finally {
            setIsLoading(false)
          }
        },
      }
    },
  }
})

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}))

function setFieldValue(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    field instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  setter?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('Agent basic settings dialog', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mutationState.updateAgentSetting.mockReset()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
  })

  it('shows current values and closes only after the mutation resolves', async () => {
    const mutation = createDeferred<boolean>()
    mutationState.updateAgentSetting.mockReturnValue(mutation.promise)
    const hideModal = vi.fn()
    const onSaved = vi.fn()

    await act(async () => {
      root.render(
        <SettingDialog
          agentId="agent-1"
          title="Existing title"
          description="Existing description"
          hideModal={hideModal}
          onSaved={onSaved}
        />,
      )
    })

    const name =
      document.body.querySelector<HTMLInputElement>('input[name="name"]')
    const description = document.body.querySelector<HTMLTextAreaElement>(
      'textarea[name="description"]',
    )
    const form = document.body.querySelector<HTMLFormElement>(
      '#agent-setting-form',
    )

    expect(name?.value).toBe('Existing title')
    expect(description?.value).toBe('Existing description')
    expect(form).not.toBeNull()

    await act(async () => {
      if (name) setFieldValue(name, '  Updated title  ')
      if (description) setFieldValue(description, '  Updated description  ')
      form?.dispatchEvent(
        new SubmitEvent('submit', { bubbles: true, cancelable: true }),
      )
      await Promise.resolve()
    })

    expect(onSaved).not.toHaveBeenCalled()
    expect(hideModal).not.toHaveBeenCalled()
    expect(name?.disabled).toBe(true)
    expect(
      document.body.querySelector<HTMLButtonElement>(
        'button[form="agent-setting-form"]',
      )?.disabled,
    ).toBe(true)

    await act(async () => {
      mutation.resolve(true)
      await mutation.promise
      await Promise.resolve()
    })

    expect(mutationState.updateAgentSetting).toHaveBeenCalledWith({
      id: 'agent-1',
      title: 'Updated title',
      description: 'Updated description',
    })
    expect(onSaved).toHaveBeenCalledWith('Updated title')
    expect(hideModal).toHaveBeenCalledOnce()
  })

  it('keeps the dialog and entered values open when the mutation rejects', async () => {
    mutationState.updateAgentSetting.mockRejectedValue(
      new Error('backend unavailable'),
    )
    const hideModal = vi.fn()
    const onSaved = vi.fn()

    await act(async () => {
      root.render(
        <SettingDialog
          agentId="agent-2"
          title="Retry me"
          description="Keep this"
          hideModal={hideModal}
          onSaved={onSaved}
        />,
      )
    })

    const form = document.body.querySelector<HTMLFormElement>(
      '#agent-setting-form',
    )
    const name =
      document.body.querySelector<HTMLInputElement>('input[name="name"]')
    const description = document.body.querySelector<HTMLTextAreaElement>(
      'textarea[name="description"]',
    )

    await act(async () => {
      if (name) setFieldValue(name, 'Edited after opening')
      if (description) setFieldValue(description, 'Changed after opening')
      form?.dispatchEvent(
        new SubmitEvent('submit', { bubbles: true, cancelable: true }),
      )
      await Promise.resolve()
    })

    expect(mutationState.updateAgentSetting).toHaveBeenCalledOnce()
    expect(onSaved).not.toHaveBeenCalled()
    expect(hideModal).not.toHaveBeenCalled()
    expect(
      document.body.querySelector<HTMLInputElement>('input[name="name"]')
        ?.value,
    ).toBe('Edited after opening')
    expect(
      document.body.querySelector<HTMLTextAreaElement>(
        'textarea[name="description"]',
      )?.value,
    ).toBe('Changed after opening')
  })
})
