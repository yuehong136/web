import { useTranslation } from 'react-i18next'
import type { INodeEvent } from '../hooks/use-node-loading'
import { RuntimeThoughtChain } from '../features/runtime-workbench/components/runtime-thought-chain'

interface LogFlowTimelineProps {
  currentEventListWithoutMessage: INodeEvent[]
  sendLoading: boolean
}

export const WorkFlowTimeline = ({
  currentEventListWithoutMessage = [],
  sendLoading,
}: LogFlowTimelineProps) => {
  const { t } = useTranslation()

  if (currentEventListWithoutMessage.length === 0) {
    return (
      <div className="text-center text-text-secondary py-space-xl">
        {t('flow.noLogs', '暂无日志')}
      </div>
    )
  }

  return (
    <RuntimeThoughtChain
      events={currentEventListWithoutMessage}
      loading={sendLoading}
    />
  )
}
