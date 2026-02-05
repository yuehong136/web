import { useCallback, useMemo } from 'react'
import { AgentDialogueMode, BeginId } from '../constant'
import useGraphStore from '../store'
import type { BeginQuery } from '../types'

/**
 * 从 inputs 对象构建 BeginQuery 数组
 */
export function buildBeginInputListFromObject(
  inputs: Record<string, BeginQuery> | undefined,
): BeginQuery[] {
  if (!inputs) return []
  return Object.entries(inputs).map(([key, value]) => ({
    ...value,
    key,
  }))
}

/**
 * 获取 Begin 节点的 inputs 数据
 */
export function useSelectBeginNodeDataInputs() {
  const getNode = useGraphStore((state) => state.getNode)

  return buildBeginInputListFromObject(
    getNode(BeginId)?.data?.form?.inputs ?? {},
  )
}

/**
 * 判断是否为任务模式
 */
export function useIsTaskMode(isTask?: boolean) {
  const getNode = useGraphStore((state) => state.getNode)

  return useMemo(() => {
    if (typeof isTask === 'boolean') {
      return isTask
    }
    const node = getNode(BeginId)
    return node?.data?.form?.mode === AgentDialogueMode.Task
  }, [getNode, isTask])
}

/**
 * 获取 Begin 节点查询数据（带回调）
 */
export const useGetBeginNodeDataQuery = () => {
  const getNode = useGraphStore((state) => state.getNode)

  const getBeginNodeDataQuery = useCallback(() => {
    return buildBeginInputListFromObject(
      getNode(BeginId)?.data?.form?.inputs ?? {},
    )
  }, [getNode])

  return getBeginNodeDataQuery
}

/**
 * 获取 Begin 节点的 inputs 列表
 */
export const useGetBeginNodeDataInputs = (): BeginQuery[] => {
  const getNode = useGraphStore((state) => state.getNode)

  const inputs = getNode(BeginId)?.data?.form?.inputs ?? {}

  const beginNodeDataInputs = useMemo(() => {
    return buildBeginInputListFromObject(inputs)
  }, [inputs])

  return beginNodeDataInputs
}

/**
 * 检查 Begin 节点查询是否安全（不包含必填的文件类型）
 */
export const useGetBeginNodeDataQueryIsSafe = () => {
  const inputs = useSelectBeginNodeDataInputs()

  return useMemo(() => {
    return !inputs.some((q) => !q.optional && q.type === 'file')
  }, [inputs])
}
