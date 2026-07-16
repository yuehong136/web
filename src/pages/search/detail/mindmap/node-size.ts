import type { MindmapTreeNode } from './utils'

const ROOT_ID = 'root'

export type MindmapNodeSize = [number, number]

enum MindmapNodeMetric {
  BASE_SIZE = 20,
  CHARACTER_WIDTH = 6,
  MAX_WIDTH = 400,
  MIN_WIDTH = 60,
  ROOT_MIN_WIDTH = 100,
}

export const getMindmapNodeSize = (
  labelText: string,
  isRoot = false,
): MindmapNodeSize => {
  const lines = labelText.split(/\r\n?|\n/)
  const maxLineLength = lines.reduce(
    (maxLength, line) => Math.max(maxLength, Array.from(line).length),
    0,
  )
  const minWidth = isRoot
    ? MindmapNodeMetric.ROOT_MIN_WIDTH
    : MindmapNodeMetric.MIN_WIDTH
  const width = Math.min(
    Math.max(
      maxLineLength * MindmapNodeMetric.CHARACTER_WIDTH +
        MindmapNodeMetric.BASE_SIZE,
      minWidth,
    ),
    MindmapNodeMetric.MAX_WIDTH,
  )
  const height = Math.max(
    lines.length * MindmapNodeMetric.BASE_SIZE,
    MindmapNodeMetric.BASE_SIZE,
  )

  return [width, height]
}

export const buildMindmapNodeSizeMap = (
  tree: MindmapTreeNode,
): Map<string, MindmapNodeSize> => {
  const sizes = new Map<string, MindmapNodeSize>()

  const visit = (node: MindmapTreeNode) => {
    if (typeof node.id === 'string') {
      const labelText =
        typeof node.labelText === 'string' && node.labelText.length > 0
          ? node.labelText
          : node.id
      sizes.set(node.id, getMindmapNodeSize(labelText, node.id === ROOT_ID))
    }
    node.children?.forEach(visit)
  }

  visit(tree)
  return sizes
}
