import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { FormConfigMap } from '../form'
import type { RAGFlowNodeType } from '../types'

interface FormSheetProps {
  open: boolean
  node: RAGFlowNodeType | undefined
  onClose: () => void
}

export const FormSheet = ({ open, node, onClose }: FormSheetProps) => {
  if (!node) return null

  const operatorType = node.data.label

  const FormComponent = useMemo(
    () => FormConfigMap[operatorType] ?? null,
    [operatorType],
  )

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{node.data.name}</SheetTitle>
              <SheetDescription className="mt-1">
                {operatorType}
              </SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {FormComponent ? (
            <FormComponent node={node} nodeId={node.id} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <div className="text-sm font-medium mb-2">Node Info</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{node.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{operatorType}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(node.data.form, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
