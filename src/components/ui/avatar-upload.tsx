// src/components/ui/avatar-upload.tsx
// 参考 ragflow 的头像上传组件，支持裁剪功能

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Pencil, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

export interface AvatarUploadProps {
  value?: string
  onChange?: (value: string) => void
  tips?: string
  size?: number
  disabled?: boolean
  loading?: boolean
  className?: string
}

// 将文件转换为 Base64 并压缩到指定尺寸 - 参考 ragflow 实现
const transformFile2Base64 = (
    file: File,
    imgSize: number = 1000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // 创建图片对象
      const img = new Image()
      img.src = reader.result as string

      img.onload = () => {
        // 创建 canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // 计算压缩后的尺寸
        let width = img.width
        let height = img.height
        const maxSize = imgSize

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        // 设置 canvas 尺寸
        canvas.width = width
        canvas.height = height

        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为 base64
        const compressedBase64 = canvas.toDataURL('image/png')
        resolve(compressedBase64)
      }

      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export const AvatarUpload = React.forwardRef<HTMLInputElement, AvatarUploadProps>(
    function AvatarUpload({
                            value,
                            onChange,
                            tips = '你可以上传4MB的文件',
                            size = 64,
                            disabled = false,
                            loading = false,
                            className
                          }, ref) {
      const [avatarBase64Str, setAvatarBase64Str] = useState('')
      const [isCropModalOpen, setIsCropModalOpen] = useState(false)
      const [imageToCrop, setImageToCrop] = useState<string | null>(null)
      const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 })
      const imageRef = useRef<HTMLImageElement>(null)
      const canvasRef = useRef<HTMLCanvasElement>(null)
      const containerRef = useRef<HTMLDivElement>(null)
      const isDraggingRef = useRef(false)
      const dragStartRef = useRef({ x: 0, y: 0 })
      const [imageScale, setImageScale] = useState(1)
      const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
      const [isCropping, setIsCropping] = useState(false)
      // 存储图片原始尺寸
      const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
      // 图片是否已加载完成
      const [imageLoaded, setImageLoaded] = useState(false)

      // 同步外部 value - 确保值能正确同步（包括清空）
      useEffect(() => {
        setAvatarBase64Str(value || '')
      }, [value])

      // 处理文件选择
      const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target?.files?.[0]
        if (file && /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name)) {
          // 检查文件大小 (4MB)
          if (file.size > 4 * 1024 * 1024) {
            alert('文件大小不能超过 4MB')
            return
          }

          // 重置所有图片相关状态
          setImageLoaded(false)
          setImageNaturalSize({ width: 0, height: 0 })
          setImageScale(1)
          setImageOffset({ x: 0, y: 0 })
          setCropArea({ x: 0, y: 0, size: 200 })

          // 压缩图片到 1000px，参考 ragflow
          const str = await transformFile2Base64(file, 1000)
          setImageToCrop(str)
          setIsCropModalOpen(true)
        }
        e.target.value = ''
      }, [])

      // 移除头像
      const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setAvatarBase64Str('')
        onChange?.('')
      }, [onChange])

      // 初始化裁剪区域 - 参考 ragflow 实现
      const initCropArea = useCallback(() => {
        if (!imageRef.current || !containerRef.current) return

        const image = imageRef.current
        const container = containerRef.current

        // 使用图片的原始尺寸
        const imgWidth = image.naturalWidth
        const imgHeight = image.naturalHeight

        if (!imgWidth || !imgHeight) return

        // 存储图片尺寸
        setImageNaturalSize({ width: imgWidth, height: imgHeight })

        // 计算图片缩放比例以适应容器
        const scale = Math.min(
            container.clientWidth / imgWidth,
            container.clientHeight / imgHeight
        )
        setImageScale(scale)

        // 计算图片偏移以居中
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale
        const offsetX = (container.clientWidth - scaledWidth) / 2
        const offsetY = (container.clientHeight - scaledHeight) / 2
        setImageOffset({ x: offsetX, y: offsetY })

        // 初始化裁剪区域为图片中心的 80% - 参考 ragflow
        const cropDisplaySize = Math.min(scaledWidth, scaledHeight) * 0.8
        const cropSize = cropDisplaySize / scale
        const x = (imgWidth - cropSize) / 2
        const y = (imgHeight - cropSize) / 2

        setCropArea({ x, y, size: cropSize })

        // 标记图片已加载完成
        setImageLoaded(true)
      }, [])

      // 处理裁剪
      const handleCrop = useCallback(() => {
        if (!imageRef.current || !canvasRef.current) return

        setIsCropping(true)

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const image = imageRef.current

        if (!ctx) {
          setIsCropping(false)
          return
        }

        // 设置画布尺寸为 64x64 (头像尺寸)
        canvas.width = 64
        canvas.height = 64

        // 绘制裁剪后的图片 - 使用原始图片坐标
        ctx.drawImage(
            image,
            Math.round(cropArea.x),
            Math.round(cropArea.y),
            Math.round(cropArea.size),
            Math.round(cropArea.size),
            0,
            0,
            64,
            64
        )

        // 转换为 Base64
        const croppedImageBase64 = canvas.toDataURL('image/png')
        setAvatarBase64Str(croppedImageBase64)
        onChange?.(croppedImageBase64)

        // 重置裁剪相关状态
        setIsCropModalOpen(false)
        setIsCropping(false)
        setImageToCrop(null)
        setImageLoaded(false)
        setImageNaturalSize({ width: 0, height: 0 })
        setImageScale(1)
        setImageOffset({ x: 0, y: 0 })
        setCropArea({ x: 0, y: 0, size: 200 })
      }, [cropArea, onChange])

      // 取消裁剪
      const handleCancelCrop = useCallback(() => {
        setIsCropModalOpen(false)
        setImageToCrop(null)
        setImageLoaded(false)
        setImageNaturalSize({ width: 0, height: 0 })
        setImageScale(1)
        setImageOffset({ x: 0, y: 0 })
        setCropArea({ x: 0, y: 0, size: 200 })
      }, [])

      // 鼠标移动处理
      const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        const { width: naturalWidth, height: naturalHeight } = imageNaturalSize
        if (!naturalWidth || !naturalHeight) return

        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()

        // 计算鼠标相对于容器的位置
        const mouseX = e.clientX - containerRect.left
        const mouseY = e.clientY - containerRect.top

        // 计算鼠标相对于图片原始坐标系的位置
        const imageX = (mouseX - imageOffset.x) / imageScale
        const imageY = (mouseY - imageOffset.y) / imageScale

        // 计算新的裁剪区域位置
        let newX = imageX - dragStartRef.current.x
        let newY = imageY - dragStartRef.current.y

        // 边界检查
        newX = Math.max(0, Math.min(newX, naturalWidth - cropArea.size))
        newY = Math.max(0, Math.min(newY, naturalHeight - cropArea.size))

        setCropArea(prev => ({
          ...prev,
          x: newX,
          y: newY,
        }))
      }, [cropArea.size, imageScale, imageOffset, imageNaturalSize])

      // 鼠标释放处理
      const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }, [handleMouseMove])

      // 鼠标按下处理
      const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        isDraggingRef.current = true

        if (containerRef.current) {
          const container = containerRef.current
          const containerRect = container.getBoundingClientRect()

          const mouseX = e.clientX - containerRect.left
          const mouseY = e.clientY - containerRect.top

          // 转换到原始图片坐标系
          const imageX = (mouseX - imageOffset.x) / imageScale
          const imageY = (mouseY - imageOffset.y) / imageScale

          dragStartRef.current = {
            x: imageX - cropArea.x,
            y: imageY - cropArea.y,
          }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }, [cropArea, imageScale, imageOffset, handleMouseMove, handleMouseUp])

      // 滚轮缩放处理
      const handleWheel = useCallback((e: WheelEvent) => {
        const { width: naturalWidth, height: naturalHeight } = imageNaturalSize
        if (!naturalWidth || !naturalHeight) return

        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1 // 缩放因子

        setCropArea(prev => {
          const newSize = Math.max(
              20,
              Math.min(prev.size * delta, Math.min(naturalWidth, naturalHeight))
          )

          // 调整位置使裁剪区域保持居中
          const centerRatioX = (prev.x + prev.size / 2) / naturalWidth
          const centerRatioY = (prev.y + prev.size / 2) / naturalHeight

          const newX = centerRatioX * naturalWidth - newSize / 2
          const newY = centerRatioY * naturalHeight - newSize / 2

          // 边界检查
          const boundedX = Math.max(0, Math.min(newX, naturalWidth - newSize))
          const boundedY = Math.max(0, Math.min(newY, naturalHeight - newSize))

          return {
            x: boundedX,
            y: boundedY,
            size: newSize,
          }
        })
      }, [imageNaturalSize])

      // 添加滚轮事件监听 - 只在图片加载完成后启用
      useEffect(() => {
        const container = containerRef.current
        if (imageLoaded && container && isCropModalOpen) {
          container.addEventListener('wheel', handleWheel, { passive: false })

          return () => {
            container.removeEventListener('wheel', handleWheel)
          }
        }
      }, [handleWheel, imageLoaded, isCropModalOpen])

      return (
          <div className={cn("flex items-start gap-4", className)}>
            {/* 头像区域 - 参考 ragflow 实现 */}
            <div className="relative group">
              {!avatarBase64Str ? (
                  // 空状态：显示上传占位符
                  <div
                      className={cn(
                          "grid place-content-center border border-dashed border-border-default bg-surface-secondary rounded-lg",
                          disabled && "opacity-50"
                      )}
                      style={{ width: size, height: size }}
                  >
                    <div className="flex flex-col items-center gap-1 text-text-tertiary pointer-events-none">
                      {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                          <span className="text-xs">点击上传</span>
                      )}
                    </div>
                  </div>
              ) : (
                  // 有头像：显示头像
                  <div
                      className="relative grid place-content-center"
                      style={{ width: size, height: size }}
                  >
                    <Avatar
                        className="rounded-lg"
                        style={{ width: size, height: size }}
                    >
                      <AvatarImage src={avatarBase64Str} alt="avatar" className="object-cover" />
                      <AvatarFallback className="rounded-lg" />
                    </Avatar>
                    {/* Hover 遮罩 */}
                    <div className={cn(
                        "absolute inset-0 bg-black/20 rounded-lg pointer-events-none",
                        "group-hover:bg-black/50 transition-colors"
                    )}>
                      <Pencil
                          size={16}
                          className="absolute right-1.5 bottom-1.5 text-white opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    {/* 删除按钮 */}
                    {!disabled && avatarBase64Str && (
                        <Button
                            onClick={handleRemove}
                            size="icon"
                            variant="destructive"
                            className={cn(
                                "absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white z-10",
                                "opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            )}
                            aria-label="删除头像"
                            type="button"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                    )}
                  </div>
              )}
              {/* 文件输入 - 覆盖整个区域，参考 ragflow */}
              <input
                  type="file"
                  accept="image/*"
                  title=""
                  className={cn(
                      "absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer",
                      disabled && "cursor-not-allowed"
                  )}
                  onChange={handleChange}
                  disabled={disabled || loading}
                  ref={ref}
              />
            </div>

            {tips && (
                <span className="text-xs text-text-tertiary self-center">{tips}</span>
            )}

            {/* 裁剪弹窗 */}
            <Dialog open={isCropModalOpen} onOpenChange={(open) => !open && handleCancelCrop()}>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>裁剪头像</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center py-4">
                  {imageToCrop && (
                      <div className="w-full">
                        <div
                            ref={containerRef}
                            className="relative overflow-hidden border border-border-default rounded-lg mx-auto bg-surface-secondary"
                            style={{
                              width: '300px',
                              height: '300px',
                              touchAction: 'none',
                            }}
                        >
                          {/* 加载提示 */}
                          {!imageLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
                              </div>
                          )}
                          {/* 图片 - 在加载完成前不可见，但需要在DOM中以便触发onLoad */}
                          <img
                              ref={imageRef}
                              src={imageToCrop}
                              alt="待裁剪"
                              className="absolute block"
                              style={imageLoaded ? {
                                width: `${imageNaturalSize.width * imageScale}px`,
                                height: `${imageNaturalSize.height * imageScale}px`,
                                left: `${imageOffset.x}px`,
                                top: `${imageOffset.y}px`,
                              } : {
                                visibility: 'hidden',
                              }}
                              onLoad={initCropArea}
                          />
                          {/* 裁剪区域 - 只在图片加载完成后显示 */}
                          {imageLoaded && (
                              <div
                                  className="absolute border-2 border-white border-dashed cursor-move rounded-lg"
                                  style={{
                                    left: `${imageOffset.x + cropArea.x * imageScale}px`,
                                    top: `${imageOffset.y + cropArea.y * imageScale}px`,
                                    width: `${cropArea.size * imageScale}px`,
                                    height: `${cropArea.size * imageScale}px`,
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                  }}
                                  onMouseDown={handleMouseDown}
                              />
                          )}
                        </div>
                        <p className="text-sm text-text-secondary text-center mt-3">
                          拖动选择区域，滚轮缩放大小
                        </p>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCancelCrop} disabled={isCropping}>
                    取消
                  </Button>
                  <Button onClick={handleCrop} disabled={isCropping}>
                    {isCropping && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    确认
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
      )
    }
)

AvatarUpload.displayName = 'AvatarUpload'

export default AvatarUpload
