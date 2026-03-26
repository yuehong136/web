import {
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
} from 'lucide-react'

/**
 * 根据文件扩展名获取对应的图标组件
 */
export function getFileIcon(fileName: string | undefined) {
  if (!fileName) return FileIcon
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  if (ext === 'pdf') return FileText
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return FileText
  if (['txt', 'md', 'mdx', 'log', 'conf'].includes(ext)) return FileText
  if (['epub', 'eml'].includes(ext)) return FileText
  if (['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext)) return FileSpreadsheet
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext)) return FileImage
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'htm', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'xml', 'yml', 'yaml', 'sql'].includes(ext)) return FileCode
  if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'rmvb'].includes(ext)) return FileVideo
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return FileAudio
  if (['ppt', 'pptx', 'odp'].includes(ext)) return FileText

  return FileIcon
}

/**
 * 获取文件扩展名的显示颜色
 */
export function getFileColor(fileName: string | undefined): { bg: string; text: string; accent: string } {
  const defaultColor = {
    bg: 'rgba(107, 114, 128, 0.1)',
    text: 'var(--color-text-tertiary)',
    accent: 'var(--color-text-tertiary)',
  }
  if (!fileName) return defaultColor

  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const colors = {
    red: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', accent: '#ef4444' },
    blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },
    green: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', accent: '#22c55e' },
    gray: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', accent: '#6b7280' },
    purple: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', accent: '#8b5cf6' },
    orange: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },
    pink: { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', accent: '#ec4899' },
    violet: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', accent: '#a855f7' },
    teal: { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', accent: '#14b8a6' },
    yellow: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },
    indigo: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', accent: '#6366f1' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', accent: '#f59e0b' },
  }

  const colorMap: Record<string, { bg: string; text: string; accent: string }> = {
    pdf: colors.red,
    doc: colors.blue, docx: colors.blue, odt: colors.blue, rtf: colors.blue,
    xls: colors.green, xlsx: colors.green, csv: colors.green, tsv: colors.green, ods: colors.green,
    ppt: colors.orange, pptx: colors.orange, odp: colors.orange,
    txt: colors.gray, log: colors.gray, conf: colors.gray,
    md: colors.purple, mdx: colors.purple, epub: colors.purple, eml: colors.gray,
    jpg: colors.pink, jpeg: colors.pink, png: colors.pink, gif: colors.pink, webp: colors.pink,
    bmp: colors.pink, tiff: colors.pink, tif: colors.pink, ico: colors.pink, svg: colors.pink,
    mp4: colors.violet, avi: colors.violet, mkv: colors.violet, mov: colors.violet,
    webm: colors.violet, flv: colors.violet, rmvb: colors.violet,
    mp3: colors.teal, wav: colors.teal, ogg: colors.teal, flac: colors.teal, aac: colors.teal, m4a: colors.teal,
    json: colors.yellow, js: colors.yellow, jsx: colors.yellow,
    ts: colors.blue, tsx: colors.blue, css: colors.blue, py: colors.blue, cpp: colors.blue, c: colors.blue,
    html: colors.orange, htm: colors.orange, java: colors.orange, rs: colors.orange,
    xml: colors.indigo, yml: colors.indigo, yaml: colors.indigo,
    sql: colors.amber, go: colors.teal,
  }

  return colorMap[ext] || defaultColor
}
