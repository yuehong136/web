import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { CustomSelect } from '../custom-select'

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
})

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
]

async function mount(disabled: boolean, onChange: (value: string) => void) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  cleanup = () => root.unmount()
  await act(async () => {
    root.render(
      <CustomSelect
        options={options}
        value="alpha"
        onChange={onChange}
        disabled={disabled}
      />,
    )
  })
  const trigger = container.querySelector('button')
  if (!trigger) throw new Error('Missing select trigger')
  return trigger
}

function option(label: string) {
  return Array.from(document.body.querySelectorAll('button')).find(
    (button) => button.textContent === label,
  )
}

test('a disabled custom select does not open or change its value', async () => {
  const onChange = vi.fn<(value: string) => void>()
  const trigger = await mount(true, onChange)

  expect(trigger.disabled).toBe(true)
  await act(async () => {
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(option('Beta')).toBeUndefined()
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger.textContent).toContain('Alpha')
})

test('an enabled custom select still opens and reports the pick', async () => {
  const onChange = vi.fn<(value: string) => void>()
  const trigger = await mount(false, onChange)

  expect(trigger.disabled).toBe(false)
  await act(async () => trigger.click())
  await act(async () => option('Beta')?.click())

  expect(onChange).toHaveBeenCalledExactlyOnceWith('beta')
})
