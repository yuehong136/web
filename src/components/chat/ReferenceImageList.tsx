import { useMemo } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { findAllReferenceMatches, isImageChunk } from '@/utils/reference-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  DocumentImage,
  DocumentImagePreviewProvider,
} from '@/components/knowledge/document-image'
import 'react-photo-view/dist/react-photo-view.css'

export interface ReferenceImageListProps {
  referenceChunks?: ReferenceChunk[]
  messageContent: string
  onImageClick?: (chunk: ReferenceChunk, index: number) => void
  className?: string
}
const getButtonVisibilityClass = (count: number) =>
  (
    ({
      1: 'hidden',
      2: '@sm:hidden',
      3: '@md:hidden',
      4: '@lg:hidden',
      5: '@lg:hidden',
    }) as Record<number, string>
  )[count] || (count >= 6 ? '@2xl:hidden' : '')

export const ReferenceImageList = ({
  referenceChunks = [],
  messageContent,
  onImageClick,
  className,
}: ReferenceImageListProps) => {
  const indices = useMemo(
    () => findAllReferenceMatches(messageContent).map((m) => Number(m.id)),
    [messageContent],
  )
  const images = useMemo(
    () =>
      referenceChunks
        .map((chunk, idx) => ({ chunk, idx }))
        .filter(
          ({ chunk, idx }) =>
            indices.includes(chunk.reference_index ?? idx) &&
            isImageChunk(chunk) &&
            chunk.image_id,
        ),
    [referenceChunks, indices],
  )
  if (!images.length) return null
  const navigation = getButtonVisibilityClass(images.length)
  return (
    <section className={cn('@container w-full', className)}>
      <DocumentImagePreviewProvider
        resetKey={images.map(({ chunk }) => chunk.image_id).join('|')}
      >
        <Carousel className="w-full" opts={{ align: 'start' }}>
          <CarouselContent>
            {images.map(({ chunk, idx }) => (
              <CarouselItem
                key={`${chunk.image_id}-${idx}`}
                className="basis-full @sm:basis-1/2 @md:basis-1/3 @lg:basis-1/4 @2xl:basis-1/6"
              >
                <div className="flex flex-col items-center gap-space-xs p-space-xs">
                  <DocumentImage
                    source={{ kind: 'dataset', imageId: chunk.image_id! }}
                    alt={`Fig. ${(chunk.reference_index ?? idx) + 1}`}
                    preview
                    onClick={() => onImageClick?.(chunk, idx)}
                    className="h-40 w-full rounded-radius-md border border-border-subtle bg-background-subtle object-contain"
                  />
                  <span className="text-xs text-text-accent">
                    Fig. {(chunk.reference_index ?? idx) + 1}
                  </span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={navigation} />
          <CarouselNext className={navigation} />
        </Carousel>
      </DocumentImagePreviewProvider>
    </section>
  )
}
export default ReferenceImageList
