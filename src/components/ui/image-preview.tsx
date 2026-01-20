/**
 * 图片预览组件
 * 基于 react-photo-view 实现图片全屏预览功能
 * 支持放大、缩小、旋转操作
 */
import React from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { RotateCw, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-photo-view/dist/react-photo-view.css'

export interface ImagePreviewProps {
  /** 图片 URL */
  src: string
  /** 图片替代文本 */
  alt?: string
  /** 自定义类名 */
  className?: string
  /** 自定义图片样式 */
  imageClassName?: string
  /** 是否显示下载按钮 */
  showDownload?: boolean
  /** 是否显示新窗口打开按钮 */
  showOpenInNew?: boolean
  /** 子元素（如果提供，将作为触发器） */
  children?: React.ReactElement
}

/**
 * 图片预览工具栏
 */
const PhotoToolbar: React.FC<{
  rotate: number
  onRotate: (rotate: number) => void
  scale: number
  onScale: (scale: number) => void
  src?: string
  showDownload?: boolean
  showOpenInNew?: boolean
}> = ({ rotate, onRotate, scale, onScale, src, showDownload, showOpenInNew }) => {
  const handleDownload = () => {
    if (!src) return
    const link = document.createElement('a')
    link.href = src
    link.download = src.split('/').pop() || 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNew = () => {
    if (!src) return
    window.open(src, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-4">
      <RotateCw
        className="cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onRotate(rotate + 90)}
        title="旋转"
      />
      <ZoomIn
        className="cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onScale(scale + 0.5)}
        title="放大"
      />
      <ZoomOut
        className="cursor-pointer text-white/60 hover:text-white transition-colors"
        size={20}
        onClick={() => onScale(scale - 0.5)}
        title="缩小"
      />
      {showDownload && (
        <Download
          className="cursor-pointer text-white/60 hover:text-white transition-colors"
          size={20}
          onClick={handleDownload}
          title="下载"
        />
      )}
      {showOpenInNew && (
        <ExternalLink
          className="cursor-pointer text-white/60 hover:text-white transition-colors"
          size={20}
          onClick={handleOpenInNew}
          title="新窗口打开"
        />
      )}
    </div>
  )
}

/**
 * 单张图片预览组件
 * 点击图片可打开全屏预览，支持放大、缩小、旋转
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = '图片预览',
  className,
  imageClassName,
  showDownload = false,
  showOpenInNew = true,
  children,
}) => {
  const defaultImage = (
    <img
      src={src}
      alt={alt}
      className={cn(
        'cursor-pointer transition-opacity hover:opacity-90',
        imageClassName
      )}
    />
  )

  return (
    <PhotoProvider
      toolbarRender={({ rotate, onRotate, scale, onScale }) => (
        <PhotoToolbar
          rotate={rotate}
          onRotate={onRotate}
          scale={scale}
          onScale={onScale}
          src={src}
          showDownload={showDownload}
          showOpenInNew={showOpenInNew}
        />
      )}
    >
      <div className={className}>
        <PhotoView src={src}>
          {children || defaultImage}
        </PhotoView>
      </div>
    </PhotoProvider>
  )
}

export interface ImagePreviewGroupProps {
  /** 子元素（多个 ImagePreviewItem） */
  children: React.ReactNode
  /** 是否显示下载按钮 */
  showDownload?: boolean
  /** 是否显示新窗口打开按钮 */
  showOpenInNew?: boolean
}

/**
 * 图片预览分组组件
 * 用于多张图片的预览，可在图片间切换
 */
export const ImagePreviewGroup: React.FC<ImagePreviewGroupProps> = ({
  children,
  showDownload = false,
  showOpenInNew = true,
}) => {
  const [currentSrc, setCurrentSrc] = React.useState<string>('')

  return (
    <PhotoProvider
      toolbarRender={({ rotate, onRotate, scale, onScale }) => (
        <PhotoToolbar
          rotate={rotate}
          onRotate={onRotate}
          scale={scale}
          onScale={onScale}
          src={currentSrc}
          showDownload={showDownload}
          showOpenInNew={showOpenInNew}
        />
      )}
      onIndexChange={(index) => {
        // 尝试获取当前图片的 src
        const photoViews = document.querySelectorAll('[data-photo-view-src]')
        if (photoViews[index]) {
          setCurrentSrc(photoViews[index].getAttribute('data-photo-view-src') || '')
        }
      }}
    >
      {children}
    </PhotoProvider>
  )
}

export interface ImagePreviewItemProps {
  /** 图片 URL */
  src: string
  /** 图片替代文本 */
  alt?: string
  /** 自定义类名 */
  className?: string
  /** 子元素（作为触发器） */
  children?: React.ReactElement
}

/**
 * 图片预览项组件
 * 用于 ImagePreviewGroup 内部
 */
export const ImagePreviewItem: React.FC<ImagePreviewItemProps> = ({
  src,
  alt = '图片预览',
  className,
  children,
}) => {
  const defaultImage = (
    <img
      src={src}
      alt={alt}
      className={cn('cursor-pointer transition-opacity hover:opacity-90', className)}
      data-photo-view-src={src}
    />
  )

  return (
    <PhotoView src={src}>
      {children ? React.cloneElement(children, { 'data-photo-view-src': src }) : defaultImage}
    </PhotoView>
  )
}

export default ImagePreview
