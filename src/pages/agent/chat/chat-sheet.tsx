import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useIsTaskMode } from '../hooks/use-get-begin-query'
import AgentChatBox from './box'

interface ChatSheetProps {
  hideModal?: () => void
}

export function ChatSheet({ hideModal }: ChatSheetProps) {
  const { t } = useTranslation()
  const isTaskMode = useIsTaskMode()

  return (
    <Sheet open modal={false} onOpenChange={hideModal}>
      <SheetContent
        className={cn('top-20 bottom-0 p-0 flex flex-col h-auto')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetTitle className="hidden" />
        <div className="pl-space-lg pt-space-sm text-text-title font-medium">
          {t(isTaskMode ? 'flow.task' : 'chat.chat', isTaskMode ? '任务' : '对话')}
        </div>
        <AgentChatBox />
      </SheetContent>
    </Sheet>
  )
}
