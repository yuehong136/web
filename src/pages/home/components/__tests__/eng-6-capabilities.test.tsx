import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, createRef, type RefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InputToolbar } from '../InputToolbar'
import { RecommendCards } from '../RecommendCards'
import { ChatInputBox } from '../ChatInputBox'

const welcomeSectionSource = readFileSync(
  resolve(process.cwd(), 'src/pages/home/components/WelcomeSection.tsx'),
  'utf8',
)

vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: () => <div data-testid="model-selector" />,
}))

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}))

describe('Home capability affordances', () => {
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

  it('hides attachment and inspiration actions until handlers exist', async () => {
    await act(async () => {
      root.render(
        <InputToolbar
          isSkillPanelOpen={false}
          hasSelectedItems={false}
          onAtClick={() => undefined}
        />,
      )
    })

    expect(container.querySelectorAll('button')).toHaveLength(1)
    expect(
      container.querySelector('[aria-label="选择技能或应用"]'),
    ).not.toBeNull()
    expect(container.querySelector('[aria-label="添加附件"]')).toBeNull()
    expect(container.querySelector('[aria-label="获取灵感"]')).toBeNull()
  })

  it('renders capability actions with accessible names when handlers exist', async () => {
    const onAttachmentClick = vi.fn()
    const onInspirationClick = vi.fn()

    await act(async () => {
      root.render(
        <InputToolbar
          isSkillPanelOpen={false}
          hasSelectedItems={false}
          onAtClick={() => undefined}
          onAttachmentClick={onAttachmentClick}
          onInspirationClick={onInspirationClick}
        />,
      )
    })

    const attachment = container.querySelector<HTMLButtonElement>(
      '[aria-label="添加附件"]',
    )
    const inspiration = container.querySelector<HTMLButtonElement>(
      '[aria-label="获取灵感"]',
    )
    expect(attachment).not.toBeNull()
    expect(inspiration).not.toBeNull()

    await act(async () => {
      attachment?.click()
      inspiration?.click()
    })

    expect(onAttachmentClick).toHaveBeenCalledOnce()
    expect(onInspirationClick).toHaveBeenCalledOnce()
  })

  it('keeps unavailable tools and decorative function tabs out of the active Home composer', async () => {
    await act(async () => {
      root.render(
        <ChatInputBox
          inputValue=""
          onInputChange={() => undefined}
          onKeyDown={() => undefined}
          selectedMCPServers={[]}
          selectedApps={[]}
          onRemoveSkill={() => undefined}
          onRemoveApp={() => undefined}
          isSkillPanelOpen={false}
          onSkillPanelToggle={() => undefined}
          skillPanelRef={
            createRef<HTMLButtonElement>() as RefObject<HTMLButtonElement>
          }
          skillPanelContent={null}
          models={{}}
          selectedModelId=""
          onModelSelect={() => undefined}
          modelsLoading={false}
          isModelLocked={false}
          onSend={() => undefined}
        />,
      )
    })

    expect(container.querySelector('[aria-label="添加附件"]')).toBeNull()
    expect(container.querySelector('[aria-label="获取灵感"]')).toBeNull()
    expect(welcomeSectionSource).not.toMatch(/FunctionTabs|functionTabs/)
  })

  it('makes the whole recommendation card a keyboard-focusable prefill action', async () => {
    const onCardClick = vi.fn()

    await act(async () => {
      root.render(
        <RecommendCards
          cards={[
            {
              id: 1,
              title: '推荐问题',
              tag: '猜你想聊',
              bgColor: 'bg-components-recommend-card-bg-1',
            },
          ]}
          onCardClick={onCardClick}
        />,
      )
    })

    const card = container.querySelector<HTMLButtonElement>(
      'button[aria-label="推荐问题"]',
    )
    expect(card).not.toBeNull()
    expect(card?.querySelector('button')).toBeNull()

    card?.focus()
    expect(document.activeElement).toBe(card)

    await act(async () => card?.click())
    expect(onCardClick).toHaveBeenCalledOnce()
    expect(onCardClick).toHaveBeenCalledWith('推荐问题')
  })
})
