import { useCallback } from 'react'
import useGraphStore from '../store'

/**
 * Hook for exporting agent flow as JSON
 */
export const useExportJson = () => {
  const { nodes, edges } = useGraphStore((state) => state)

  const exportToJson = useCallback(() => {
    const data = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        parentId: node.parentId,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      version: '1.0',
      exportedAt: new Date().toISOString(),
    }

    return JSON.stringify(data, null, 2)
  }, [nodes, edges])

  const downloadJson = useCallback(
    (filename: string = 'agent-flow.json') => {
      const json = exportToJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
    },
    [exportToJson],
  )

  return {
    exportToJson,
    downloadJson,
  }
}
