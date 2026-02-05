import { useUpdateNodeInternals } from '@xyflow/react'
import { get } from 'lodash'
import { useEffect, useMemo } from 'react'
import type { ICategorizeItem, RAGFlowNodeType } from '../../types'

export const useBuildCategorizeHandlePositions = ({
  data,
  id,
}: {
  id: string
  data: RAGFlowNodeType['data']
}) => {
  const updateNodeInternals = useUpdateNodeInternals()

  const items: ICategorizeItem[] = useMemo(() => {
    return get(data, 'form.items', [])
  }, [data])

  const positions = useMemo(() => {
    const list: Array<{ top: number; name: string; uuid: string }> & ICategorizeItem[] =
      []

    items.forEach((x, idx) => {
      list.push({
        ...x,
        name: x.name ?? `Category ${idx + 1}`,
        uuid: x.uuid ?? `cat-${idx}`,
        top: idx === 0 ? 86 : list[idx - 1].top + 8 + 24,
      })
    })

    return list
  }, [items])

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, updateNodeInternals, items])

  return { positions }
}
