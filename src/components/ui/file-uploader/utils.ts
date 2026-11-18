import { FILE_TONES } from '../file-tones'
import {
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
} from 'lucide-react'

export function getFileIcon(fileName: string | undefined) {
  if (!fileName) return FileIcon
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  if (ext === 'pdf') return FileText
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return FileText
  if (['txt', 'md', 'mdx', 'log', 'conf'].includes(ext)) return FileText
  if (['epub', 'eml'].includes(ext)) return FileText
  if (['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext)) return FileSpreadsheet
  if (
    [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'bmp',
      'ico',
      'tiff',
      'tif',
    ].includes(ext)
  )
    return FileImage
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'json',
      'html',
      'htm',
      'css',
      'py',
      'java',
      'cpp',
      'c',
      'go',
      'rs',
      'xml',
      'yml',
      'yaml',
      'sql',
    ].includes(ext)
  )
    return FileCode
  if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'rmvb'].includes(ext))
    return FileVideo
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext))
    return FileAudio
  if (['ppt', 'pptx', 'odp'].includes(ext)) return FileText

  return FileIcon
}

export function getFileColor(fileName: string | undefined): {
  bg: string
  text: string
  accent: string
} {
  const defaultColor = FILE_TONES.gray
  if (!fileName) return defaultColor

  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const colors = {
    ...FILE_TONES,
    violet: FILE_TONES.purple,
    indigo: FILE_TONES.blue,
    amber: FILE_TONES.orange,
  }

  const colorMap: Record<string, { bg: string; text: string; accent: string }> =
    {
      pdf: colors.red,
      doc: colors.blue,
      docx: colors.blue,
      odt: colors.blue,
      rtf: colors.blue,
      xls: colors.green,
      xlsx: colors.green,
      csv: colors.green,
      tsv: colors.green,
      ods: colors.green,
      ppt: colors.orange,
      pptx: colors.orange,
      odp: colors.orange,
      txt: colors.gray,
      log: colors.gray,
      conf: colors.gray,
      md: colors.purple,
      mdx: colors.purple,
      epub: colors.purple,
      eml: colors.gray,
      jpg: colors.pink,
      jpeg: colors.pink,
      png: colors.pink,
      gif: colors.pink,
      webp: colors.pink,
      bmp: colors.pink,
      tiff: colors.pink,
      tif: colors.pink,
      ico: colors.pink,
      svg: colors.pink,
      mp4: colors.violet,
      avi: colors.violet,
      mkv: colors.violet,
      mov: colors.violet,
      webm: colors.violet,
      flv: colors.violet,
      rmvb: colors.violet,
      mp3: colors.teal,
      wav: colors.teal,
      ogg: colors.teal,
      flac: colors.teal,
      aac: colors.teal,
      m4a: colors.teal,
      json: colors.yellow,
      js: colors.yellow,
      jsx: colors.yellow,
      ts: colors.blue,
      tsx: colors.blue,
      css: colors.blue,
      py: colors.blue,
      cpp: colors.blue,
      c: colors.blue,
      html: colors.orange,
      htm: colors.orange,
      java: colors.orange,
      rs: colors.orange,
      xml: colors.indigo,
      yml: colors.indigo,
      yaml: colors.indigo,
      sql: colors.amber,
      go: colors.teal,
    }

  return colorMap[ext] || defaultColor
}
