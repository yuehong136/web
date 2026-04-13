import { isValidElement, type ReactNode } from 'react'

function flattenReactNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(flattenReactNodeText).join(' ')
  }

  if (isValidElement(node)) {
    return flattenReactNodeText(node.props.children)
  }

  return ''
}

export function buildOptionSearchKeywords(
  label: ReactNode,
  extras: Array<string | undefined> = [],
): string[] {
  const keywords = [flattenReactNodeText(label), ...extras]
    .map((item) => item?.trim())
    .filter(Boolean) as string[]

  return Array.from(new Set(keywords))
}
