import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useFormSheetOffsetClass, useResolvedFormSheetContext } from './hooks'
import type { FormSheetProps } from './types'
import { FormRenderer } from './components/form-renderer'
import { OperatorDescription } from './components/operator-description'
import { OperatorHeader } from './components/operator-header'

export type { FormSheetProps } from './types'

export function FormSheet({
  open,
  node,
  onClose,
  runtimeDrawerVisible = false,
  canvasId,
}: FormSheetProps) {
  const offsetClassName = useFormSheetOffsetClass(runtimeDrawerVisible)
  const context = useResolvedFormSheetContext(node)

  if (!node) {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      modal={false}
    >
      <SheetContent
        showCloseButton={false}
        className={cn(
          'top-20 flex h-auto w-[500px] flex-col gap-0 overflow-hidden p-0 sm:w-[600px] sm:max-w-[600px]',
          offsetClassName,
        )}
      >
        <SheetTitle className="sr-only">
          {node.data?.name || node.data?.label || '节点配置'}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {context.description || '编辑当前节点的配置参数'}
        </SheetDescription>

        <section className="border-b border-border-primary px-space-md py-space-sm">
          <OperatorHeader
            node={node}
            titleEditable={context.titleEditable}
            iconKey={context.iconKey}
            debugEnabled={context.debugEnabled}
            canvasId={canvasId}
            onClose={onClose}
          />
          <div className="mt-space-sm">
            <OperatorDescription description={context.description} />
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-auto">
          <FormRenderer
            node={node}
            rendererKey={context.rendererKey}
            operatorType={context.operatorType}
          />
        </section>
      </SheetContent>
    </Sheet>
  )
}
