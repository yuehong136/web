import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SidebarConversations } from '../../SidebarConversations'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { translateConversationGroup } from '@/pages/explore/components/conversation-group-label'
import { ConversationDateGroup } from '@/utils/conversation-utils'

vi.mock('@/hooks/use-chat-request', () => ({
  useFetchConversationsByDialog: () => ({
    conversations: [
      {
        id: 'conversation-1',
        name: '',
        update_time: Date.now(),
      },
    ],
    isLoading: false,
  }),
}))

describe('Desktop conversation localization', () => {
  afterEach(async () => {
    await setProductLanguage('zh-CN')
  })

  it('renders the shared recent-conversation panel fully in English', async () => {
    await setProductLanguage('en-US')
    const markup = renderToStaticMarkup(
      <SidebarConversations
        appId="app-1"
        appName="Research"
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onCreateNew={vi.fn()}
        isCollapsed={false}
      />,
    )

    expect(i18n.resolvedLanguage).toBe('en-US')
    expect(markup).toContain('Research conversations')
    expect(markup).toContain('Today')
    expect(markup).toContain('Untitled conversation')
    expect(markup).toContain('Just now')
    expect(markup).not.toMatch(/[一-鿿]/)
  })

  it('keeps the existing Explore consumer aligned with stable group codes', async () => {
    await setProductLanguage('en-US')

    expect(
      translateConversationGroup(ConversationDateGroup.TODAY, i18n.t),
    ).toBe('Today')
    expect(
      translateConversationGroup(ConversationDateGroup.LAST_SEVEN_DAYS, i18n.t),
    ).toBe('Last 7 days')
  })
})
