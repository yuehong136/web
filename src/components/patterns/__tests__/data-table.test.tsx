import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { DataTable, type DataTableColumn } from '../data-table'
import { byLabel, click, mount } from './collection-test-utils'

interface Doc {
  id: string
  name: string
  chunks: number
}
const docs: Doc[] = [
  { id: 'a', name: 'a.pdf', chunks: 3 },
  { id: 'b', name: 'b.docx', chunks: 42 },
]
const columns: DataTableColumn<Doc>[] = [
  { key: 'name', header: 'Name', cell: (doc) => doc.name },
  {
    key: 'chunks',
    header: 'Chunks',
    cell: (doc) => doc.chunks,
    align: 'end',
    width: '5rem',
    hideBelow: 'md',
  },
]

let view: ReturnType<typeof mount>
beforeEach(async () => {
  await changeLanguage('en-US')
  view = mount()
})
afterEach(() => view.unmount())

function Selectable({
  initial,
  onChange,
  onRowClick,
}: {
  initial: string[]
  onChange?: (ids: string[]) => void
  onRowClick?: (doc: Doc) => void
}) {
  const [selected, setSelected] = useState(initial)
  return (
    <DataTable
      label="Documents"
      columns={columns}
      rows={docs}
      getRowId={(doc) => doc.id}
      selection={{
        selectedIds: selected,
        onSelectedIdsChange: (ids) => {
          setSelected(ids)
          onChange?.(ids)
        },
        rowLabel: (doc) => `Select ${doc.name}`,
      }}
      rowActions={(doc) => <button type="button">Open {doc.name}</button>}
      onRowClick={onRowClick}
      activeRowId="b"
    />
  )
}

const checkbox = (label: string) => byLabel(view.container, label)!

it('selects rows and the page while keeping ids selected on other pages', async () => {
  const onChange = vi.fn()
  await view.render(<Selectable initial={['elsewhere']} onChange={onChange} />)
  const all = checkbox('Select all rows on this page')
  expect(all.getAttribute('aria-checked')).toBe('false')

  await click(checkbox('Select a.pdf'))
  expect(onChange).toHaveBeenLastCalledWith(['elsewhere', 'a'])
  expect(all.getAttribute('aria-checked')).toBe('mixed')
  expect(
    view.container.querySelector('tr[data-state="selected"]')?.textContent,
  ).toContain('a.pdf')

  await click(all)
  expect(new Set(onChange.mock.lastCall![0])).toEqual(
    new Set(['elsewhere', 'a', 'b']),
  )
  expect(all.getAttribute('aria-checked')).toBe('true')

  await click(all)
  expect(onChange).toHaveBeenLastCalledWith(['elsewhere'])
  await click(checkbox('Select b.docx'))
  await click(checkbox('Select b.docx'))
  expect(onChange).toHaveBeenLastCalledWith(['elsewhere'])
})

it('opens rows from the pointer but not from controls inside them', async () => {
  const onRowClick = vi.fn()
  await view.render(<Selectable initial={[]} onRowClick={onRowClick} />)
  const cells = view.container.querySelectorAll('tbody td')
  await click(cells[1])
  expect(onRowClick).toHaveBeenCalledWith(docs[0])
  await click(checkbox('Select a.pdf'))
  await click(
    [...view.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Open a.pdf',
    )!,
  )
  expect(onRowClick).toHaveBeenCalledOnce()
  expect(
    view.container.querySelector('tr[aria-current="true"]')?.textContent,
  ).toContain('b.docx')
})

it('labels the table, hides the actions header visually and aligns numbers', async () => {
  await view.render(<Selectable initial={[]} />)
  const table = view.container.querySelector('table')!
  expect(table.getAttribute('aria-label')).toBe('Documents')
  const headers = [...table.querySelectorAll('th')]
  expect(headers.at(-1)?.querySelector('.sr-only')?.textContent).toBe('Actions')
  expect(headers[2].className).toContain('text-right')
  expect(headers[2].className).toContain('hidden md:table-cell')
  expect(headers[2].getAttribute('style')).toContain('width: 5rem')
})

it('spans the empty state across every column', async () => {
  await view.render(
    <DataTable
      label="Documents"
      columns={columns}
      rows={[]}
      getRowId={(doc: Doc) => doc.id}
      selection={{
        selectedIds: [],
        onSelectedIdsChange: vi.fn(),
        rowLabel: (doc: Doc) => doc.name,
      }}
      rowActions={() => null}
    />,
  )
  const cell = view.container.querySelector('tbody td')!
  expect(cell.getAttribute('colspan')).toBe('4')
  expect(cell.textContent).toBe('No data')
  expect(
    (checkbox('Select all rows on this page') as HTMLButtonElement).disabled,
  ).toBe(true)

  await view.render(
    <DataTable
      label="Documents"
      columns={columns}
      rows={[]}
      getRowId={(doc: Doc) => doc.id}
      emptyState={<p>Upload a document</p>}
    />,
  )
  expect(view.container.querySelector('tbody td')?.textContent).toBe(
    'Upload a document',
  )
})
