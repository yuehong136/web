import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import type { SkillSpace } from '@/api/skill-types'
import type { CoreSpace } from '@/api/skill-core-types'
import { SkillSpacesPage } from '../skill-spaces-page'
import { CoreSpacesPage } from '../core/core-spaces-page'

const mock = vi.hoisted(() => ({
  spaces: vi.fn(),
  coreSpaces: vi.fn(),
  mutate: vi.fn(),
  coreMutate: vi.fn(),
}))
vi.mock('@/hooks/use-skill-request', () => ({
  useSkillSpaces: () => mock.spaces(),
  useSkillCapabilities: () => ({
    data: {
      backend: 'python',
      writable: true,
      storage_available: true,
      search_available: true,
      search_modes: ['keyword'],
    },
  }),
  useSkillAction: () => ({
    isPending: false,
    error: null,
    mutate: mock.mutate,
    requestKey: (key: string) => key,
  }),
  useSkillOperation: () => ({ data: undefined }),
}))
vi.mock('@/hooks/use-skill-core-request', () => ({
  useCoreSpaces: () => mock.coreSpaces(),
  useCoreSpace: () => ({ data: undefined }),
  useCoreAction: () => ({
    isPending: false,
    error: null,
    mutate: mock.coreMutate,
  }),
  skillCoreKeys: { spaces: () => ['core', 'spaces'] },
}))
vi.mock('../skill-space-dialog', () => ({
  SkillSpaceDialog: () => <p>space-dialog</p>,
}))
vi.mock('../skill-upload-dialog', () => ({ SkillUploadDialog: () => null }))
vi.mock('../core/core-space-dialog', () => ({
  CoreSpaceDialog: () => <p>core-space-dialog</p>,
}))
vi.mock('../core/core-import-dialog', () => ({ CoreImportDialog: () => null }))

const id = (char: string) => char.repeat(32)
const assetSpaces = [
  {
    id: id('a'),
    name: 'Writable space',
    description: 'Ours',
    backend_owner: 'python',
    state: 'active',
  },
  {
    id: id('b'),
    name: 'Other backend',
    description: 'Theirs',
    backend_owner: 'go',
    state: 'active',
  },
] as SkillSpace[]
let root: Root
let container: HTMLDivElement
const button = (text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent?.trim() === text,
  )
async function render(page: ReactNode) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/skills']}>{page}</MemoryRouter>,
    ),
  )
}

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('renders asset spaces as rows and bulk-deletes the selection through the confirm dialog', async () => {
  mock.spaces.mockReturnValue({
    data: { spaces: assetSpaces, total: 2 },
    isLoading: false,
    error: null,
  })
  await render(<SkillSpacesPage />)
  const rows = container.querySelectorAll('[data-slot="resource-row"]')
  expect(rows).toHaveLength(2)
  expect(rows[1].textContent).toContain('other backend')
  const boxes = container.querySelectorAll<HTMLButtonElement>(
    '[data-slot="resource-row"] [role="checkbox"]',
  )
  expect(boxes[1].disabled).toBe(true)
  expect(container.textContent).toContain('1–2 / 2')
  await act(async () => boxes[0].click())
  const bar = container.querySelector('[data-slot="bulk-action-bar"]')!
  expect(bar.textContent).toContain('1 selected')
  await act(async () => button('Delete', bar)!.click())
  const dialog = document.querySelector('[role="alertdialog"]')!
  expect(dialog.textContent).toContain('Delete these assets?')
  await act(async () => button('Delete', dialog)!.click())
  expect(mock.mutate).toHaveBeenCalledOnce()
})

it('keeps the core create action in the empty state only', async () => {
  mock.coreSpaces.mockReturnValue({
    data: { spaces: [] },
    isLoading: false,
    error: null,
  })
  await render(<CoreSpacesPage />)
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(button('Create space', header)).toBeUndefined()
  await act(async () => button('Create space', container)!.click())
  expect(container.textContent).toContain('core-space-dialog')
})

it('deletes a core space from its row menu after confirmation', async () => {
  mock.coreSpaces.mockReturnValue({
    data: {
      spaces: [
        {
          id: id('c'),
          name: 'Core library',
          folder_id: id('d'),
          tenant_id: id('e'),
          top_k: 10,
          status: 'active',
        },
      ] as CoreSpace[],
    },
    isLoading: false,
    error: null,
  })
  await render(<CoreSpacesPage />)
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Actions for Core library"]',
  )!
  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  const item = [
    ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ].find((element) => element.textContent === 'Delete')!
  await act(async () => item.click())
  const dialog = document.querySelector('[role="alertdialog"]')!
  await act(async () => button('Delete', dialog)!.click())
  expect(mock.coreMutate).toHaveBeenCalledOnce()
})
