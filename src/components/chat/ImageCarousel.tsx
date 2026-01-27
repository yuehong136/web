/**
 * 图片轮播组件
 * 用于在聊天消息中展示连续的图片引用
 * 遵循展示组件原则：只接收 props，不包含业务逻辑
 * 
 * 集成 react-photo-view 提供图片预览功能（放大、缩小、旋转）
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
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import 'react-photo-view/dist/react-photo-view.css'

export interface ImageCarouselProps {
  /** 连续引用分组数据 */
  group: ReferenceMatch[]
  /** 所有引用 chunk 数据 */
  chunks: ReferenceChunk[]
  /** 图片点击回调（可选，预览关闭后触发） */
  onImageClick?: (chunk: ReferenceChunk, index: number) => void
  /** 自定义类名 */
  className?: string
  /** 是否禁用图片预览功能 */
  disablePreview?: boolean
}

/**
 * 图片预览工具栏组件
 * 提供放大、缩小、旋转功能
 */
const PhotoToolbar: React.FC<{
  rotate: number
  onRotate: (rotate: number) => void
  scale: number
  onScale: (scale: number) => void
}> = ({ rotate, onRotate, scale, onScale }) => {
  return (
    <>
      <RotateCw
        className="mr-4 cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onRotate(rotate + 90)}
      />
      <ZoomIn
        className="mr-4 cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onScale(scale + 0.5)}
      />
      <ZoomOut
        className="cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onScale(scale - 0.5)}
      />
    </>
  )
}

/**
 * 图片轮播组件
 * 
 * 展示连续出现的图片类型引用，支持左右切换浏览
 * 点击图片可打开全屏预览，支持放大、缩小、旋转操作
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  group,
  chunks,
  onImageClick,
  className,
  disablePreview = false,
}) => {
  // 预处理图片数据（hooks 必须在 early return 之前调用）
  const imageItems = React.useMemo(() => {
    if (!group || group.length === 0) return []
    return group.map((ref, idx) => {
      const chunk = getChunkByRefId(ref.id, chunks)
      const imageId = chunk?.image_id
      const chunkIndex = parseInt(ref.id, 10)
      const imageUrl = imageId ? buildImageUrl(imageId) : null
      return { ref, idx, chunk, imageId, chunkIndex, imageUrl }
    })
  }, [group, chunks])

  // 如果没有图片组，不渲染
  if (imageItems.length === 0) {
    return null
  }

  const renderCarouselContent = () => (
    <Carousel
      className={cn('w-full max-w-md mx-auto', className)}
      opts={{
        align: 'start',
        skipSnaps: false,
      }}
    >
      <CarouselContent>
        {imageItems.map(({ ref, idx, chunk, imageId, chunkIndex, imageUrl }) => {
          if (!imageId || !imageUrl) {
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

          const imageElement = (
            <img
              src={imageUrl}
              alt={`Fig. ${chunkIndex + 1}`}
              className={cn(
                'object-contain max-h-36 rounded-lg cursor-pointer',
                'transition-transform hover:scale-105'
              )}
              style={{
                border: '1px solid var(--color-border-subtle)',
              }}
              onClick={disablePreview && chunk ? () => onImageClick?.(chunk, idx) : undefined}
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
          )

          return (
            <CarouselItem key={ref.id}>
              <div className="flex flex-col items-center gap-1">
                {disablePreview ? (
                  imageElement
                ) : (
                  <PhotoView src={imageUrl}>
                    {imageElement}
                  </PhotoView>
                )}
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
      <CarouselPrevious className="h-8 w-8 -left-10" />
      <CarouselNext className="h-8 w-8 -right-10" />
    </Carousel>
  )

  // 如果禁用预览，直接返回轮播组件
  if (disablePreview) {
    return renderCarouselContent()
  }

  // 启用预览时，用 PhotoProvider 包裹
  return (
    <PhotoProvider
      toolbarRender={({ rotate, onRotate, scale, onScale }) => (
        <PhotoToolbar
          rotate={rotate}
          onRotate={onRotate}
          scale={scale}
          onScale={onScale}
        />
      )}
    >
      {renderCarouselContent()}
    </PhotoProvider>
  )
}

export default ImageCarousel
