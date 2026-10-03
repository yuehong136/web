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
      <div className="bg-background-page h-full overflow-auto">
        <Outlet />
      </div>
    )

  return (
    <div className="bg-background-page h-full">
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
          <div className="h-full overflow-auto">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

MemoryDetailLayout.displayName = 'MemoryDetailLayout'
