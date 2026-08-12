/**
 * 轮播包装组件
 * 用于安全地渲染图片轮播，包含错误边界和懒加载
 */
import React from 'react'
import { toast } from '@/lib/toast'
import type { ReferenceGroup } from '@/utils/reference-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// 延迟加载 ImageCarousel 组件，避免 embla-carousel 初始化问题
const ImageCarousel = React.lazy(
  () => import('@/components/chat/ImageCarousel'),
)

export interface CarouselWrapperProps {
  /** 引用分组 */
  group: ReferenceGroup
  /** 所有引用 chunks */
  chunks: ReferenceChunk[]
  /** 图片点击回调 */
  onImageClick?: (chunk: ReferenceChunk) => void
  /** 自定义类名 */
  className?: string
}

/**
 * 简单的错误边界包装组件
 */
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch() {
    this.props.onError()
  }

  override render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

/**
 * 轮播包装组件
 *
 * 特性：
 * - 懒加载 ImageCarousel 组件
 * - 错误边界保护，出错时降级显示图片列表
 * - 支持自定义图片点击回调
 *
 * @example
 * <CarouselWrapper
 *   group={referenceGroup}
 *   chunks={references}
 *   onImageClick={(chunk) => handleViewDetail(chunk)}
 * />
 */
export const CarouselWrapper: React.FC<CarouselWrapperProps> = ({
  group,
  chunks,
  onImageClick,
  className = 'my-4',
}) => {
  const [hasError, setHasError] = React.useState(false)

  // 默认图片点击处理
  const handleImageClick = React.useCallback(
    (chunk: ReferenceChunk) => {
      if (onImageClick) {
        onImageClick(chunk)
      } else if (chunk.url) {
        window.open(chunk.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.success(`查看图片: Fig. ${parseInt(chunk.id || '0', 10) + 1}`)
      }
    },
    [onImageClick],
  )

  if (hasError) {
    // 出错时显示简单的图片列表作为降级方案
    return (
      <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
        {group.map((ref) => {
          const chunkIndex = parseInt(ref.id, 10)
          const chunk = chunks[chunkIndex]
          if (!chunk?.image_id) return null
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
          return (
            <img
              key={ref.id}
              src={`${baseUrl}/v1/document/image/${chunk.image_id}`}
              alt={`Fig. ${chunkIndex + 1}`}
              className="max-h-36 cursor-pointer rounded-lg object-contain"
              style={{ border: '1px solid var(--color-border-subtle)' }}
              onClick={() => handleImageClick(chunk)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <React.Suspense
      fallback={
        <div className={`flex h-36 items-center justify-center ${className}`}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            加载图片...
          </span>
        </div>
      }
    >
      <ErrorBoundaryWrapper onError={() => setHasError(true)}>
        <ImageCarousel
          group={group}
          chunks={chunks}
          onImageClick={handleImageClick}
          className={className}
        />
      </ErrorBoundaryWrapper>
    </React.Suspense>
  )
}

CarouselWrapper.displayName = 'CarouselWrapper'

export default CarouselWrapper
