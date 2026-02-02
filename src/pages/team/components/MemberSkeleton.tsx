/**
 * 成员加载骨架屏组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface MemberSkeletonProps {
  viewMode: 'grid' | 'list'
  count?: number
}

const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('animate-pulse rounded', className)}
    style={{ backgroundColor: 'var(--color-surface-secondary)' }}
  />
)

const GridSkeleton: React.FC = () => (
  <div
    className="rounded-2xl border p-5"
    style={{
      backgroundColor: 'var(--color-components-card-bg)',
      borderColor: 'var(--color-components-card-border)',
    }}
  >
    <div className="flex items-start gap-3 mb-4">
      <SkeletonBox className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-4 w-16 rounded-full" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonBox className="h-4 w-48" />
      <SkeletonBox className="h-4 w-32" />
    </div>
  </div>
)

const ListSkeleton: React.FC = () => (
  <div className="grid grid-cols-[2fr_1fr_1fr_120px_60px] items-center gap-4 px-5 h-[72px]">
    <div className="flex items-center gap-4">
      <SkeletonBox className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-48" />
      </div>
    </div>
    <SkeletonBox className="h-5 w-16 rounded-full" />
    <SkeletonBox className="h-4 w-32" />
    <SkeletonBox className="h-4 w-24" />
    <SkeletonBox className="h-8 w-8 rounded" />
  </div>
)

export const MemberSkeleton: React.FC<MemberSkeletonProps> = ({
  viewMode,
  count = 6,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <GridSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      {/* 表头骨架 */}
      <div
        className="grid grid-cols-[2fr_1fr_1fr_120px_60px] items-center gap-4 px-5 h-12 border-b"
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <SkeletonBox className="h-3 w-12" />
        <SkeletonBox className="h-3 w-8" />
        <SkeletonBox className="h-3 w-12" />
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-3 w-8" />
      </div>
      {/* 列表骨架 */}
      <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {Array.from({ length: count }).map((_, i) => (
          <ListSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

MemberSkeleton.displayName = 'MemberSkeleton'
