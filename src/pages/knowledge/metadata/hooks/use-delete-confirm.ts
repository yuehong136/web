import { useCallback, useMemo, useState } from 'react'

interface DeleteConfirmState {
  open: boolean
  title: string
  name: string
  warnText: string
  onConfirm: () => void
}

const EMPTY_STATE: DeleteConfirmState = {
  open: false,
  title: '',
  name: '',
  warnText: '',
  onConfirm: () => {},
}

export interface UseDeleteConfirmReturn {
  state: DeleteConfirmState
  show: (
    title: string,
    name: string,
    warnText: string,
    onConfirm: () => void,
  ) => void
  hide: () => void
}

export function useDeleteConfirm(): UseDeleteConfirmReturn {
  const [state, setState] = useState<DeleteConfirmState>(EMPTY_STATE)

  const hide = useCallback(() => {
    setState(EMPTY_STATE)
  }, [])

  const show = useCallback<UseDeleteConfirmReturn['show']>(
    (title, name, warnText, onConfirm) => {
      setState({
        open: true,
        title,
        name,
        warnText,
        onConfirm: () => {
          setState(EMPTY_STATE)
          onConfirm()
        },
      })
    },
    [],
  )

  return useMemo(() => ({ state, show, hide }), [state, show, hide])
}
