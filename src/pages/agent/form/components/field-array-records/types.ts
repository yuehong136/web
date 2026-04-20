import type { ReactNode } from 'react'
import type { FieldArrayPath, FieldValues, UseFieldArrayReturn } from 'react-hook-form'

export type CompactRecordContext<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = Pick<UseFieldArrayReturn<TFieldValues, TName>, 'fields' | 'append' | 'remove' | 'move' | 'insert'>

export type CompactRecordRenderer<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (args: {
  field: UseFieldArrayReturn<TFieldValues, TName>['fields'][number]
  index: number
  ctx: CompactRecordContext<TFieldValues, TName>
}) => ReactNode
