import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test } from 'vitest'
import { FormWrapper } from '../form-wrapper'

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
})

async function renderForm(element: React.ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  cleanup = () => {
    root.unmount()
  }

  await act(async () => {
    root.render(element)
  })

  const form = container.querySelector('form')
  expect(form).not.toBeNull()

  return form as HTMLFormElement
}

test('FormWrapper prevents native submit when no submit handler is provided', async () => {
  const form = await renderForm(<FormWrapper />)
  const event = new Event('submit', { bubbles: true, cancelable: true })

  const result = form.dispatchEvent(event)

  expect(result).toBe(false)
  expect(event.defaultPrevented).toBe(true)
})

test('FormWrapper prevents native submit before delegating to submit handler', async () => {
  let submitCount = 0
  const form = await renderForm(
    <FormWrapper
      onSubmit={(event) => {
        submitCount += 1
        expect(event.defaultPrevented).toBe(true)
      }}
    />,
  )
  const event = new Event('submit', { bubbles: true, cancelable: true })

  const result = form.dispatchEvent(event)

  expect(result).toBe(false)
  expect(event.defaultPrevented).toBe(true)
  expect(submitCount).toBe(1)
})
