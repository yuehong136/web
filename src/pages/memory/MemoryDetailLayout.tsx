/**
 * 记忆库详情页布局组件
 * 使用 react-resizable-panels 实现可调整大小的侧边栏
 */

import React from 'react'
import { Outlet, useParams } from 'react-router-dom'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { MemorySidebar } from '@/components/memory'
import { useMemoryDetail } from '@/hooks/use-memory'
import { useTranslation } from 'react-i18next'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { MemoryRecoveryNotice } from '@/components/memory/memory-recovery-notice'

export const MemoryDetailLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  // 获取记忆库详情
  const { data: memory, isLoading } = useMemoryDetail(id)
  const definition = React.useMemo(
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

  if (managed)
    return (
      <div className="flex h-full min-h-0 flex-col bg-background-default">
        {id && <MemoryRecoveryNotice memoryId={id} />}
        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    )

  return (
    <div className="h-full bg-background-default">
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
          <div className="flex h-full min-h-0 flex-col">
            {id && <MemoryRecoveryNotice memoryId={id} />}
            <div className="min-h-0 flex-1 overflow-auto">
              <Outlet />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

MemoryDetailLayout.displayName = 'MemoryDetailLayout'
