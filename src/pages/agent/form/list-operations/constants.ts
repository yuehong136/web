import { ListOperations } from '../../constant'

export const countOperations = new Set<string>([
  ListOperations.Nth,
  ListOperations.TopN,
  ListOperations.Head,
  ListOperations.Tail,
])

export function getListOperationValues(legacy: boolean) {
  return [
    legacy ? ListOperations.TopN : ListOperations.Nth,
    ListOperations.Head,
    ListOperations.Tail,
    ListOperations.Filter,
    ListOperations.Sort,
    ListOperations.DropDuplicates,
  ]
}
