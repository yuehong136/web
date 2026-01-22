import React from 'react'
import { 
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  File,
  FileJson,
  Database,
  FileType,
  Presentation,
  type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 文件类型分类系统
// ============================================================================

/**
 * 文件类型分类
 */
export type FileCategory = 
  | 'document'    // 文档 (PDF, Word, etc.)
  | 'spreadsheet' // 表格 (Excel, CSV, etc.)
  | 'presentation'// 演示文稿 (PPT, etc.)
  | 'image'       // 图片
  | 'video'       // 视频
  | 'audio'       // 音频
  | 'code'        // 代码/配置文件
  | 'data'        // 数据文件 (JSON, XML, etc.)
  | 'archive'     // 压缩包
  | 'font'        // 字体
  | 'design'      // 设计文件 (PSD, AI, etc.)
  | 'executable'  // 可执行文件
  | 'unknown'     // 未知类型

/**
 * 文件扩展名到分类的映射
 */
const EXTENSION_CATEGORY_MAP: Record<string, FileCategory> = {
  // 文档类型
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  rtf: 'document',
  odt: 'document',
  md: 'document',
  mdx: 'document',
  epub: 'document',
  mobi: 'document',
  tex: 'document',
  
  // 表格类型
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  tsv: 'spreadsheet',
  ods: 'spreadsheet',
  
  // 演示文稿
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  key: 'presentation',
  
  // 图片类型
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',
  tiff: 'image',
  tif: 'image',
  heic: 'image',
  heif: 'image',
  raw: 'image',
  cr2: 'image',
  nef: 'image',
  
  // 视频类型
  mp4: 'video',
  avi: 'video',
  mkv: 'video',
  mov: 'video',
  wmv: 'video',
  flv: 'video',
  webm: 'video',
  m4v: 'video',
  mpeg: 'video',
  mpg: 'video',
  rmvb: 'video',
  rm: 'video',
  '3gp': 'video',
  
  // 音频类型
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  wma: 'audio',
  m4a: 'audio',
  aiff: 'audio',
  ape: 'audio',
  mid: 'audio',
  midi: 'audio',
  
  // 代码/配置文件
  js: 'code',
  jsx: 'code',
  ts: 'code',
  tsx: 'code',
  py: 'code',
  pyw: 'code',
  java: 'code',
  kt: 'code',
  kts: 'code',
  scala: 'code',
  go: 'code',
  rs: 'code',
  c: 'code',
  cpp: 'code',
  cc: 'code',
  cxx: 'code',
  h: 'code',
  hpp: 'code',
  cs: 'code',
  rb: 'code',
  php: 'code',
  swift: 'code',
  m: 'code',
  mm: 'code',
  pl: 'code',
  pm: 'code',
  lua: 'code',
  r: 'code',
  jl: 'code',
  dart: 'code',
  elm: 'code',
  ex: 'code',
  exs: 'code',
  erl: 'code',
  hrl: 'code',
  hs: 'code',
  lhs: 'code',
  clj: 'code',
  cljs: 'code',
  coffee: 'code',
  vue: 'code',
  svelte: 'code',
  astro: 'code',
  sh: 'code',
  bash: 'code',
  zsh: 'code',
  fish: 'code',
  ps1: 'code',
  bat: 'code',
  cmd: 'code',
  asm: 'code',
  s: 'code',
  v: 'code',
  vhd: 'code',
  vhdl: 'code',
  sol: 'code',
  sql: 'code',
  html: 'code',
  htm: 'code',
  css: 'code',
  scss: 'code',
  sass: 'code',
  less: 'code',
  styl: 'code',
  
  // 数据文件
  json: 'data',
  jsonc: 'data',
  json5: 'data',
  xml: 'data',
  yaml: 'data',
  yml: 'data',
  toml: 'data',
  ini: 'data',
  conf: 'data',
  cfg: 'data',
  env: 'data',
  properties: 'data',
  lock: 'data',
  
  // 压缩包
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  bz2: 'archive',
  xz: 'archive',
  tgz: 'archive',
  tbz2: 'archive',
  
  // 字体
  ttf: 'font',
  otf: 'font',
  woff: 'font',
  woff2: 'font',
  eot: 'font',
  
  // 设计文件
  psd: 'design',
  ai: 'design',
  sketch: 'design',
  fig: 'design',
  xd: 'design',
  indd: 'design',
  eps: 'design',
  aep: 'design',
  prproj: 'design',
  fla: 'design',
  
  // 可执行文件
  exe: 'executable',
  msi: 'executable',
  dmg: 'executable',
  pkg: 'executable',
  deb: 'executable',
  rpm: 'executable',
  apk: 'executable',
  ipa: 'executable',
  app: 'executable',
}

/**
 * 分类对应的 Lucide 图标
 */
const CATEGORY_ICON_MAP: Record<FileCategory, LucideIcon> = {
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  code: FileCode,
  data: FileJson,
  archive: FileArchive,
  font: FileType,
  design: FileImage,
  executable: Database,
  unknown: File,
}

/**
 * 分类对应的颜色主题
 */
const CATEGORY_COLOR_MAP: Record<FileCategory, { bg: string; text: string; accent: string }> = {
  document: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', accent: '#ef4444' },      // 红色 - PDF/文档
  spreadsheet: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', accent: '#22c55e' },  // 绿色 - 表格
  presentation: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },// 橙色 - PPT
  image: { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', accent: '#ec4899' },       // 粉色 - 图片
  video: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', accent: '#a855f7' },       // 紫色 - 视频
  audio: { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', accent: '#14b8a6' },       // 青色 - 音频
  code: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },        // 蓝色 - 代码
  data: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },         // 黄色 - 数据
  archive: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', accent: '#6b7280' },    // 灰色 - 压缩包
  font: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', accent: '#6366f1' },        // 靛蓝 - 字体
  design: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', accent: '#8b5cf6' },      // 紫罗兰 - 设计
  executable: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', accent: '#f59e0b' }, // 琥珀 - 可执行
  unknown: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', accent: '#6b7280' },    // 灰色 - 未知
}

/**
 * 特定扩展名的颜色覆盖（用于区分同类型中的不同文件）
 */
const EXTENSION_COLOR_OVERRIDE: Record<string, { bg: string; text: string; accent: string }> = {
  // PDF 使用红色
  pdf: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', accent: '#ef4444' },
  // Word 使用蓝色
  doc: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
  docx: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
  // Markdown 使用紫色
  md: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', accent: '#8b5cf6' },
  mdx: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', accent: '#8b5cf6' },
  // Python 使用蓝黄色
  py: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
  // JavaScript/TypeScript
  js: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },
  jsx: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },
  ts: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
  tsx: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
  // Go
  go: { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', accent: '#14b8a6' },
  // Rust
  rs: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },
  // Java
  java: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },
  // JSON
  json: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },
  // HTML/CSS
  html: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },
  css: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
}

/**
 * SVG 图标路径映射
 */
const SVG_ICON_MAP: Record<string, string> = {
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
  tiff: '/src/assets/svg/file-icon/tiff.svg',
  
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
  aep: '/src/assets/svg/file-icon/aep.svg',
  rss: '/src/assets/svg/file-icon/rss.svg',
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 从文件名中获取扩展名
 */
export function getFileExtension(fileName?: string): string {
  if (!fileName) return ''
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === fileName.length - 1) return ''
  return fileName.slice(lastDot + 1).toLowerCase()
}

/**
 * 获取文件分类
 */
export function getFileCategory(extension: string): FileCategory {
  return EXTENSION_CATEGORY_MAP[extension.toLowerCase()] || 'unknown'
}

/**
 * 获取文件颜色主题
 */
export function getFileColor(extension: string): { bg: string; text: string; accent: string } {
  const ext = extension.toLowerCase()
  // 优先使用特定扩展名的颜色覆盖
  if (EXTENSION_COLOR_OVERRIDE[ext]) {
    return EXTENSION_COLOR_OVERRIDE[ext]
  }
  // 否则使用分类颜色
  const category = getFileCategory(ext)
  return CATEGORY_COLOR_MAP[category]
}

/**
 * 获取文件类型的可读名称
 */
export function getFileTypeName(extension: string): string {
  const ext = extension.toLowerCase()
  const category = getFileCategory(ext)
  
  const categoryNames: Record<FileCategory, string> = {
    document: '文档',
    spreadsheet: '表格',
    presentation: '演示文稿',
    image: '图片',
    video: '视频',
    audio: '音频',
    code: '代码',
    data: '数据文件',
    archive: '压缩包',
    font: '字体',
    design: '设计文件',
    executable: '可执行文件',
    unknown: '文件',
  }
  
  return categoryNames[category]
}

// ============================================================================
// FileIcon 组件
// ============================================================================

interface FileIconProps {
  /** 文件类型（扩展名） */
  fileType?: string
  /** 文件名（会自动提取扩展名） */
  fileName?: string
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 自定义 className */
  className?: string
  /** 是否显示扩展名标签 */
  showExtLabel?: boolean
  /** 是否使用 SVG 图标（如果可用） */
  preferSvg?: boolean
}

/**
 * 智能文件图标组件
 * 
 * 特点：
 * - 支持 200+ 种文件扩展名
 * - 智能分类和颜色系统
 * - 优先使用 SVG 图标，fallback 到 Lucide 图标
 * - 可选显示扩展名标签
 */
export const FileIcon: React.FC<FileIconProps> = ({ 
  fileType,
  fileName,
  size = 'md',
  className = '',
  showExtLabel = false,
  preferSvg = true,
}) => {
  const [svgLoadError, setSvgLoadError] = React.useState(false)
  
  // 从文件名或 fileType 获取扩展名
  const extension = React.useMemo(() => {
    if (fileName) {
      const ext = getFileExtension(fileName)
      if (ext) return ext
    }
    return (fileType || '').toLowerCase()
  }, [fileName, fileType])
  
  const category = getFileCategory(extension)
  const colors = getFileColor(extension)
  const IconComponent = CATEGORY_ICON_MAP[category]
  const svgPath = SVG_ICON_MAP[extension]
  
  // 优化后的尺寸：让图标在列表中更清晰可见
  const sizeClasses = {
    xs: 'w-4 h-4',     // 16px
    sm: 'w-5 h-5',     // 20px
    md: 'w-7 h-7',     // 28px - 适合表格列表
    lg: 'w-9 h-9',     // 36px
    xl: 'w-12 h-12',   // 48px
  }
  
  const labelSizeClasses = {
    xs: 'text-[6px] px-0.5',
    sm: 'text-[7px] px-0.5',
    md: 'text-[9px] px-1',
    lg: 'text-[10px] px-1',
    xl: 'text-[11px] px-1.5',
  }
  
  // 使用 SVG 图标（如果可用且未加载失败）
  if (preferSvg && svgPath && !svgLoadError) {
    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <img
          src={svgPath}
          alt={`${extension} file`}
          className={sizeClasses[size]}
          onError={() => setSvgLoadError(true)}
        />
        {showExtLabel && extension && (
          <span 
            className={cn(
              'absolute -bottom-0.5 -right-0.5 font-bold rounded uppercase leading-none',
              labelSizeClasses[size]
            )}
            style={{ 
              backgroundColor: colors.accent, 
              color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              paddingTop: '2px',
              paddingBottom: '2px',
            }}
          >
            {extension.slice(0, 4)}
          </span>
        )}
      </div>
    )
  }
  
  // Fallback: 使用 Lucide 图标
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <div 
        className={cn('flex items-center justify-center rounded-md', sizeClasses[size])}
        style={{ backgroundColor: colors.bg }}
      >
        <IconComponent 
          className={cn(
            size === 'xs' ? 'w-2.5 h-2.5' : 
            size === 'sm' ? 'w-3 h-3' : 
            size === 'md' ? 'w-5 h-5' : 
            size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'
          )}
          style={{ color: colors.text }}
        />
      </div>
      {showExtLabel && extension && (
        <span 
          className={cn(
            'absolute -bottom-0.5 -right-0.5 font-bold rounded uppercase leading-none',
            labelSizeClasses[size]
          )}
          style={{ 
            backgroundColor: colors.accent, 
            color: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            paddingTop: '2px',
            paddingBottom: '2px',
          }}
        >
          {extension.slice(0, 4)}
        </span>
      )}
    </div>
  )
}

export default FileIcon
