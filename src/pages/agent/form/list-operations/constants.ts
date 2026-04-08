import { ListOperations } from '../../constant'

export const listOperationOptions = [
  { label: 'Top N', value: ListOperations.TopN },
  { label: 'Head', value: ListOperations.Head },
  { label: 'Tail', value: ListOperations.Tail },
  { label: 'Filter', value: ListOperations.Filter },
  { label: 'Sort', value: ListOperations.Sort },
  { label: 'Drop Duplicates', value: ListOperations.DropDuplicates },
]
