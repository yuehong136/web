import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adaptAgentFlow } from '../../adapters'
import { agentAPI } from '@/api/agent'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import enAgent from '@/locales/en-US/agent'
import zhAgent from '@/locales/zh-CN/agent'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ShareEmbedDialog } from '../share-embed-dialog'
import { buildAgentWidgetShareUrl, parseAgentShareAccess } from '../access'
import {
  defaultWidgetSettings,
  normalizeWidgetSettings,
  normalizeWidgetFooterLink,
  widgetSettingsGlobalKey,
} from '../widget-settings'
import { WidgetShell } from '../widget-shell'
import { playWidgetSound } from '../widget-sound'
import { useWidgetSettings } from '../use-widget-settings'

const i18n = createInstance()
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient
const saved = {
  ...defaultWidgetSettings,
  embedType: 'widget' as const,
  theme: 'dark' as const,
  visibleAvatar: false,
  published: true,
  locale: 'en-US',
  userId: 'external & user',
  widgetTitle: 'Help & 帮助 <script>',
  widgetSubtitle: 'Ready?',
  widgetFooterText: 'Contact us',
  widgetFooterLink: 'https://example.test/?a=1&b=2',
  widgetAccentColor: '#abc',
  muteWidget: true,
  enableStreaming: true,
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await i18n.init({
    lng: 'en-US',
    resources: {
      'en-US': { translation: enAgent },
      'zh-CN': { translation: zhAgent },
    },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  queryClient.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function render(children: React.ReactNode) {
  return act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>,
    ),
  )
}
function button(label: string) {
  const value = [...document.querySelectorAll('button')].find(
    (node) => node.textContent === label,
  )
  expect(value).toBeTruthy()
  return value!
}

it('round trips encoded text, colors and common access fields from generated widget URLs', () => {
  const url = buildAgentWidgetShareUrl({
    agentId: 'test',
    betaToken: 'fixture',
    origin: 'https://example.test',
    theme: saved.theme,
    locale: saved.locale,
    userId: saved.userId,
    visibleAvatar: false,
    release: true,
    streaming: true,
    widgetSettings: saved,
  })
  const access = parseAgentShareAccess(new URL(url).searchParams)
  expect(access).toMatchObject({
    release: true,
    visibleAvatar: false,
    userId: saved.userId,
    theme: 'dark',
    streaming: true,
    locale: 'en-US',
  })
  expect(access.widgetSettings).toMatchObject({
    widgetTitle: saved.widgetTitle,
    widgetFooterLink: saved.widgetFooterLink,
    widgetAccentColor: '#abc',
    muteWidget: true,
  })
})
it.each([
  'javascript:alert(1)',
  'data:text/html,hello',
  'mailto:x@y.test',
  'java\nscript:alert(1)',
  'https://user:pass@example.test',
])('rejects unsafe footer %s', (url) =>
  expect(normalizeWidgetFooterLink(url)).toBe(''),
)
it('normalizes hostnames, malformed data and color fallback', () => {
  expect(normalizeWidgetFooterLink('example.test/path')).toBe(
    'https://example.test/path',
  )
  expect(
    normalizeWidgetSettings({
      widgetAccentColor: 'url(evil)',
      widgetTextColor: ' #123 ',
      muteWidget: 'true',
      locale: 'unknown',
    }),
  ).toMatchObject({
    widgetAccentColor: '#2563eb',
    widgetTextColor: '#123',
    muteWidget: false,
    locale: '',
  })
  expect(normalizeWidgetSettings(null)).toEqual(defaultWidgetSettings)
})
it.each(['en-US', 'zh-CN'])(
  'saves full form, reopens and reloads without dropping setup fields in %s',
  async (language) => {
    await i18n.changeLanguage(language)
    const onSave = vi.fn(async () => undefined)
    function Dialog() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button onClick={() => setOpen(true)}>Reopen</button>
          {open && (
            <ShareEmbedDialog
              open
              onOpenChange={setOpen}
              agentId="test"
              title="Test"
              betaToken="fixture"
              initialWidgetSettings={saved}
              onRefreshToken={() => {}}
              onSaveWidgetSettings={onSave}
            />
          )}
        </>
      )
    }
    await render(<Dialog />)
    await act(async () =>
      button(i18n.t('agent.shareEmbed.saveSettings')).click(),
    )
    expect(onSave).toHaveBeenCalledWith(saved)
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
        ?.click(),
    )
    // An actual unmount/remount covers the editor's conditional dialog mount.
    await act(async () => root.render(null))
    await render(<Dialog />)
    expect(
      document.querySelector<HTMLInputElement>('#widgetTitle')?.value,
    ).toBe(saved.widgetTitle)
    await act(async () =>
      button(i18n.t('agent.shareEmbed.saveSettings')).click(),
    )
    expect(onSave).toHaveBeenLastCalledWith(saved)
  },
)
it('reports a rejected save without losing form edits', async () => {
  const onSave = vi
    .fn()
    .mockRejectedValue(new Error('private transport detail'))
  await render(
    <ShareEmbedDialog
      open
      onOpenChange={() => {}}
      agentId="test"
      title="Test"
      betaToken="fixture"
      initialWidgetSettings={saved}
      onRefreshToken={() => {}}
      onSaveWidgetSettings={onSave}
    />,
  )
  await act(async () => button(i18n.t('agent.shareEmbed.saveSettings')).click())
  expect(document.querySelector<HTMLInputElement>('#widgetTitle')?.value).toBe(
    saved.widgetTitle,
  )
  expect(document.body.textContent).not.toContain('private transport detail')
})
it('renders untrusted titles and unsafe footers as text', async () => {
  const settings = normalizeWidgetSettings({
    ...saved,
    widgetFooterLink: 'javascript:alert(1)',
  })
  await render(
    <WidgetShell title="Agent" settings={settings}>
      <div>Chat</div>
    </WidgetShell>,
  )
  expect(container.querySelector('header')?.textContent).toContain(
    saved.widgetTitle,
  )
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('footer a')).toBeNull()
})
it('mute avoids audio allocation; unmuted playback closes its context', () => {
  const close = vi.fn().mockResolvedValue(undefined)
  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
    onended: undefined as undefined | (() => void),
  }
  const AudioContext = vi.fn(function () {
    return {
      createOscillator: () => oscillator,
      createGain: () => ({
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }),
      currentTime: 1,
      destination: {},
      close,
    }
  })
  vi.stubGlobal('AudioContext', AudioContext)
  playWidgetSound(true)
  expect(AudioContext).not.toHaveBeenCalled()
  playWidgetSound(false)
  expect(oscillator.start).toHaveBeenCalledTimes(1)
  oscillator.onended?.()
  expect(close).toHaveBeenCalledTimes(1)
})
it('persists through the real mutation contract while retaining graph, globals and publish state', async () => {
  const baseDsl = {
    graph: { nodes: [], edges: [] },
    components: {},
    globals: { 'sys.query': 'retained' },
    variables: {},
  }
  queryClient.setQueryData(agentQueryKeys.detail('test'), {
    id: 'test',
    title: 'Test',
    dsl: baseDsl,
    release: true,
  })
  let persisted: unknown = baseDsl
  const setAgent = vi
    .spyOn(agentAPI, 'setAgent')
    .mockImplementation(async (payload) => {
      persisted = payload.dsl
      return adaptAgentFlow(true)
    })
  vi.spyOn(agentAPI, 'fetchAgent').mockImplementation(async () =>
    adaptAgentFlow({
      id: 'test',
      title: 'Test',
      release: false,
      dsl: persisted,
    }),
  )
  let save: ReturnType<typeof useWidgetSettings> | undefined
  function Probe() {
    save = useWidgetSettings('test', 'Test')
    return null
  }
  // useBuildDslData resolves the asset ID from the router.
  const { MemoryRouter, Route, Routes } = await import('react-router-dom')
  await render(
    <MemoryRouter initialEntries={['/agent/test']}>
      <Routes>
        <Route path="/agent/:id" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
  await act(async () => save!.saveWidgetSettings(saved))
  const payload = setAgent.mock.calls[0][0]
  expect(payload).not.toHaveProperty('release')
  expect(payload.dsl).toMatchObject({
    globals: {
      'sys.query': 'retained',
      [widgetSettingsGlobalKey]: saved,
    },
  })
  expect(queryClient.getQueryData(agentQueryKeys.detail('test'))).toMatchObject(
    { dsl: { globals: { [widgetSettingsGlobalKey]: saved } } },
  )
})
