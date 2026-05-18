import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DocumentListState, FilterCollection, FilterType } from '../types'
import { EMPTY_METADATA_FIELD, runStatusOptions } from '../constants'

export const sanitizeFilterValueByCollections = (
  value: DocumentListState['filterValue'],
  collections: FilterCollection[],
): DocumentListState['filterValue'] => {
  const baseAllowedMap = collections.reduce<Record<string, Set<string>>>(
    (pre, cur) => {
      if (cur.field !== 'metadata') {
        pre[cur.field] = new Set(cur.list.map((item) => item.id.toString()))
      }
      return pre
    },
    {},
  )

  const metadataAllowedMap =
    collections
      .find((item) => item.field === 'metadata')
      ?.list.reduce<Record<string, Set<string>>>((pre, field) => {
        pre[field.id.toString()] = new Set(
          (field.list || []).map((subItem) => subItem.id.toString()),
        )
        return pre
      }, {}) || {}

  const nextValue: DocumentListState['filterValue'] = {}

  Object.entries(value).forEach(([key, rawValue]) => {
    if (key === 'metadata') {
      if (
        rawValue &&
        typeof rawValue === 'object' &&
        !Array.isArray(rawValue)
      ) {
        const nextMetadata: Record<string, string[]> = {}

        Object.entries(rawValue).forEach(([fieldKey, fieldValues]) => {
          const allowedValues = metadataAllowedMap[fieldKey]
          if (!allowedValues || !Array.isArray(fieldValues)) return

          const filtered = fieldValues.filter((item) => allowedValues.has(item))
          if (filtered.length > 0) {
            nextMetadata[fieldKey] = filtered
          }
        })

        nextValue[key] = nextMetadata
      } else {
        nextValue[key] = {}
      }
      return
    }

    const allowed = baseAllowedMap[key]
    if (!Array.isArray(rawValue) || !allowed) {
      nextValue[key] = Array.isArray(rawValue) ? rawValue : []
      return
    }

    nextValue[key] = rawValue.filter((item) => allowed.has(item))
  })

  return nextValue
}

export const isSameFilterValue = (
  left: DocumentListState['filterValue'],
  right: DocumentListState['filterValue'],
): boolean => {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function useFilterCollections(
  filterOptions: DocumentListState['filterOptions'],
): FilterCollection[] {
  const { t } = useTranslation()

  return useMemo<FilterCollection[]>(() => {
    if (!filterOptions) {
      return [
        {
          field: 'type',
          label: t('knowledge.documents.filters.fileType'),
          list: [],
        },
        {
          field: 'run',
          label: t('knowledge.documents.filters.taskStatus'),
          list: runStatusOptions.map((o) => ({
            id: o.value,
            label: t(o.labelKey),
          })),
        },
        {
          field: 'metadata',
          label: t('knowledge.documents.filters.metadata'),
          canSearch: true,
          list: [],
        },
      ]
    }

    const fileTypes: FilterType[] = filterOptions.suffix
      ? Object.entries(filterOptions.suffix).map(([suffix, count]) => ({
          id: suffix,
          label: suffix.toUpperCase(),
          count,
        }))
      : []

    const fileStatus: FilterType[] = []

    if (filterOptions.run_status) {
      Object.entries(filterOptions.run_status).forEach(([status, count]) => {
        const labelKey = runStatusOptions.find(
          (o) => o.value === status,
        )?.labelKey

        fileStatus.push({
          id: status,
          label: labelKey
            ? t(labelKey)
            : t('knowledge.documents.filters.statusFallback', { status }),
          count,
        })
      })
    }

    const emptyMetadataInfo = filterOptions.metadata?.[EMPTY_METADATA_FIELD]
    if (emptyMetadataInfo) {
      const emptyCount = emptyMetadataInfo.true ?? 0
      if (emptyCount > 0) {
        fileStatus.push({
          id: EMPTY_METADATA_FIELD,
          label: t('knowledge.documents.filters.noMetadata'),
          count: emptyCount,
        })
      }
    }

    const metaDataList: FilterType[] = filterOptions.metadata
      ? Object.entries(filterOptions.metadata)
          .filter(([fieldName]) => fieldName !== EMPTY_METADATA_FIELD)
          .map(([fieldName, fieldValues]) => ({
            id: fieldName,
            field: fieldName,
            label: fieldName,
            list: Object.entries(fieldValues).map(([value, count]) => ({
              id: value,
              field: value,
              label: value,
              value: [value],
              count,
            })),
            count: Object.values(fieldValues).reduce((acc, c) => acc + c, 0),
          }))
      : []

    return [
      {
        field: 'type',
        label: t('knowledge.documents.filters.fileType'),
        list: fileTypes,
      },
      {
        field: 'run',
        label: t('knowledge.documents.filters.taskStatus'),
        list: fileStatus,
      },
      {
        field: 'metadata',
        label: t('knowledge.documents.filters.metadata'),
        canSearch: true,
        list: metaDataList,
      },
    ]
  }, [filterOptions, t])
}

export function useFilterGroup(): Record<string, string[]> {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      [t('knowledge.documents.filters.system')]: ['type', 'run'],
    }),
    [t],
  )
}
