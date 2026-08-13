import type { TFunction } from 'i18next'
import { ConversationDateGroup } from '@/utils/conversation-utils'

const conversationGroupKeys: Record<ConversationDateGroup, string> = {
  [ConversationDateGroup.TODAY]: 'explore.conversations.groups.today',
  [ConversationDateGroup.YESTERDAY]: 'explore.conversations.groups.yesterday',
  [ConversationDateGroup.LAST_SEVEN_DAYS]:
    'explore.conversations.groups.last7Days',
  [ConversationDateGroup.EARLIER]: 'explore.conversations.groups.earlier',
}

export function translateConversationGroup(
  group: ConversationDateGroup,
  t: TFunction,
): string {
  return t(conversationGroupKeys[group])
}
