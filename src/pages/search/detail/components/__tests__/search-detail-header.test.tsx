import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchDetailHeader from '../search-detail-header'

describe('Search detail capability actions', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('exposes accessible share and session export actions', async () => {
    const onShare = vi.fn()
    const onExport = vi.fn()

    await act(async () => {
      root.render(
        <SearchDetailHeader
          appName="检索应用"
          kbCount={2}
          phaseLabel="完成"
          hasTurns={true}
          canOpenMindmap={false}
          mindmapOpen={false}
          settingsOpen={false}
          canExport={true}
          exportLabel="导出当前会话"
          exportDisabledReason="搜索进行中，完成后可导出"
          onBack={vi.fn()}
          onClear={vi.fn()}
          onToggleMindmap={vi.fn()}
          onShare={onShare}
          onExport={onExport}
          onToggleSettings={vi.fn()}
        />,
      )
    })

    expect(
      container.querySelector('[aria-label="返回搜索列表"]'),
    ).not.toBeNull()
    const shareButton =
      container.querySelector<HTMLButtonElement>('[title="复制分享链接"]')
    expect(shareButton).not.toBeNull()

    await act(async () => shareButton?.click())
    expect(onShare).toHaveBeenCalledOnce()

    const exportButton = container.querySelector<HTMLButtonElement>(
      '[aria-label="导出当前会话"]',
    )
    expect(exportButton?.disabled).toBe(false)
    await act(async () => exportButton?.click())
    expect(onExport).toHaveBeenCalledOnce()
  })

  it('disables export while the current session is streaming', async () => {
    const onExport = vi.fn()

    await act(async () => {
      root.render(
        <SearchDetailHeader
          appName="检索应用"
          kbCount={2}
          phaseLabel="总结中"
          hasTurns={true}
          canOpenMindmap={false}
          mindmapOpen={false}
          settingsOpen={false}
          canExport={false}
          exportLabel="导出当前会话"
          exportDisabledReason="搜索进行中，完成后可导出"
          onBack={vi.fn()}
          onClear={vi.fn()}
          onToggleMindmap={vi.fn()}
          onShare={vi.fn()}
          onExport={onExport}
          onToggleSettings={vi.fn()}
        />,
      )
    })

    const exportButton = container.querySelector<HTMLButtonElement>(
      '[aria-label="导出当前会话"]',
    )
    expect(exportButton?.disabled).toBe(true)
    expect(exportButton?.title).toBe('搜索进行中，完成后可导出')
    const reasonId = exportButton?.getAttribute('aria-describedby')
    expect(reasonId).toBeTruthy()
    expect(document.getElementById(reasonId ?? '')?.textContent).toBe(
      '搜索进行中，完成后可导出',
    )
    await act(async () => exportButton?.click())
    expect(onExport).not.toHaveBeenCalled()
  })
})
