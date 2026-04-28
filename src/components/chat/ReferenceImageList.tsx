/**
 * 引用图片列表组件
 * 用于在聊天消息底部展示图片类型的引用
 * 
 * 遵循展示组件原则：只接收 props，不包含业务逻辑
 * 参考 RAGFlow 的 ReferenceImageList 组件设计
 */
import React, { useMemo } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { 
  findAllReferenceMatches, 
  isImageChunk, 
  buildImageUrl 
} from '@/utils/reference-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import 'react-photo-view/dist/react-photo-view.css'

export interface ReferenceImageListProps {
  /** 引用 chunks 数据 */
  referenceChunks?: ReferenceChunk[]
  /** 消息内容（用于提取引用 ID） */
  messageContent: string
  /** 图片点击回调 */
  onImageClick?: (chunk: ReferenceChunk, index: number) => void
  /** 自定义类名 */
  className?: string
}

/**
 * 图片项数据类型
 */
interface ImageItem {
  /** 图片 ID */
  imageId: string
  /** 图片 URL */
  imageUrl: string
  /** 在 chunks 数组中的索引 */
  chunkIndex: number
  /** chunk 数据 */
  chunk: ReferenceChunk
}

/**
 * 根据图片数量计算导航按钮的隐藏规则
 * 使用 @container 查询实现响应式
 */
const getButtonVisibilityClass = (imageCount: number): string => {
  const map: Record<number, string> = {
    1: 'hidden',
    2: '@sm:hidden',
    3: '@md:hidden',
    4: '@lg:hidden',
    5: '@lg:hidden',
  }
  return map[imageCount] || (imageCount >= 6 ? '@2xl:hidden' : '')
}

/**
 * 图片预览工具栏组件
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
 * 引用图片列表组件
 * 
 * 从消息内容中提取引用 ID，过滤出图片类型的引用，
 * 以轮播形式展示在消息底部。点击图片可打开全屏预览。
 */
export const ReferenceImageList: React.FC<ReferenceImageListProps> = ({
  referenceChunks = [],
  messageContent,
  onImageClick,
  className,
}) => {
  // 从消息内容中提取所有引用 ID
  const referencedIndices = useMemo(() => {
    const matches = findAllReferenceMatches(messageContent)
    return matches.map(match => parseInt(match.id, 10))
  }, [messageContent])

  // 过滤出图片类型的引用
  const images = useMemo<ImageItem[]>(() => {
    if (!referenceChunks || referenceChunks.length === 0) {
      return []
    }

    return referenceChunks
      .map((chunk, idx) => ({ chunk, idx }))
      .filter(({ chunk, idx }) => {
        const referenceIndex = chunk.reference_index ?? idx
        // 只保留：1. 在消息中被引用的 2. 是图片类型的 3. 有 image_id 的
        return (
          referencedIndices.includes(referenceIndex) &&
          isImageChunk(chunk) &&
          chunk.image_id
        )
      })
      .map(({ chunk, idx }) => ({
        imageId: chunk.image_id!,
        imageUrl: buildImageUrl(chunk.image_id!),
        chunkIndex: idx,
        chunk,
      }))
  }, [referenceChunks, referencedIndices])

  // 没有图片则不渲染
  if (images.length === 0) {
    return null
  }

  const buttonVisibilityClass = getButtonVisibilityClass(images.length)

  return (
    <section className={cn('@container w-full', className)}>
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
        <Carousel
          className="w-full"
          opts={{
            align: 'start',
          }}
        >
          <CarouselContent>
            {images.map(({ imageId, imageUrl, chunkIndex, chunk }) => (
              <CarouselItem
                key={`${imageId}-${chunkIndex}`}
                className={cn(
                  'basis-full',
                  '@sm:basis-1/2',
                  '@md:basis-1/3',
                  '@lg:basis-1/4',
                  '@2xl:basis-1/6'
                )}
              >
                <div className="flex flex-col items-center gap-space-xs p-space-xs">
                  <PhotoView src={imageUrl}>
                    <div className="relative w-full cursor-pointer group">
                      <img
                        src={imageUrl}
                        alt={`Fig. ${chunkIndex + 1}`}
                        className={cn(
                          'w-full h-40 object-contain rounded-radius-md',
                          'transition-transform group-hover:scale-[1.02]'
                        )}
                        style={{
                          backgroundColor: 'var(--color-background-subtle)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                        onClick={() => onImageClick?.(chunk, chunkIndex)}
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const placeholder = target.nextElementSibling as HTMLElement
                          if (placeholder) {
                            placeholder.style.display = 'flex'
                          }
                        }}
                      />
                      {/* 错误占位符 */}
                      <div
                        className="hidden items-center justify-center h-40 w-full rounded-radius-md"
                        style={{ backgroundColor: 'var(--color-background-subtle)' }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          图片加载失败
                        </span>
                      </div>
                      {/* 图片序号标签 */}
                      <div
                        className={cn(
                          'absolute bottom-2 right-2',
                          'px-space-sm py-0.5 rounded-radius-xl',
                          'text-xs font-normal backdrop-blur-sm'
                        )}
                        style={{
                          backgroundColor: 'var(--color-surface-accent)',
                          color: 'var(--color-text-on-accent)',
                        }}
                      >
                        Fig. {chunkIndex + 1}
                      </div>
                    </div>
                  </PhotoView>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={buttonVisibilityClass} />
          <CarouselNext className={buttonVisibilityClass} />
        </Carousel>
      </PhotoProvider>
    </section>
  )
}

export default ReferenceImageList
