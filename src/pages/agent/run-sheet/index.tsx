import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BeginId } from '../constant'
import DebugContent from '../debug-content'
import { useGetBeginNodeDataInputs } from '../hooks/use-get-begin-query'
import useGraphStore from '../store'
import type { BeginQuery } from '../types'

interface RunSheetProps {
  hideModal?: () => void
  showModal?: () => void
}

const RunSheet = ({ hideModal, showModal: showChatModal }: RunSheetProps) => {
  const { t } = useTranslation()
  const { updateNodeForm, getNode } = useGraphStore((state) => state)
  const [loading, setLoading] = useState(false)

  const inputs = useGetBeginNodeDataInputs()

  const handleRunAgent = useCallback(
    async (nextValues: BeginQuery[]) => {
      setLoading(true)
      try {
        const beginNode = getNode(BeginId)
        const currentInputs: Record<string, BeginQuery> =
          beginNode?.data?.form?.inputs || {}

        // 构建新的 inputs
        const nextInputs = nextValues.reduce(
          (acc, item) => {
            if (item.key) {
              acc[item.key] = item
            }
            return acc
          },
          { ...currentInputs },
        )

        // 更新节点表单
        updateNodeForm(BeginId, nextInputs, ['inputs'])

        // 显示聊天面板
        showChatModal?.()
        hideModal?.()
      } finally {
        setLoading(false)
      }
    },
    [getNode, showChatModal, hideModal, updateNodeForm],
  )

  const onOk = useCallback(
    async (nextValues: any[]) => {
      handleRunAgent(nextValues)
    },
    [handleRunAgent],
  )

  return (
    <Sheet open onOpenChange={hideModal} modal={false}>
      <SheetContent className={cn('top-20 px-0 flex flex-col')}>
        <SheetHeader className="px-space-md">
          <SheetTitle>{t('flow.testRun', '测试运行')}</SheetTitle>
        </SheetHeader>
        <DebugContent
          ok={onOk}
          parameters={inputs}
          loading={loading}
          className="flex-1 overflow-auto min-h-0 pb-space-lg"
          maxHeight="max-h-[83vh]"
        />
      </SheetContent>
    </Sheet>
  )
}

export default RunSheet
