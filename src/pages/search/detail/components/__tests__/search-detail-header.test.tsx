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

  it('does not expose export while preserving the real share action', async () => {
    const onShare = vi.fn()

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
          onBack={vi.fn()}
          onClear={vi.fn()}
          onToggleMindmap={vi.fn()}
          onShare={onShare}
          onToggleSettings={vi.fn()}
        />,
      )
    })

    expect(
      [...container.querySelectorAll('button')].some(
        (button) =>
          button.title === '导出' ||
          button.getAttribute('aria-label') === '导出' ||
          button.textContent?.includes('导出'),
      ),
    ).toBe(false)
    expect(
      container.querySelector('[aria-label="返回搜索列表"]'),
    ).not.toBeNull()
    const shareButton =
      container.querySelector<HTMLButtonElement>('[title="复制分享链接"]')
    expect(shareButton).not.toBeNull()

    await act(async () => shareButton?.click())
    expect(onShare).toHaveBeenCalledOnce()
  })
})
