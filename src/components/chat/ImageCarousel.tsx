import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { getChunkByRefId, type ReferenceMatch } from '@/utils/reference-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  DocumentImage,
  DocumentImagePreviewProvider,
} from '@/components/knowledge/document-image'
import 'react-photo-view/dist/react-photo-view.css'

export interface ImageCarouselProps {
  group: ReferenceMatch[]
  chunks: ReferenceChunk[]
  onImageClick?: (chunk: ReferenceChunk, index: number) => void
  className?: string
  disablePreview?: boolean
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  group,
  chunks,
  onImageClick,
  className,
  disablePreview = false,
}) => {
  const items = React.useMemo(
    () =>
      group.map((ref, idx) => ({
        ref,
        idx,
        chunk: getChunkByRefId(ref.id, chunks),
      })),
    [group, chunks],
  )
  if (!items.length) return null
  const content = (
    <Carousel
      className={cn('mx-auto w-full max-w-md', className)}
      opts={{ align: 'start', skipSnaps: false }}
    >
      <CarouselContent>
        {items.map(({ ref, idx, chunk }) => (
          <CarouselItem key={ref.id}>
            <div className="flex flex-col items-center gap-1">
              <DocumentImage
                source={
                  chunk?.image_id
                    ? { kind: 'dataset', imageId: chunk.image_id }
                    : null
                }
                alt={`Fig. ${Number(ref.id) + 1}`}
                preview={!disablePreview}
                onClick={
                  chunk && disablePreview
                    ? () => onImageClick?.(chunk, idx)
                    : undefined
                }
                className="max-h-36 rounded-lg border border-border-subtle object-contain transition-transform hover:scale-105"
              />
              <span className="text-xs font-medium text-text-accent">
                Fig. {Number(ref.id) + 1}
              </span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-10 h-8 w-8" />
      <CarouselNext className="-right-10 h-8 w-8" />
    </Carousel>
  )
  return disablePreview ? (
    content
  ) : (
    <DocumentImagePreviewProvider
      resetKey={items.map(({ chunk }) => chunk?.image_id ?? '').join('|')}
    >
      {content}
    </DocumentImagePreviewProvider>
  )
}
export default ImageCarousel
