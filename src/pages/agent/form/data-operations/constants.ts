import { Operations } from '../../constant'

export const dataOperationOptions = [
  { label: 'Select Keys', value: Operations.SelectKeys },
  { label: 'Literal Eval', value: Operations.LiteralEval },
  { label: 'Combine', value: Operations.Combine },
  { label: 'Filter Values', value: Operations.FilterValues },
  { label: 'Append Or Update', value: Operations.AppendOrUpdate },
  { label: 'Remove Keys', value: Operations.RemoveKeys },
  { label: 'Rename Keys', value: Operations.RenameKeys },
]
