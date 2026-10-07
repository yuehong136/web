import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorHeader } from '../editor-header'
import { setProductLanguage } from '@/locales/i18n'

describe('Studio editor capability actions', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    await setProductLanguage('zh-CN')
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
    }

    await act(async () => {
      root.render(
        <EditorHeader
          config={controller.config}
          saving={false}
          status="saved"
          onSave={handleSave}
          onEdit={controller.handleEditApp}
          onBack={vi.fn()}
        />,
      )
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
