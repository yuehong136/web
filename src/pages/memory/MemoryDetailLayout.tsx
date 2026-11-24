/**
 * 记忆库详情页布局组件
 * 壳层二级面板显示记忆库身份与分区；独立布局用可调整大小的侧栏
 */

import { useMemo, type FC } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { MemoryRecoveryNotice } from '@/components/memory/memory-recovery-notice'
import { MemorySidebar } from '@/components/memory'
import { useMemoryDetail } from '@/hooks/use-memory'
import { useTranslation } from 'react-i18next'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import type { MemoryDetailOutletContext } from './detail/memory-identity'

export const MemoryDetailLayout: FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  // 获取记忆库详情
  const { data: memory, isLoading } = useMemoryDetail(id)
  const definition = useMemo(
    () => ({
      section: 'knowledge' as const,
      title: memory?.name || t('layout.nav.memory'),
      groups: [],
      contentOnly: true,
      content: (
        <MemorySidebar
          memory={memory || null}
          memoryId={id}
          isLoading={isLoading}
        />
      ),
    }),
    [memory, id, isLoading, t],
  )
  const managed = useRegisterSecondaryNavigation(definition)
  // 各分区页据此决定标题前的路径：面板已提供返回列表时只显示记忆库名
  const context = useMemo<MemoryDetailOutletContext>(
    () => ({ navigationManaged: managed }),
    [managed],
  )

  if (managed)
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
        {id && <MemoryRecoveryNotice memoryId={id} />}{' '}
        <div className="min-h-0 flex-1 overflow-auto">
          {' '}
          <Outlet context={context} />{' '}
        </div>
      </div>
    )

  return (
    <div className="h-full bg-surface">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* 侧边栏 */}
        <ResizablePanel
          defaultSize="20%"
          minSize="15%"
          maxSize="30%"
          className="min-w-[200px]"
        >
          <MemorySidebar
            memory={memory || null}
            memoryId={id}
            isLoading={isLoading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 主内容区 */}
        <ResizablePanel defaultSize="80%">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {id && <MemoryRecoveryNotice memoryId={id} />}{' '}
            <div className="min-h-0 flex-1 overflow-auto">
              {' '}
              <Outlet context={context} />{' '}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

MemoryDetailLayout.displayName = 'MemoryDetailLayout'
