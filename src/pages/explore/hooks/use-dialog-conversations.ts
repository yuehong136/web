import { useQuery } from '@tanstack/react-query'
import { conversationAPI } from '@/api/conversation'
import { chatKeys } from '@/hooks/use-chat-request'

// ExplorePage 话题列表查询（key 走 chatKeys.dialogConversations，
// 形状与原页面内联 ['dialogConversations', selectedApp] 一致）
export function useDialogConversations(selectedApp: string, enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.dialogConversations(selectedApp),
    queryFn: async () => conversationAPI.getConversationsByDialog(selectedApp),
    enabled,
    retry: 1,
  })
}
