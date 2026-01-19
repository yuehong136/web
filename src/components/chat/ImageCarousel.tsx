/**
 * 图片轮播组件
 * 用于在聊天消息中展示连续的图片引用
 * 遵循展示组件原则：只接收 props，不包含业务逻辑
 */
import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { ReferenceMatch } from '@/utils/reference-utils'
import { buildImageUrl, getChunkByRefId } from '@/utils/reference-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ImageCarouselProps {
  /** 连续引用分组数据 */
  group: ReferenceMatch[]
  /** 所有引用 chunk 数据 */
  chunks: ReferenceChunk[]
  /** 图片点击回调 */
  onImageClick?: (chunk: ReferenceChunk, index: number) => void
  /** 自定义类名 */
  className?: string
}

/**
 * 图片轮播组件
 * 
 * 展示连续出现的图片类型引用，支持左右切换浏览
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  group,
  chunks,
  onImageClick,
  className,
}) => {
  const handleImageClick = React.useCallback(
    (chunk: ReferenceChunk, index: number) => () => {
      onImageClick?.(chunk, index)
    },
    [onImageClick]
  )

  // 如果没有图片组，不渲染
  if (!group || group.length === 0) {
    return null
  }

  return (
    <Carousel
      className={cn('w-44 mx-auto', className)}
      opts={{
        align: 'start',
        skipSnaps: false,
      }}
    >
      <CarouselContent>
        {group.map((ref, idx) => {
          const chunk = getChunkByRefId(ref.id, chunks)
          const imageId = chunk?.image_id
          const chunkIndex = parseInt(ref.id, 10)

          if (!imageId) {
            return (
              <CarouselItem key={ref.id}>
                <div 
                  className="flex items-center justify-center h-36 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                >
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    图片加载失败
                  </span>
                </div>
              </CarouselItem>
            )
          }

          return (
            <CarouselItem key={ref.id}>
              <div className="flex flex-col items-center gap-1">
                <img
                  src={buildImageUrl(imageId)}
                  alt={`Fig. ${chunkIndex + 1}`}
                  className={cn(
                    'object-contain max-h-36 rounded-lg cursor-pointer',
                    'transition-transform hover:scale-105'
                  )}
                  style={{
                    border: '1px solid var(--color-border-subtle)',
                  }}
                  onClick={chunk ? handleImageClick(chunk, idx) : undefined}
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    // 显示错误占位符
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) {
                      placeholder.style.display = 'flex'
                    }
                  }}
                />
                <div 
                  className="hidden items-center justify-center h-36 w-full rounded-lg"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                >
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    图片加载失败
                  </span>
                </div>
                <span 
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-accent)' }}
                >
                  Fig. {chunkIndex + 1}
                </span>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="h-7 w-7 -left-9" />
      <CarouselNext className="h-7 w-7 -right-9" />
    </Carousel>
  )
}

export default ImageCarousel
