import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorHeader } from '../editor-header'
import type { CreateAppPageController } from '../../hooks/use-create-app-page'

describe('Studio editor capability actions', () => {
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

  it('keeps the real save action and hides the unavailable publish action', async () => {
    const handleSave = vi.fn()
    const controller = {
      config: {
        name: '测试应用',
        description: '测试描述',
        icon: '',
      },
      saving: false,
      handleEditApp: vi.fn(),
      handleSave,
    } as unknown as CreateAppPageController

    await act(async () => {
      root.render(<EditorHeader controller={controller} onBack={vi.fn()} />)
    })

    expect(container.textContent).not.toContain('发布')
    expect(
      container.querySelector('[aria-label="编辑应用信息"]'),
    ).not.toBeNull()
    const saveButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '保存',
    )
    expect(saveButton).toBeDefined()

    await act(async () => saveButton?.click())
    expect(handleSave).toHaveBeenCalledOnce()
  })
})
