export interface SwitchConditionItem {
  cpn_id: string
  operator: string
  value?: string
}

export interface SwitchCondition {
  logical_operator: string
  items?: SwitchConditionItem[]
  to?: string[]
}

export interface SwitchFormValues {
  conditions: SwitchCondition[]
  end_cpn_ids?: string[]
}

export interface ConditionCardsProps {
  name: string
  nodeId?: string
  removeParent(index: number): void
  parentIndex: number
  parentLength: number
}
