/**
 * 引用详情侧边栏：独立调用方（Agent 运行对话、创建应用预览）保留模态侧栏，
 * 正文与工作区证据面板共用 ReferenceDetailPanel（内容、原文链接、检索诊断）。
 */
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
  /** 是否打开 */
  open: boolean
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 当前选中的 chunk */
  chunk: ReferenceChunk | null
  /** 所有 chunks（用于显示同文档其他引用） */
  allChunks?: ReferenceChunk[]
  /** 复制成功回调 */
  onCopySuccess?: () => void
}

/** Standalone consumers keep their modal; workspace consumers share its body. */
export function ReferenceDetailSheet({
  open,
  onOpenChange,
  ...props
}: ReferenceDetailSheetProps) {
  const { t } = useTranslation()
  // 调用方都以受控方式打开（无 Trigger），关闭时把焦点还给打开前的元素
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
