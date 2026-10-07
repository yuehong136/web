import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
})

const TestSelect = ({ onChange }: { onChange: (value: string) => void }) => {
  const [value, setValue] = useState('')

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        onChange(nextValue)
        setValue(nextValue)
      }}
    >
      <SelectTrigger data-testid="select-trigger">
        <SelectValue placeholder="Choose target" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="target-1" data-testid="select-option">
          Published agent
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

test('selects a pointer-activated portal option before outside-click handling', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const onChange = vi.fn<(value: string) => void>()

  cleanup = () => {
    root.unmount()
  }

  await act(async () => {
    root.render(<TestSelect onChange={onChange} />)
  })

  const trigger = container.querySelector<HTMLButtonElement>(
    '[data-testid="select-trigger"]',
  )
  expect(trigger).not.toBeNull()

  await act(async () => {
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  const option = document.body.querySelector<HTMLButtonElement>(
    '[data-testid="select-option"]',
  )
  expect(option).not.toBeNull()
  expect(
    option
      ?.closest('[data-select-content]')
      ?.classList.contains('pointer-events-auto'),
  ).toBe(true)

  await act(async () => {
    option?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
  })

  expect(onChange).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledWith('target-1')
  expect(trigger?.textContent).toContain('Published agent')
  expect(
    document.body.querySelector('[data-testid="select-option"]'),
  ).toBeNull()
})

const LockedSelect = ({
  disabled,
  onChange,
}: {
  disabled: boolean
  onChange: (value: string) => void
}) => (
  <Select value="alpha" onValueChange={onChange} disabled={disabled}>
    <SelectTrigger data-testid="select-trigger">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="alpha">Alpha</SelectItem>
      <SelectItem value="beta">Beta</SelectItem>
    </SelectContent>
  </Select>
)

async function mountLockedSelect(onChange: (value: string) => void) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  cleanup = () => root.unmount()
  const render = (disabled: boolean) =>
    act(async () => {
      root.render(<LockedSelect disabled={disabled} onChange={onChange} />)
    })
  await render(true)
  const trigger = container.querySelector<HTMLButtonElement>(
    '[data-testid="select-trigger"]',
  )
  if (!trigger) throw new Error('Missing select trigger')
  return { trigger, render }
}

test('a disabled select can be neither opened nor changed', async () => {
  const onChange = vi.fn<(value: string) => void>()
  const { trigger } = await mountLockedSelect(onChange)

  expect(trigger.disabled).toBe(true)
  expect(trigger.textContent).toContain('Alpha')

  await act(async () => {
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  // Opening keys and typeahead must not reach the value either.
  for (const key of ['ArrowDown', 'Enter', ' ', 'b']) {
    await act(async () => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      )
    })
  }

  expect(document.body.textContent).not.toContain('Beta')
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger.textContent).toContain('Alpha')
})

test('disabling an open select closes its list', async () => {
  const onChange = vi.fn<(value: string) => void>()
  const { trigger, render } = await mountLockedSelect(onChange)
  await render(false)

  await act(async () => trigger.click())
  expect(document.body.textContent).toContain('Beta')

  await render(true)

  expect(document.body.textContent).not.toContain('Beta')
  expect(trigger.disabled).toBe(true)
  expect(onChange).not.toHaveBeenCalled()
})
