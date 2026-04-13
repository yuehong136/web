import type { ReactNode } from 'react'
import {
  Braces,
  Boxes,
  Hash,
  List,
  MessageSquareQuote,
  Sparkles,
  ToggleLeft,
  Type,
  Variable,
  Waypoints,
} from 'lucide-react'

type VariableVisualInput = {
  groupTitle?: string
  label?: string
  parentLabel?: string
  type?: string
}

function normalizeType(type?: string) {
  return (type ?? '').toLowerCase().replace(/\s+/g, '')
}

function normalizeSource(source?: string) {
  return (source ?? '').trim()
}

export function getVariableSourceInitials(source?: string) {
  const normalizedSource = normalizeSource(source)

  if (!normalizedSource) {
    return 'VR'
  }

  const segments = normalizedSource
    .replace(/[^0-9A-Za-z\u4E00-\u9FFF]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (segments.length >= 2) {
    return `${Array.from(segments[0] ?? '')[0] ?? ''}${Array.from(
      segments[1] ?? '',
    )[0] ?? ''}`.toUpperCase()
  }

  return Array.from(segments[0] ?? normalizedSource)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getVariableVisual(input: VariableVisualInput): {
  icon: ReactNode
  sourceInitials: string
} {
  const source = normalizeSource(input.parentLabel ?? input.groupTitle)
  const type = normalizeType(input.type)

  if (type.includes('array')) {
    return {
      icon: <List className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (type.includes('object') || type.includes('json')) {
    return {
      icon: <Braces className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (
    type.includes('number') ||
    type.includes('integer') ||
    type.includes('float') ||
    type.includes('double')
  ) {
    return {
      icon: <Hash className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (type.includes('boolean') || type.includes('bool')) {
    return {
      icon: <ToggleLeft className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (type.includes('string') || type.includes('text') || type.includes('line')) {
    return {
      icon: <Type className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (type.includes('file')) {
    return {
      icon: <Boxes className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (source.toLowerCase().includes('conversation')) {
    return {
      icon: <MessageSquareQuote className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (source.toLowerCase().includes('begin')) {
    return {
      icon: <Waypoints className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  if (source.toLowerCase().includes('parser')) {
    return {
      icon: <Sparkles className="size-4" />,
      sourceInitials: getVariableSourceInitials(source),
    }
  }

  return {
    icon: <Variable className="size-4" />,
    sourceInitials: getVariableSourceInitials(source || input.label),
  }
}
