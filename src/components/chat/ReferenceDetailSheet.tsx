import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ReferenceDetailPanel } from '@/components/chat/reference-detail-panel'
import { useReturnFocus } from './use-return-focus'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chunk: ReferenceChunk | null
  allChunks?: ReferenceChunk[]
  onCopySuccess?: () => void
}

/** Standalone consumers keep their modal; workspace consumers share its body. */
export function ReferenceDetailSheet({
  open,
  onOpenChange,
  ...props
}: ReferenceDetailSheetProps) {
  const { t } = useTranslation()
  const returnFocus = useReturnFocus()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="h-full w-full overflow-hidden bg-background-body p-0 sm:max-w-xl"
        {...returnFocus}
      >
        <SheetTitle asChild>
          <span className="sr-only">
            {props.chunk?.document_name || t('sources.unknownDocument')}
          </span>
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t('sources.description')}
        </SheetDescription>
        <ReferenceDetailPanel {...props} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

export default ReferenceDetailSheet
