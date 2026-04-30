import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { A2UI_INTERNAL_DATA_PATH_PREFIX } from '../normalize'

export interface CommonProps {
  children?: ReactNode
}

export interface ActionProp {
  event?: {
    name?: string
    context?: Record<string, unknown>
  }
}

export interface ActionComponentProps {
  id?: string
  action?: ActionProp
  onAction?: (name: string, context: Record<string, unknown>) => void
}

export interface DataComponentProps {
  dataPath?: string
  onDataChange?: (path: string, value: unknown) => void
}

export const alignClassMap = {
  center: 'items-center',
  end: 'items-end',
  start: 'items-start',
  stretch: 'items-stretch',
} as const

export const justifyClassMap = {
  center: 'justify-center',
  end: 'justify-end',
  spaceAround: 'justify-around',
  spaceBetween: 'justify-between',
  spaceEvenly: 'justify-evenly',
  start: 'justify-start',
  stretch: 'justify-start',
} as const

export function toDisplayString(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

export function toNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function toBoolean(value: unknown) {
  return value === true || value === 'true'
}

export function toArray(value: unknown) {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]
}

export function toWritableDataPath(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.startsWith(A2UI_INTERNAL_DATA_PATH_PREFIX)
    ? value.slice(A2UI_INTERNAL_DATA_PATH_PREFIX.length)
    : undefined
}

export function normalizeOption(option: { label?: unknown; value?: unknown }) {
  return {
    label: toDisplayString(option.label || option.value),
    value: toDisplayString(option.value),
  }
}

export function toChildList(children: ReactNode) {
  return Array.isArray(children) ? children : children ? [children] : []
}

export function renderButtonContent(children: ReactNode) {
  const childList = toChildList(children)
  const normalizedChildren = childList.map((child, index) => {
    if (!isValidElement(child)) {
      return child
    }

    const element = child as ReactElement<{ className?: string; tone?: string }>
    return cloneElement(element, {
      key: element.key ?? index,
      className: cn(element.props.className, 'leading-none'),
      tone: 'inherit',
    })
  })

  return normalizedChildren.length ? normalizedChildren : 'Submit'
}
