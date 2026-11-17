import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MindmapLabels } from './utils'

/** Names for unnamed mind map nodes in the current interface language. */
export function useMindmapLabels(): MindmapLabels {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      root: t('searchPage.workspace.mapRoot'),
      untitled: t('searchPage.workspace.mapUntitled'),
      node: (index: number) => t('searchPage.workspace.mapNode', { index }),
      untitledDocument: t('searchPage.workspace.mapUntitledDocument'),
    }),
    [t],
  )
}
