import React from 'react'
import { FileText } from 'lucide-react'

// 文件类型到图标的映射
const FILE_ICON_MAP: Record<string, string> = {
  // 文档类型
  pdf: '/src/assets/svg/file-icon/pdf.svg',
  doc: '/src/assets/svg/file-icon/doc.svg',
  docx: '/src/assets/svg/file-icon/docx.svg',
  txt: '/src/assets/svg/file-icon/txt.svg',
  md: '/src/assets/svg/file-icon/md.svg',
  
  // 表格类型
  xls: '/src/assets/svg/file-icon/xls.svg',
  xlsx: '/src/assets/svg/file-icon/xlsx.svg',
  csv: '/src/assets/svg/file-icon/csv.svg',
  
  // 演示文稿
  ppt: '/src/assets/svg/file-icon/ppt.svg',
  pptx: '/src/assets/svg/file-icon/pptx.svg',
  
  // 图片类型
  jpg: '/src/assets/svg/file-icon/jpg.svg',
  jpeg: '/src/assets/svg/file-icon/jpeg.svg',
  png: '/src/assets/svg/file-icon/png.svg',
  gif: '/src/assets/svg/file-icon/gif.svg',
  webp: '/src/assets/svg/file-icon/webp.svg',
  svg: '/src/assets/svg/file-icon/svg.svg',
  
  // 视频类型
  mp4: '/src/assets/svg/file-icon/mp4.svg',
  avi: '/src/assets/svg/file-icon/avi.svg',
  mkv: '/src/assets/svg/file-icon/mkv.svg',
  mpeg: '/src/assets/svg/file-icon/mpeg.svg',
  
  // 音频类型
  mp3: '/src/assets/svg/file-icon/mp3.svg',
  wav: '/src/assets/svg/file-icon/wav.svg',
  
  // 代码类型
  html: '/src/assets/svg/file-icon/html.svg',
  css: '/src/assets/svg/file-icon/css.svg',
  js: '/src/assets/svg/file-icon/js.svg',
  json: '/src/assets/svg/file-icon/json.svg',
  xml: '/src/assets/svg/file-icon/xml.svg',
  sql: '/src/assets/svg/file-icon/sql.svg',
  java: '/src/assets/svg/file-icon/java.svg',
  
  // 其他类型
  exe: '/src/assets/svg/file-icon/exe.svg',
  dmg: '/src/assets/svg/file-icon/dmg.svg',
  eps: '/src/assets/svg/file-icon/eps.svg',
  psd: '/src/assets/svg/file-icon/psd.svg',
  ai: '/src/assets/svg/file-icon/ai.svg',
  fig: '/src/assets/svg/file-icon/fig.svg',
  indd: '/src/assets/svg/file-icon/indd.svg',
}

interface FileIconProps {
  fileType: string
  fileName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const FileIcon: React.FC<FileIconProps> = ({ 
  fileType, 
  fileName, 
  size = 'md', 
  className = '' 
}) => {
  // 从文件名或类型中获取扩展名
  const getFileExtension = () => {
    if (fileName) {
      const parts = fileName.split('.')
      if (parts.length > 1) {
        return parts[parts.length - 1].toLowerCase()
      }
    }
    return fileType.toLowerCase()
  }

  const extension = getFileExtension()
  const iconPath = FILE_ICON_MAP[extension]

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  // 如果有对应的 SVG 图标，使用 SVG
  if (iconPath) {
    return (
      <img
        src={iconPath}
        alt={`${extension} file`}
        className={`${sizeClasses[size]} ${className}`}
        onError={(e) => {
          // 如果图标加载失败，使用默认图标
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `<svg class="${sizeClasses[size]} ${className} text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" /></svg>`
          }
        }}
      />
    )
  }

  // 默认使用 Lucide 图标
  return (
    <FileText className={`${sizeClasses[size]} ${className} text-gray-500`} />
  )
}