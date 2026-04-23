import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import useGraphStore from '../../store'
import type { CategorizeFormValues } from './use-form-schema'

export function useWatchFormChange(
  id?: string,
  form?: UseFormReturn<CategorizeFormValues>,
) {
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (!form) {
      return
    }

    const { unsubscribe } = form.watch((value) => {
      if (!id) {
        return
      }

      updateNodeForm(id, {
        ...value,
        items: value.items?.slice() || [],
      })
    })

    return () => unsubscribe()
  }, [form, id, updateNodeForm])
}
