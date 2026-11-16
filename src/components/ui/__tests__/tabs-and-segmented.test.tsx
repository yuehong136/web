import { act, useState } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { SegmentedControl } from '../segmented-control'
import { byRole, createReactHarness, press } from './helpers/react-harness'

const { render, cleanup } = createReactHarness()

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
})

afterEach(cleanup)

// Radix keeps inactive panels mounted but hidden and empty.
const visiblePanel = () =>
  document.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')

function SectionTabs({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('general')
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        onChange?.(next)
        setValue(next)
      }}
    >
      <TabsList aria-label="Sections">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members" disabled>
          Members
        </TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="general">General panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
    </Tabs>
  )
}

test('Tabs expose tablist semantics and move with arrow keys', async () => {
  const onChange = vi.fn()
  await render(<SectionTabs onChange={onChange} />)

  const [general, members, billing] = byRole('tab')
  expect(byRole('tablist')[0]?.getAttribute('aria-label')).toBe('Sections')
  expect(general.getAttribute('aria-selected')).toBe('true')
  const panel = visiblePanel()
  expect(panel?.textContent).toBe('General panel')
  expect(panel?.getAttribute('aria-labelledby')).toBe(general.id)

  await act(async () => general.focus())
  // Roving focus: only the focused tab stays in the Tab order.
  expect(general.tabIndex).toBe(0)
  expect(billing.tabIndex).toBe(-1)
  // ArrowRight skips the disabled tab and activates the next one on focus.
  await press('ArrowRight', general)
  expect(document.activeElement).toBe(billing)
  expect(members.getAttribute('aria-selected')).toBe('false')
  expect(onChange).toHaveBeenLastCalledWith('billing')
  expect(billing.getAttribute('aria-selected')).toBe('true')
  expect(visiblePanel()?.textContent).toBe('Billing panel')

  await press('Home', billing)
  expect(document.activeElement).toBe(general)
  expect(onChange).toHaveBeenLastCalledWith('general')
})

test('the segmented Tabs variant keeps tab semantics', async () => {
  await render(
    <Tabs defaultValue="a">
      <TabsList variant="segmented" aria-label="Mode">
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>,
  )
  expect(byRole('tablist')[0]?.dataset.variant).toBe('segmented')
  const [, second] = byRole('tab')
  await act(async () => byRole('tab')[0].focus())
  await press('ArrowRight')
  expect(document.activeElement).toBe(second)
  expect(visiblePanel()?.textContent).toBe('Panel B')
})

function ViewSwitch({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState<'grid' | 'list'>('grid')
  return (
    <SegmentedControl
      aria-label="View"
      iconOnly
      value={value}
      onValueChange={(next) => {
        onChange(next)
        setValue(next)
      }}
      options={[
        { value: 'grid', label: 'Grid', icon: <svg /> },
        { value: 'list', label: 'List', icon: <svg /> },
      ]}
    />
  )
}

test('SegmentedControl is a named radio group that keeps one choice', async () => {
  const onChange = vi.fn()
  await render(<ViewSwitch onChange={onChange} />)

  const group = byRole('radiogroup')[0]
  expect(group.getAttribute('aria-label')).toBe('View')
  const [grid, list] = byRole('radio')
  // Icon-only items stay named, and the choice is not shown by colour alone.
  expect(grid.getAttribute('aria-label')).toBe('Grid')
  expect(grid.getAttribute('aria-checked')).toBe('true')
  expect(list.getAttribute('aria-checked')).toBe('false')

  // Pressing the chosen item again must not clear the selection.
  await act(async () => grid.click())
  expect(onChange).not.toHaveBeenCalled()
  expect(grid.getAttribute('aria-checked')).toBe('true')

  // Radio semantics: arrow keys move the focus and the choice together.
  await act(async () => grid.focus())
  await press('ArrowRight', grid)
  expect(document.activeElement).toBe(list)
  expect(onChange).toHaveBeenCalledWith('list')
  expect(list.getAttribute('aria-checked')).toBe('true')
  expect(grid.getAttribute('aria-checked')).toBe('false')
})

test('a text SegmentedControl takes form-field attributes and fills its row', async () => {
  const onChange = vi.fn()
  await render(
    <SegmentedControl
      id="mode-field"
      aria-labelledby="mode-label"
      aria-describedby="mode-help"
      fullWidth
      value="token"
      onValueChange={onChange}
      options={[
        { value: 'token', label: 'Token size' },
        { value: 'delimiter', label: 'Delimiters', disabled: true },
      ]}
    />,
  )
  const group = byRole('radiogroup')[0]
  // FormControl passes the field's id and description to the group.
  expect(group.id).toBe('mode-field')
  expect(group.getAttribute('aria-labelledby')).toBe('mode-label')
  expect(group.getAttribute('aria-describedby')).toBe('mode-help')
  expect(group.className).toContain('w-full')
  const [token, delimiter] = byRole('radio')
  expect(token.textContent).toBe('Token size')
  expect(token.hasAttribute('aria-label')).toBe(false)
  expect(token.className).toContain('flex-1')
  expect((delimiter as HTMLButtonElement).disabled).toBe(true)
  await act(async () => delimiter.click())
  expect(onChange).not.toHaveBeenCalled()
})
