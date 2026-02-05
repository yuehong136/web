import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { NotebookText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WorkFlowTimeline } from './workflow-timeline'

interface IEventItem {
  event: string
  data: {
    component_id: string
    component_type: string
    component_name: string
    elapsed_time?: number
    error?: string
    inputs?: Record<string, any>
    outputs?: Record<string, any>
    thoughts?: string
  }
}

interface LogSheetProps {
  hideModal?: () => void
  currentEventListWithoutMessageById?: (messageId: string) => IEventItem[]
  currentMessageId?: string
  sendLoading?: boolean
}

export function LogSheet({
  hideModal,
  currentEventListWithoutMessageById,
  currentMessageId,
  sendLoading = false,
}: LogSheetProps) {
  const { t } = useTranslation()

  return (
    <Sheet open onOpenChange={hideModal} modal={false}>
      <SheetContent
        className={cn('top-20 right-[clamp(0px,34%,620px)]')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-space-xs">
            <NotebookText className="size-4" />
            {t('flow.log', '日志')}
          </SheetTitle>
        </SheetHeader>
        <section className="max-h-[82vh] overflow-auto mt-space-lg">
          <WorkFlowTimeline
            currentEventListWithoutMessage={
              currentEventListWithoutMessageById?.(currentMessageId || '') || []
            }
            currentMessageId={currentMessageId}
            sendLoading={sendLoading}
          />
        </section>
      </SheetContent>
    </Sheet>
  )
}
