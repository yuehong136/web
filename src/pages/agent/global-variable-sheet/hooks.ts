import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AgentGlobalVariable } from '@/types/agent'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import { useFetchAgent } from '../hooks/use-fetch-data'
import { useSaveGraph } from '../hooks/use-save-graph'
import {
  buildGlobalVariableFromForm,
  normalizeGlobalVariables,
  type GlobalVariableFormValues,
} from './utils'

export function useGlobalVariableSheet() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: agent, refetch } = useFetchAgent()
  const { saveGraph, loading } = useSaveGraph(id, false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const variables = useMemo(
    () => normalizeGlobalVariables(agent?.dsl?.variables),
    [agent?.dsl?.variables],
  )

  const editingVariable = useMemo(
    () => (editingKey ? variables[editingKey] : null),
    [editingKey, variables],
  )

  const title = useMemo(
    () => resolveLocalizedText(agent?.title, '未命名资产'),
    [agent?.title],
  )

  const saveVariables = useCallback(
    async (nextVariables: Record<string, AgentGlobalVariable>) => {
      const saved = await saveGraph(title, undefined, {
        globalVariables: nextVariables,
      })

      if (!saved) {
        toast.error('会话变量保存失败')
        return false
      }

      await refetch()
      return true
    },
    [refetch, saveGraph, title],
  )

  const showAddModal = useCallback(() => {
    setEditingKey(null)
    setAddModalOpen(true)
  }, [])

  const showEditModal = useCallback((key: string) => {
    setEditingKey(key)
    setAddModalOpen(true)
  }, [])

  const hideAddModal = useCallback(() => {
    setAddModalOpen(false)
    setEditingKey(null)
  }, [])

  const handleSubmit = useCallback(
    async (values: GlobalVariableFormValues) => {
      const variable = buildGlobalVariableFromForm(values)
      const nextVariables = { ...variables }
      if (editingKey && editingKey !== variable.name) {
        delete nextVariables[editingKey]
      }
      nextVariables[variable.name || values.name] = variable

      if (await saveVariables(nextVariables)) {
        hideAddModal()
      }
    },
    [editingKey, hideAddModal, saveVariables, variables],
  )

  const handleDelete = useCallback(
    async (key: string) => {
      const nextVariables = { ...variables }
      delete nextVariables[key]
      await saveVariables(nextVariables)
    },
    [saveVariables, variables],
  )

  return {
    variables,
    loading,
    addModalOpen,
    editingVariable,
    showAddModal,
    showEditModal,
    hideAddModal,
    handleSubmit,
    handleDelete,
  }
}
