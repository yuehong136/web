import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { AgentCanvasType, type AgentFlow } from '@/types/agent'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
} from '../../features/runtime-workbench/types'
import { PipelineWorkbenchView } from '../../features/pipeline-workbench/types'
import { EditorRuntimeRail } from '../editor-runtime-rail'

// The rail consumes only these enums; the workbench dialogs are separate surfaces.
vi.mock(
  '@/pages/agent/features/runtime-workbench',
  async () => import('@/pages/agent/features/runtime-workbench/types'),
)
vi.mock(
  '@/pages/agent/features/pipeline-workbench',
  async () => import('@/pages/agent/features/pipeline-workbench/types'),
)

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
type RailProps = ComponentProps<typeof EditorRuntimeRail>
let root: Root
let host: HTMLDivElement
let props: RailProps

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  props = {
    editorMode: 'agent',
    runtimeSummary: {
      status: AgentRuntimeStatus.IDLE,
      currentView: RuntimeWorkbenchView.RUN,
      messageCount: 0,
      hasLogs: false,
    },
    onOpenRuntime: vi.fn(),
    onOpenExplore: vi.fn(),
    onOpenVersions: vi.fn(),
    onOpenWebhook: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenShare: vi.fn(),
    onOpenVariables: vi.fn(),
  }
})
afterEach(async () => {
  await act(async () => {
    root.unmount()
    await setProductLanguage('zh-CN')
  })
  host.remove()
})

async function render(patch: Partial<RailProps> = {}) {
  props = { ...props, ...patch }
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <EditorRuntimeRail {...props} />
      </I18nextProvider>,
    ),
  )
}
const language = (locale: 'en-US' | 'zh-CN') =>
  act(async () => {
    await setProductLanguage(locale)
  })
function button(label: string) {
  const element = [...host.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  )
  expect(element, label).toBeDefined()
  return element!
}
const expectNoKeys = () =>
  expect(host.textContent).not.toMatch(
    /agent\.(?:editorRuntimeRail|embedRail|runtime|unnamedAsset|editor)\./,
  )

it('switches the mounted rail and its empty fallbacks between English and Chinese', async () => {
  await language('en-US')
  await render()
  expect(
    [...host.querySelectorAll('h3')].map((item) => item.textContent),
  ).toEqual([
    'Current asset',
    'Runtime Workbench',
    'Delivery and debug',
    'Recent activity',
  ])
  expect(host.textContent).toContain('Untitled asset')
  expect(host.textContent).toContain(
    'Orchestrate conversations, tool calls, and delivery actions.',
  )
  expect(host.textContent).toContain('not saved yet')
  expect(host.textContent).toContain('Waiting for the first run')
  expect(host.textContent).not.toMatch(/[\u4e00-\u9fff]/)
  expect(button('View node logs').disabled).toBe(true)
  const open = button('Open workbench')
  await act(async () => open.click())
  expect(props.onOpenRuntime).toHaveBeenCalledExactlyOnceWith(
    RuntimeWorkbenchView.RUN,
  )

  await language('zh-CN')
  expect(
    [...host.querySelectorAll('h3')].map((item) => item.textContent),
  ).toEqual(['当前资产', '运行工作台', '交付与调试', '最近活动'])
  expect(host.textContent).toContain('未命名资产')
  expect(host.textContent).toContain('待首次保存')
  expect(host.textContent).toContain('等待首次运行')
  expect(button('打开工作台')).toBe(open)
  expect(props.onOpenRuntime).toHaveBeenCalledTimes(1)
  await act(async () => button('继续会话').click())
  expect(props.onOpenRuntime).toHaveBeenLastCalledWith(
    RuntimeWorkbenchView.CONVERSATION,
  )
  await act(async () => button('分享').click())
  expect(props.onOpenShare).toHaveBeenCalledTimes(1)
  expectNoKeys()
})

it('translates every runtime status while STOPPED remains output disconnected', async () => {
  const statuses = [
    [AgentRuntimeStatus.IDLE, 'Idle', '待运行'],
    [AgentRuntimeStatus.PREPARING, 'Preparing', '准备中'],
    [AgentRuntimeStatus.RUNNING, 'Running', '运行中'],
    [AgentRuntimeStatus.SUCCESS, 'Completed', '已完成'],
    [AgentRuntimeStatus.ERROR, 'Failed', '失败'],
    [AgentRuntimeStatus.STOPPED, 'Output disconnected', '已断开输出'],
  ] as const
  for (const [locale, labelIndex] of [
    ['en-US', 1],
    ['zh-CN', 2],
  ] as const) {
    await language(locale)
    for (const row of statuses) {
      await render({
        runtimeSummary: { ...props.runtimeSummary, status: row[0] },
      })
      expect(
        [...host.querySelectorAll('div')].some(
          (item) => item.textContent === row[labelIndex],
        ),
      ).toBe(true)
      expectNoKeys()
    }
    expect(host.textContent).not.toContain(
      locale === 'en-US' ? 'Stopped' : '已停止',
    )
  }
})

it('preserves supplied asset, autosave and runtime content while localizing date labels', async () => {
  const timestamp = 1_720_000_000_000
  const flow: AgentFlow = {
    id: 'user-flow',
    title: '用户 Agent 标题',
    description: '模型与用户数据保持原文',
    canvas_type: AgentCanvasType.AGENT,
    create_time: timestamp,
    update_time: timestamp,
    user_id: 'user',
    permission: 'me',
    dsl: {
      components: {},
      history: [],
      graph: { nodes: [], edges: [] },
      messages: [],
      reference: [],
      globals: {},
      retrieval: [],
    },
  }
  await language('en-US')
  await render({
    flow,
    autosaveLabel: '自定义保存说明',
    runtimeSummary: {
      ...props.runtimeSummary,
      lastRunAt: timestamp,
      lastError: '原始工具输出',
      hasLogs: true,
    },
  })
  for (const text of [
    flow.title,
    flow.description,
    '自定义保存说明',
    '原始工具输出',
  ])
    expect(host.textContent).toContain(text)
  const formatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
  expect(host.textContent).toContain(`Last updated: ${formatted}`)
  expect(host.textContent).toContain(`Last run: ${formatted}`)
  expect(button('View node logs').disabled).toBe(false)
  await act(async () => button('View node logs').click())
  expect(props.onOpenRuntime).toHaveBeenCalledExactlyOnceWith(
    RuntimeWorkbenchView.LOG,
  )
  await language('zh-CN')
  for (const text of [
    flow.title,
    flow.description,
    '自定义保存说明',
    '原始工具输出',
  ])
    expect(host.textContent).toContain(text)
  expect(host.textContent).toContain('最近更新时间：')
  expect(host.textContent).toContain('最近一次运行：')
  expectNoKeys()
})

it('localizes pipeline availability and preserves its distinct action targets', async () => {
  await language('en-US')
  const summary = {
    status: AgentRuntimeStatus.IDLE,
    currentView: PipelineWorkbenchView.RUN,
    messageCount: 3,
    hasLogs: false,
    outputAvailable: false,
  }
  await render({ editorMode: 'pipeline', runtimeSummary: summary })
  expect(host.textContent).toContain('Pipeline Workbench')
  expect(host.textContent).toContain(
    'Upload documents to trigger the dataflow, then inspect the logs and outputs.',
  )
  expect(host.textContent).toContain(
    'Run logs and outputs appear after you upload documents.',
  )
  expect(button('View dataflow timeline').disabled).toBe(true)
  expect(button('View result / END output').disabled).toBe(true)
  expect(host.textContent).not.toContain('Delivery and debug')
  await act(async () => button('Upload and run Pipeline').click())
  expect(props.onOpenRuntime).toHaveBeenLastCalledWith(
    PipelineWorkbenchView.RUN,
  )
  await render({
    runtimeSummary: { ...summary, hasLogs: true, outputAvailable: true },
  })
  expect(host.textContent).toContain('Can download')
  expect(button('View dataflow timeline').disabled).toBe(false)
  await act(async () => button('View dataflow timeline').click())
  expect(props.onOpenRuntime).toHaveBeenLastCalledWith(
    PipelineWorkbenchView.LOG,
  )
  await render({
    runtimeSummary: {
      ...summary,
      hasLogs: true,
      outputAvailable: true,
      resultPath: '/result',
    },
  })
  expect(host.textContent).toContain('Can open')
  await act(async () => button('View result / END output').click())
  expect(props.onOpenRuntime).toHaveBeenLastCalledWith(
    PipelineWorkbenchView.OUTPUT,
  )
  await language('zh-CN')
  expect(host.textContent).toContain('可跳转')
  expect(button('查看结果 / END 输出').disabled).toBe(false)
  expectNoKeys()
})
