// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type {
  Environment,
  EnvironmentSummary,
  EnvironmentVariable,
} from '@/types/api'
import {
  byRole,
  createReactHarness,
} from '@/components/ui/__tests__/helpers/react-harness'
import { NewEnvironmentManager } from '../NewEnvironmentManager'

const summary = (
  id: string,
  name: string,
  extra: Partial<EnvironmentSummary> = {},
): EnvironmentSummary => ({
  id,
  tenant_id: 't',
  name,
  is_default: false,
  is_global: false,
  status: '1',
  variables_count: 1,
  create_time: 0,
  update_time: 0,
  create_date: '',
  update_date: '',
  ...extra,
})

const variable: EnvironmentVariable = {
  id: 'var-1',
  environment_id: 'env-1',
  key_name: 'token',
  key_value: 'secret-value',
  description: '',
  is_secret: true,
  variable_type: 'string',
  status: '1',
  create_time: 0,
  update_time: 0,
  create_date: '',
  update_date: '',
  key: 'token',
  value: 'secret-value',
}

const environments = [
  summary('env-1', 'Production', {
    is_default: true,
    base_url: 'https://api.prod.test',
  }),
  summary('env-2', 'dxl-193'),
]
// Stable objects, as React Query would return them.
const details: Record<string, Environment> = Object.fromEntries(
  environments.map((env) => [
    env.id,
    {
      ...env,
      variables: env.id === 'env-1' ? [variable] : [],
    } as Environment,
  ]),
)

const api = vi.hoisted(() => ({
  createEnvironment: vi.fn(),
  updateEnvironment: vi.fn(),
  deleteEnvironment: vi.fn(),
  duplicateEnvironment: vi.fn(),
  addVariable: vi.fn(),
  updateVariable: vi.fn(),
  deleteVariable: vi.fn(),
  fetchEnvironment: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/hooks/use-environment-request', () => ({
  useFetchEnvironments: () => ({ environments }),
  useFetchGlobalEnvironments: () => ({ globalEnvironments: [] }),
  useFetchEnvironment: (id: string | null) => {
    api.fetchEnvironment(id)
    return { environment: (id && details[id]) || null }
  },
  useCreateEnvironment: () => ({ createEnvironment: api.createEnvironment }),
  useUpdateEnvironment: () => ({ updateEnvironment: api.updateEnvironment }),
  useDeleteEnvironment: () => ({
    deleteEnvironment: api.deleteEnvironment,
    isLoading: false,
  }),
  useDuplicateEnvironment: () => ({
    duplicateEnvironment: api.duplicateEnvironment,
    isLoading: false,
  }),
  useEnvironmentVariableMutations: () => ({
    addVariable: api.addVariable,
    updateVariable: api.updateVariable,
    deleteVariable: api.deleteVariable,
  }),
}))

const harness = createReactHarness()

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  // Radix Switch measures its thumb.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
  api.createEnvironment.mockResolvedValue({ ...details['env-2'], id: 'env-3' })
  api.deleteEnvironment.mockResolvedValue(undefined)
  api.deleteVariable.mockResolvedValue(undefined)
  await harness.render(<NewEnvironmentManager isOpen onClose={() => {}} />)
})
afterEach(async () => {
  await harness.cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const buttons = () => Array.from(document.querySelectorAll('button'))
const button = (name: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll('button')).find(
    (node) =>
      node.getAttribute('aria-label') === name ||
      node.textContent?.trim() === name,
  ) as HTMLButtonElement
const field = (label: string) =>
  document.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!
const click = (node: HTMLElement) => act(async () => node.click())
async function type(
  node: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const proto = Object.getPrototypeOf(node) as object
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(node, value)
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const alert = () => document.querySelector<HTMLElement>('[role="alertdialog"]')

it('opens the default environment and colours environments by name', async () => {
  expect(field('Environment name').value).toBe('Production')
  const rows = Array.from(
    document.querySelectorAll<HTMLButtonElement>('nav li > button'),
  )
  expect(rows.map((row) => row.textContent)).toEqual([
    'ProductionDefaulthttps://api.prod.test',
    'dxl-1931 variable',
  ])
  expect(rows[0].getAttribute('aria-current')).toBe('true')
  expect(rows[0].querySelector('[aria-hidden="true"]')?.className).toContain(
    'bg-status-error',
  )
  expect(rows[1].querySelector('[aria-hidden="true"]')?.className).toContain(
    'bg-data-viz-categorical-2',
  )
  // The default environment cannot be deleted.
  await click(button('More actions for Production'))
  await vi.waitFor(() => expect(byRole('menu')).toHaveLength(1))
  expect(byRole('menuitem').map((item) => item.textContent)).toEqual([
    'Duplicate',
  ])
})

it('deletes an environment only after confirming', async () => {
  await click(button('More actions for dxl-193'))
  await vi.waitFor(() => expect(byRole('menuitem')).toHaveLength(2))
  await click(byRole('menuitem')[1])
  await vi.waitFor(() => expect(alert()).not.toBeNull())
  expect(alert()!.textContent).toContain('Delete the environment “dxl-193”?')
  expect(api.deleteEnvironment).not.toHaveBeenCalled()
  await click(button('Delete', alert()!))
  expect(api.deleteEnvironment).toHaveBeenCalledWith('env-2')
  await vi.waitFor(() => expect(alert()).toBeNull())
})

it('asks before discarding unsaved changes', async () => {
  await type(field('Environment name'), 'Production EU')
  const row = buttons().find((node) => node.textContent?.startsWith('dxl-193'))!
  await click(row)
  await vi.waitFor(() =>
    expect(alert()?.textContent).toContain('Discard unsaved changes?'),
  )
  await click(button('Cancel', alert()!))
  await vi.waitFor(() => expect(alert()).toBeNull())
  expect(field('Environment name').value).toBe('Production EU')

  await click(row)
  await vi.waitFor(() => expect(alert()).not.toBeNull())
  await click(button('Discard changes', alert()!))
  await vi.waitFor(() =>
    expect(field('Environment name').value).toBe('dxl-193'),
  )
})

it('confirms before deleting a saved variable', async () => {
  // Secret values stay masked until revealed.
  expect(document.body.textContent).toContain('••••••••')
  expect(document.body.textContent).not.toContain('secret-value')
  await click(button('Show the value of token'))
  expect(document.body.textContent).toContain('secret-value')

  await click(button('Delete token'))
  await vi.waitFor(() =>
    expect(alert()?.textContent).toContain('Delete the variable “token”?'),
  )
  expect(api.deleteVariable).not.toHaveBeenCalled()
  await click(button('Delete', alert()!))
  expect(api.deleteVariable).toHaveBeenCalledWith('env-1', 'var-1')
})

it('creates an environment with local variables, resolves them, then opens it', async () => {
  await click(button('New environment'))
  expect(field('Environment name').value).toBe('')
  await type(field('Environment name'), 'staging')
  // A staging name turns the dot to the warning colour while typing.
  expect(
    document.querySelector('header [aria-hidden="true"]')?.className,
  ).toContain('bg-status-warning')

  await click(button('Add variable'))
  const dialog = () =>
    Array.from(document.querySelectorAll('dialog')).find((node) =>
      node.textContent?.includes('Add environment variable'),
    )!
  const input = (placeholder: string) =>
    dialog().querySelector<HTMLInputElement>(
      `input[placeholder="${placeholder}"]`,
    )!
  await type(input('Variable name, e.g. bearer_token'), 'host')
  await type(input('Value'), 'example.test')
  await click(button('Save', dialog()))
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('example.test'),
  )

  await click(button('Test resolution'))
  const textarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[placeholder*="{{server_ip}}"]',
  )!
  await type(textarea, 'https://{{host}}/{{port}}')
  await click(button('Resolve'))
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(
      'https://example.test/{{port}}',
    ),
  )
  expect(document.body.textContent).toContain('Missing variables')
  const preview = Array.from(document.querySelectorAll('dialog')).find((node) =>
    node.textContent?.includes('Variable resolution preview'),
  )!
  await click(button('Close', preview))

  await click(button('Create'))
  expect(api.createEnvironment).toHaveBeenCalledWith({
    name: 'staging',
    description: '',
    base_url: '',
    is_default: false,
    is_global: false,
    variables: [
      {
        key_name: 'host',
        key_value: 'example.test',
        description: '',
        is_secret: false,
        variable_type: 'string',
      },
    ],
  })
  await vi.waitFor(() =>
    expect(api.fetchEnvironment).toHaveBeenLastCalledWith('env-3'),
  )
})
